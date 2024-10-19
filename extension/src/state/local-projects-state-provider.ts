import path from 'pathe'
import * as vscode from 'vscode'
import {ContextId, FilePattern, projectJsonPath} from '../constants'
import {ExtensionConfiguration, OnDidChangeFilesExcludeEvent} from '../extension-configuration'
import {ContextKeys, Injectable, Logger, type WatchedFileChangeEvent} from '../lib'
import {LocalProject} from '../models/local-project'
import {diffArrays, naiveGlobMatch, normalizePath, readJsonFile, settleAllPromises} from '../utils'
import {PromiseQueue} from '../utils/promise-queue'
import {isValidProjectJson} from '../utils/validation'
import {FileWatchersStateProvider} from './file-watchers-state-provider'
import {FoldersStateProvider} from './folders-state-provider'

export type OnDidChangeLocalProjectEvent = {
  added: readonly LocalProject[]
  removed: readonly LocalProject[]
  changed: readonly LocalProject[]
}

/**
 * Manages {@link LocalProject}s. This is one of the only three state providers that doesn't require
 * user authentication.
 */
@Injectable()
export class LocalProjectsStateProvider implements vscode.Disposable {
  private readonly logger = new Logger(LocalProjectsStateProvider.name)
  private _localProjects: LocalProject[] = []
  private readonly onDidChangeLocalProjectsEventEmitter = new vscode.EventEmitter<OnDidChangeLocalProjectEvent>()
  private readonly disposable: vscode.Disposable

  constructor(
    private readonly contextKeys: ContextKeys,
    private readonly extensionConfig: ExtensionConfiguration,
    private readonly fileWatchersState: FileWatchersStateProvider,
    private readonly foldersState: FoldersStateProvider,
  ) {
    // We use a queue here because local projects are updated based on file-system events, which can
    // get fired in quick succession but we'll process them one at a time.
    const updateLocalProjectsQueue = new PromiseQueue()

    this.disposable = vscode.Disposable.from(
      this.foldersState.onDidChangeFolders((event) => {
        void updateLocalProjectsQueue.enqueue(() => this.updateLocalProjectsWhenFoldersChanged(event))
      }),
      this.fileWatchersState.onDidChangeWatchedFiles((event) => {
        void updateLocalProjectsQueue.enqueue(() => this.updateLocalProjectsWhenWatchedFilesChanged(event))
      }),
      this.extensionConfig.onDidChangeFilesExclude((event) => {
        void updateLocalProjectsQueue.enqueue(() => this.updateLocalProjectsWhenConfigChanged(event))
      }),
      this.onDidChangeLocalProjectsEventEmitter.event(() => {
        const noProjectsFound = this._localProjects.length === 0
        void this.contextKeys.set(ContextId.NoProjectsFound, noProjectsFound)
      }),
    )
  }

  dispose() {
    this.disposable.dispose()
    this.onDidChangeLocalProjectsEventEmitter.dispose()
  }

  get localProjects() {
    return this._localProjects
  }

  get onDidChangeLocalProjects() {
    return this.onDidChangeLocalProjectsEventEmitter.event
  }

  async loadLocalProjectsWithoutEvents() {
    this._localProjects = await this.getProjectsFromMultipleWorkspaceFolders(this.foldersState.folders)
  }

  private async updateLocalProjectsWhenConfigChanged(_event: OnDidChangeFilesExcludeEvent) {
    // It's no longer worth it to read event and filter out projects as that means we need to parse
    // complex glob patterns so just reload & emit an event on diff.
    const oldLocalProjects = this._localProjects
    await this.loadLocalProjectsWithoutEvents()

    const newEvent = diffArrays(oldLocalProjects, this._localProjects, (a, b) => a.id === b.id)
    const hasChanged = newEvent && newEvent.added.length + newEvent.removed.length > 0
    if (hasChanged) this.onDidChangeLocalProjectsEventEmitter.fire({...newEvent, changed: []})
  }

  private async updateLocalProjectsWhenFoldersChanged(event: vscode.WorkspaceFoldersChangeEvent) {
    let added: LocalProject[] = []
    let removed: LocalProject[] = []

    if (event.added.length > 0) {
      added = await this.getProjectsFromMultipleWorkspaceFolders(event.added)
      this._localProjects.push(...added)
    }

    if (event.removed.length > 0) {
      removed = this._localProjects.filter((project) => {
        const isBeingRemoved = event.removed.some((folder) => folder.uri.path === project.folder.uri.path)
        return isBeingRemoved
      })

      if (removed.length > 0) {
        this._localProjects = this._localProjects.filter((project) => {
          const isBeingRemoved = removed.some((tbr) => tbr.id === project.id)
          return !isBeingRemoved
        })
      }
    }

    const isNotEmptyEvent = added.length + removed.length > 0
    if (isNotEmptyEvent) this.onDidChangeLocalProjectsEventEmitter.fire({added, removed, changed: []})
  }

  private async updateLocalProjectsWhenWatchedFilesChanged(event: WatchedFileChangeEvent) {
    // We only watch for two file patterns, it's either the `.vercel/project.json` file or `.vercel` directory.
    const dotVercelDirectory = event.pattern === FilePattern.ProjectJson ? path.dirname(event.uri.path) : event.uri.path

    const projectRootPath = normalizePath(path.dirname(dotVercelDirectory))
    const foundIndex = this._localProjects.findIndex((project) => project.uri.path === projectRootPath)

    const invalid =
      (event.type === 'delete' && foundIndex === -1) ||
      (event.type === 'change' && foundIndex === -1) ||
      (event.type === 'create' && foundIndex !== -1)
    if (invalid) return

    switch (event.type) {
      case 'delete': {
        const removed = this._localProjects.splice(foundIndex, 1)
        this.onDidChangeLocalProjectsEventEmitter.fire({
          added: [],
          removed,
          changed: [],
        })
        return
      }

      case 'change':
      case 'create': {
        const filesExclude = this.extensionConfig.filesExclude
        const excluded = filesExclude.some((glob) => naiveGlobMatch(projectRootPath, glob))
        if (excluded) return

        const newProject = await this.getLocalProject(vscode.Uri.parse(projectRootPath))
        if (!newProject) return

        if (event.type === 'change') {
          this._localProjects.splice(foundIndex, 1, newProject)
          this.onDidChangeLocalProjectsEventEmitter.fire({
            added: [],
            removed: [],
            changed: [newProject],
          })
        } else {
          // assert: event.type === 'create'

          this._localProjects.push(newProject)
          this.onDidChangeLocalProjectsEventEmitter.fire({
            added: [newProject],
            removed: [],
            changed: [],
          })
        }
      }
    }
  }

  private async getLocalProject(uri: vscode.Uri, _folder?: vscode.WorkspaceFolder) {
    const folder = _folder ?? this.foldersState.getParentFolder(uri)
    if (!folder) return

    const projectJson = await readJsonFile(vscode.Uri.joinPath(uri, projectJsonPath))
    if (!isValidProjectJson(projectJson)) return

    return new LocalProject(uri, folder, projectJson)
  }

  private async getProjectsFromWorkspaceFolder(folder: vscode.WorkspaceFolder) {
    const filesExcludeGlob = `{${this.extensionConfig.filesExclude.join(',')}}`
    const projectRoots = await vscode.workspace
      // No one should have more than 100 Vercel projects in a single monorepo!
      .findFiles(new vscode.RelativePattern(folder, FilePattern.ProjectJson), filesExcludeGlob, 100)
      .then((projectJsonFiles) =>
        projectJsonFiles.map((uri) => {
          const projectRoot = uri.path.replace(new RegExp(`${projectJsonPath}$`, 'i'), '')
          return uri.with({path: normalizePath(projectRoot)})
        }),
      )

    const [projects, throws] = await settleAllPromises(projectRoots.map((uri) => this.getLocalProject(uri, folder)))
    for (const error of throws) this.logger.error(error.message)

    return projects
  }

  private async getProjectsFromMultipleWorkspaceFolders(folders: readonly vscode.WorkspaceFolder[]) {
    // biome-ignore format: Easier to read in one line.
    const [projects, throws] = await settleAllPromises(folders.map((folder) => this.getProjectsFromWorkspaceFolder(folder)))
    for (const error of throws) this.logger.error(error.message)

    return projects.flat()
  }
}

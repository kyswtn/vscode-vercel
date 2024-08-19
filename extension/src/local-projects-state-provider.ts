import path from 'pathe'
import * as vscode from 'vscode'
import {FilePattern, projectJsonPath} from './constants'
import {FileWatchersStateProvider} from './file-watchers-state-provider'
import {FoldersStateProvider} from './folders-state-provider'
import {Injectable, Logger, type WatchedFileChangeEvent} from './lib'
import type {ProjectJson} from './types'
import {naiveHash, normalizePath, settleAllPromises} from './utils'
import {PromiseQueue} from './utils/promise-queue'
import {isValidProjectJson} from './utils/validation'
import {readJsonFile} from './utils/vscode'

export class LocalProject {
  readonly id: string

  constructor(
    readonly uri: vscode.Uri,
    readonly folder: vscode.WorkspaceFolder,
    readonly projectJson: ProjectJson,
  ) {
    // URI itself might be a problem to be used as an ID because it might not be normalized (i.e. it
    // might contain white spaces, trailing slashes etc). We don't use a UUID here because we want to
    // cache the project state across sessions and windows.
    this.id = naiveHash(normalizePath(uri.path))
  }
}

export type OnDidChangeLocalProjectEvent = {
  added: readonly LocalProject[]
  removed: readonly LocalProject[]
  changed: readonly LocalProject[]
}

@Injectable()
export class LocalProjectsStateProvider implements vscode.Disposable {
  private readonly logger = new Logger(LocalProjectsStateProvider.name)
  private _localProjects: LocalProject[] = []
  private readonly onDidChangeLocalProjectsEventEmitter = new vscode.EventEmitter<OnDidChangeLocalProjectEvent>()
  private readonly disposable: vscode.Disposable

  constructor(
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

  async loadLocalProjects() {
    this._localProjects = await this.getProjectsFromMultipleWorkspaceFolders(this.foldersState.folders)
  }

  private async updateLocalProjectsWhenFoldersChanged(event: vscode.WorkspaceFoldersChangeEvent) {
    const newEvent: OnDidChangeLocalProjectEvent = {
      added: [],
      removed: [],
      changed: [],
    }

    if (event.added.length > 0) {
      const toBeAdded = await this.getProjectsFromMultipleWorkspaceFolders(event.added)

      if (toBeAdded.length > 0) {
        this._localProjects.push(...toBeAdded)
        newEvent.added = toBeAdded
      }
    }

    if (event.removed.length > 0) {
      const toBeRemoved = this._localProjects.filter((project) => {
        const isBeingRemoved = event.removed.some((folder) => folder.uri.path === project.folder.uri.path)
        return isBeingRemoved
      })

      if (toBeRemoved.length > 0) {
        this._localProjects = this._localProjects.filter((project) => {
          const isBeingRemoved = toBeRemoved.some((tbr) => tbr.id === project.id)
          return !isBeingRemoved
        })
        newEvent.removed = toBeRemoved
      }
    }

    const isNotEmptyEvent = newEvent.added.length + newEvent.removed.length + newEvent.changed.length > 0
    if (isNotEmptyEvent) this.onDidChangeLocalProjectsEventEmitter.fire(newEvent)
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

  private async getProjectsFromMultipleWorkspaceFolders(folders: readonly vscode.WorkspaceFolder[]) {
    // biome-ignore format: Easier to read in one line.
    const [projects, throws] = await settleAllPromises(folders.map((folder) => this.getProjectsFromWorkspaceFolder(folder)))
    for (const error of throws) this.logger.error(error.message)

    return projects.flat()
  }

  private async getProjectsFromWorkspaceFolder(folder: vscode.WorkspaceFolder) {
    const projectRoots = await vscode.workspace
      .findFiles(new vscode.RelativePattern(folder, FilePattern.ProjectJson))
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
}

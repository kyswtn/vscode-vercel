import * as vscode from 'vscode'
import {ContextId} from './constants'
import {ContextKeys, Injectable} from './lib'
import {LinkedProjectsStateProvider} from './linked-projects-state-provider'
import {diffArrays, uniqueBy} from './utils'
import {VercelProject} from './vercel-project'

export type OnDidChangeProjectsEvent = {
  added: readonly VercelProject[]
  removed: readonly VercelProject[]
}

@Injectable()
export class ProjectsStateProvider implements vscode.Disposable {
  private _projects: VercelProject[] = []
  private readonly onDidChangeProjectsEventEmitter = new vscode.EventEmitter<OnDidChangeProjectsEvent>()
  private readonly disposable: vscode.Disposable

  constructor(
    private readonly contextKeys: ContextKeys,
    private readonly linkedProjectsState: LinkedProjectsStateProvider,
  ) {
    this.disposable = vscode.Disposable.from(
      this.linkedProjectsState.onDidChangeLinkedProjects(() => {
        // biome-ignore format: Single line reads better.
        const linkedProjects = uniqueBy(this.linkedProjectsState.linkedProjects.map((project) => project.remote), 'id')
        const diff = diffArrays(this._projects, linkedProjects, (l, r) => l.id === r.id)

        if (diff) {
          this._projects = linkedProjects
          this.onDidChangeProjectsEventEmitter.fire(diff)
        }
      }),
      this.onDidChangeProjectsEventEmitter.event(() => {
        const noProjectsFound = this._projects.length === 0
        void this.contextKeys.set(ContextId.NoProjectsFound, noProjectsFound)
      }),
    )
  }

  get projects() {
    return this._projects
  }

  get onDidChangeProjects() {
    return this.onDidChangeProjectsEventEmitter.event
  }

  loadProjectsOnBootstrap() {
    const linkedRemoteProjects = this.linkedProjectsState.linkedProjects.map((project) => project.remote)
    this._projects = uniqueBy(linkedRemoteProjects, 'id')
  }

  dispose() {
    this.disposable.dispose()
    this.onDidChangeProjectsEventEmitter.dispose()
  }
}

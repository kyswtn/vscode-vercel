import * as vscode from 'vscode'
import {Injectable} from '../lib'
import {VercelProject} from '../models/vercel-project'
import {diffArrays, uniqueBy} from '../utils'
import {LinkedProjectsStateProvider} from './linked-projects-state-provider'
import {VercelApiClient} from '../vercel-api-client'
import {VercelApiError} from '../utils/errors'

export type OnDidChangeProjectsEvent = {
  added: readonly VercelProject[]
  removed: readonly VercelProject[]
}

/**
 * Filters out duplicated remote projects from linked projects and returns only the remote part.
 */
@Injectable()
export class ProjectsStateProvider implements vscode.Disposable {
  private _projects: VercelProject[] = []
  private readonly onDidChangeProjectsEventEmitter = new vscode.EventEmitter<OnDidChangeProjectsEvent>()
  private readonly disposable: vscode.Disposable

  constructor(
    private readonly linkedProjectsState: LinkedProjectsStateProvider,
    private readonly vercelApi: VercelApiClient,
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
    )
  }

  dispose() {
    this.disposable.dispose()
    this.onDidChangeProjectsEventEmitter.dispose()
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

  async getProjectOrFetch(projectId: string, accessToken: string, teamId: string) {
    const existing = this._projects.find((project) => project.id === projectId)
    if (existing) return existing

    try {
      const project = await this.vercelApi.getProjectByNameOrId(projectId, accessToken, teamId)
      return new VercelProject(project)
    } catch (error) {
      if (error instanceof VercelApiError && error.status === 404) return
      throw error
    }
  }
}

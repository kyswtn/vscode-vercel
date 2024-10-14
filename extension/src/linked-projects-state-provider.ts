import * as vscode from 'vscode'
import {AuthenticationStateProvider} from './authentication-state-provider'
import {Injectable, Logger} from './lib'
import {LocalProject, LocalProjectsStateProvider, OnDidChangeLocalProjectEvent} from './local-projects-state-provider'
import type {CustomAuthenticationSession, PlainVercelProject, ProjectJson} from './types'
import {settleAllPromises, uniqueBy} from './utils'
import {LoadingState} from './utils/loading-state'
import {isValidVercelProject} from './utils/validation'
import {VercelApiClient} from './vercel-api-client'
import {VercelProject} from './vercel-project'

export class LinkedProject {
  local: LocalProject
  remote: VercelProject

  constructor(local: LocalProject, remote: PlainVercelProject) {
    this.local = local
    this.remote = new VercelProject(remote)
  }
}

@Injectable()
export class LinkedProjectsStateProvider implements vscode.Disposable {
  private readonly logger = new Logger(LinkedProjectsStateProvider.name)
  private readonly projectsLoadingState = new LoadingState()
  private _linkedProjects: LinkedProject[] = []
  private readonly onWillChangeLinkedProjectsEventEmitter = new vscode.EventEmitter<void>()
  private readonly onDidChangeLinkedProjectsEventEmitter = new vscode.EventEmitter<void>()
  private readonly disposable: vscode.Disposable

  constructor(
    private readonly authState: AuthenticationStateProvider,
    private readonly localProjectsState: LocalProjectsStateProvider,
    private readonly vercelApi: VercelApiClient,
  ) {
    this.disposable = vscode.Disposable.from(
      this.authState.onDidChangeCurrentSession((currentSession) => {
        if (currentSession) {
          void this.linkLocalProjects()
        } else {
          this.onWillChangeLinkedProjectsEventEmitter.fire()
          this._linkedProjects = []
          this.onDidChangeLinkedProjectsEventEmitter.fire()
        }
      }),
      this.localProjectsState.onDidChangeLocalProjects((event) => {
        void this.updateLinkedProjectsWhenLocalProjectsChanged(event)
      }),
    )
  }

  dispose() {
    this.disposable.dispose()
    this.onWillChangeLinkedProjectsEventEmitter.dispose()
  }

  get linkedProjects() {
    return this._linkedProjects
  }

  get onWillChangeLinkedProjects() {
    return this.onWillChangeLinkedProjectsEventEmitter.event
  }

  get loadingPromise() {
    return this.projectsLoadingState.loadingPromise
  }

  get onDidChangeLinkedProjects() {
    return this.onDidChangeLinkedProjectsEventEmitter.event
  }

  async linkLocalProjectsOnBootstrap() {
    await this.linkLocalProjects(undefined, true)
  }

  async reloadProjects() {
    await this.linkLocalProjects(/* right after */ () => this.localProjectsState.loadLocalProjectsWithoutEvents())
  }

  private async linkLocalProjects(fnToRunBeforeLink?: () => Promise<void>, bootstrap = false) {
    const promise = this.projectsLoadingState.withLoading(async () => {
      if (fnToRunBeforeLink) await fnToRunBeforeLink()

      const localProjects = this.localProjectsState.localProjects
      if (localProjects.length === 0) return

      const currentSession = this.authState.currentSession
      if (!currentSession) return

      this._linkedProjects = await this.getLinkedProjectsFromLocalProjects(localProjects, currentSession)
      if (!bootstrap) this.onDidChangeLinkedProjectsEventEmitter.fire()
    })

    this.onWillChangeLinkedProjectsEventEmitter.fire()
    await promise
  }

  private async getLinkedProjectsFromLocalProjects(
    localProjects: readonly LocalProject[],
    currentSession: CustomAuthenticationSession,
  ) {
    // biome-ignore format: Biome bug? This shouldn't be multiline.
    const projectJsons = uniqueBy(localProjects.map((l) => l.projectJson), 'projectId')
    const prefetchedVercelProjects = await this.prefetchVercelProjects(projectJsons, currentSession)

    const projects: LinkedProject[] = []
    for (const local of localProjects) {
      const remote = prefetchedVercelProjects.get(local.projectJson.projectId)
      if (!remote) continue

      projects.push(new LinkedProject(local, remote))
    }
    return projects
  }

  private async prefetchVercelProjects(projectJsons: ProjectJson[], currentSession: CustomAuthenticationSession) {
    const {accessToken, teamId} = currentSession

    const [entries, throws] = await settleAllPromises(
      projectJsons.map(async ({projectId, orgId}) => {
        const response = await this.vercelApi.getProjectByNameOrId(projectId, accessToken, orgId ?? teamId)
        return isValidVercelProject(response) ? ([projectId, response] as const) : undefined
      }),
    )

    for (const error of throws) {
      this.logger.error(error.message)
    }

    return new Map(entries)
  }

  private async updateLinkedProjectsWhenLocalProjectsChanged(event: OnDidChangeLocalProjectEvent) {
    if (!this.authState.currentSession) return
    const currentSession = this.authState.currentSession

    const promise = this.projectsLoadingState.withLoading(async () => {
      if (event.added.length > 0) {
        const toBeAdded: LinkedProject[] = await this.getLinkedProjectsFromLocalProjects(event.added, currentSession)
        this._linkedProjects.push(...toBeAdded)
      }

      if (event.removed.length > 0) {
        const removedProjects = event.removed
        this._linkedProjects = this._linkedProjects.filter((linkedProject) => {
          const isBeingRemoved = removedProjects.some((removed) => removed.id === linkedProject.local.id)
          return !isBeingRemoved
        })
      }

      if (event.changed.length > 0) {
        const changedProjects = event.changed

        // biome-ignore format: Biome bug? This shouldn't be multiline.
        const projectJsons = uniqueBy(changedProjects.map((l) => l.projectJson), 'projectId')
        const prefetchedVercelProjects = await this.prefetchVercelProjects(projectJsons, currentSession)

        for (const newLocal of changedProjects) {
          const linkedProjectIndex = this._linkedProjects.findIndex((linked) => linked.local.id === newLocal.id)
          const newRemote = prefetchedVercelProjects.get(newLocal.projectJson.projectId)

          if (linkedProjectIndex !== -1) {
            // SAFETY: `linkedProject` must exist after index is confirmed to not be -1.
            const linkedProject = this._linkedProjects[linkedProjectIndex]!

            if (newRemote) {
              linkedProject.local = newLocal
              linkedProject.remote = new VercelProject(newRemote)
            } else {
              this._linkedProjects.splice(linkedProjectIndex, 1)
            }
          } else {
            if (newRemote) {
              const newProject = new LinkedProject(newLocal, newRemote)
              this._linkedProjects.push(newProject)
            }
          }
        }
      }
    })

    this.onWillChangeLinkedProjectsEventEmitter.fire()
    await promise
    this.onDidChangeLinkedProjectsEventEmitter.fire()
  }
}

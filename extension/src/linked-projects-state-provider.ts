import * as vscode from 'vscode'
import {AuthenticationStateProvider} from './authentication-state-provider'
import {ContextId} from './constants'
import {ContextKeys, Injectable, Logger} from './lib'
import {LocalProject, LocalProjectsStateProvider, OnDidChangeLocalProjectEvent} from './local-projects-state-provider'
import type {CustomAuthenticationSession, PlainVercelProject} from './types'
import {diffArrays, settleAllPromises} from './utils'
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

export type OnDidChangeRemoteProjectIdsEvent = {
  added: readonly string[]
  removed: readonly string[]
}

@Injectable()
export class LinkedProjectsStateProvider implements vscode.Disposable {
  private readonly logger = new Logger(LinkedProjectsStateProvider.name)
  private readonly projectsLoadingState = new LoadingState()
  private _linkedProjects: LinkedProject[] = []
  private readonly onWillChangeLinkedProjectsEventEmitter = new vscode.EventEmitter<void>()
  private _remoteProjectIds: string[] = []
  private readonly onDidChangeRemoteProjectIdsEventEmitter = new vscode.EventEmitter<OnDidChangeRemoteProjectIdsEvent>()
  private readonly disposable: vscode.Disposable

  constructor(
    private readonly authState: AuthenticationStateProvider,
    private readonly contextKeys: ContextKeys,
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

          const projectIdsToBeRemoved = this._remoteProjectIds
          this._remoteProjectIds = []
          this.onDidChangeRemoteProjectIdsEventEmitter.fire({added: [], removed: projectIdsToBeRemoved})
        }
      }),
      this.localProjectsState.onDidChangeLocalProjects((event) => {
        void this.updateLinkedProjectsWhenLocalProjectsChanged(event)
      }),
      this.onDidChangeRemoteProjectIdsEventEmitter.event(() => {
        const noProjectsFound = this._remoteProjectIds.length === 0
        void this.contextKeys.set(ContextId.NoProjectsFound, noProjectsFound)
      }),
    )
  }

  dispose() {
    this.disposable.dispose()
    this.onWillChangeLinkedProjectsEventEmitter.dispose()
    this.onDidChangeRemoteProjectIdsEventEmitter.dispose()
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

  get remoteProjectIds() {
    return this._remoteProjectIds
  }

  get onDidChangeRemoteProjectIds() {
    return this.onDidChangeRemoteProjectIdsEventEmitter.event
  }

  get remoteProjects() {
    const remoteProjectIds = this._remoteProjectIds
    const linkedProjects = this._linkedProjects

    return remoteProjectIds
      .map((projectId) => linkedProjects.find((project) => project.remote.id === projectId))
      .filter((project) => project !== undefined)
      .map((project) => project.remote)
  }

  async linkLocalProjectsOnBootstrap() {
    await this.linkLocalProjects(undefined, true)
    await this.contextKeys.set(ContextId.NoProjectsFound, this._remoteProjectIds.length === 0)
  }

  async reloadProjects() {
    await this.linkLocalProjects(/* right after */ () => this.localProjectsState.loadLocalProjects())
  }

  private async linkLocalProjects(fnToRunBeforeLink?: () => Promise<void>, bootstrap = false) {
    const promise = this.projectsLoadingState.withLoading(async () => {
      if (fnToRunBeforeLink) await fnToRunBeforeLink()

      const localProjects = this.localProjectsState.localProjects
      if (localProjects.length === 0) return

      const currentSession = this.authState.currentSession
      if (!currentSession) return

      this._linkedProjects = await this.getLinkedProjectsFromLocalProjects(localProjects, currentSession)
      this.updateRemoteProjectIds(/* emitEvent */ !bootstrap)
    })

    this.onWillChangeLinkedProjectsEventEmitter.fire()
    await promise
  }

  private async getLinkedProjectsFromLocalProjects(
    localProjects: readonly LocalProject[],
    currentSession: CustomAuthenticationSession,
  ) {
    const projectIds = [...new Set(localProjects.map((local) => local.projectJson.projectId))]
    const prefetchedVercelProjects = await this.prefetchVercelProjects(projectIds, currentSession)

    const projects: LinkedProject[] = []
    for (const local of localProjects) {
      const remote = prefetchedVercelProjects.get(local.projectJson.projectId)
      if (!remote) continue

      projects.push(new LinkedProject(local, remote))
    }
    return projects
  }

  private async prefetchVercelProjects(projectIds: string[], currentSession: CustomAuthenticationSession) {
    const {accessToken, teamId} = currentSession

    const [entries, throws] = await settleAllPromises(
      projectIds.map(async (id) => {
        const response = await this.vercelApi.getProjectByNameOrId(id, accessToken, teamId)
        return isValidVercelProject(response) ? ([id, response] as const) : undefined
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

        const projectIds = [...new Set(changedProjects.map((local) => local.projectJson.projectId))]
        const prefetchedVercelProjects = await this.prefetchVercelProjects(projectIds, currentSession)

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

      this.updateRemoteProjectIds()
    })

    this.onWillChangeLinkedProjectsEventEmitter.fire()
    await promise
  }

  private updateRemoteProjectIds(emitEvent = true) {
    const newProjectIds = [...new Set(this._linkedProjects.map((project) => project.remote.id))]
    const diff = diffArrays(this._remoteProjectIds, newProjectIds)

    if (diff) {
      this._remoteProjectIds = newProjectIds
      if (emitEvent) this.onDidChangeRemoteProjectIdsEventEmitter.fire(diff)
    }
  }
}

import * as vscode from 'vscode'
import {ContextId} from '../constants'
import {ContextKeys, Injectable, Logger} from '../lib'
import {LinkedProject} from '../models/linked-project'
import {LocalProject} from '../models/local-project'
import {VercelProject} from '../models/vercel-project'
import type {CustomAuthenticationSession, ProjectJson} from '../types'
import {settleAllPromises, uniqueBy} from '../utils'
import {LoadingState} from '../utils/loading-state'
import {VercelApiClient} from '../vercel-api-client'
import {AuthenticationStateProvider} from './authentication-state-provider'
import {LocalProjectsStateProvider, OnDidChangeLocalProjectEvent} from './local-projects-state-provider'

/**
 * Manages {@link LinkedProject}s. These are {@link LocalProject}s linked with their remote
 * counterpart {@link VercelProject}s. This is the first of state providers that has a UI subscriber,
 * in this case a `TreeView` and it's `TreeDataProvider`.
 */
@Injectable()
export class LinkedProjectsStateProvider implements vscode.Disposable {
  private readonly logger = new Logger(LinkedProjectsStateProvider.name)
  private readonly projectsLoadingState = new LoadingState()
  private _linkedProjects: LinkedProject[] = []
  // `onWillChange` events are meant to be subscribed by UI elements so they can start showing
  // loading indicators. `onDidChange` events by dependents.
  private readonly onWillChangeLinkedProjectsEventEmitter = new vscode.EventEmitter<void>()
  private readonly onDidChangeLinkedProjectsEventEmitter = new vscode.EventEmitter<void>()
  private readonly disposable: vscode.Disposable

  constructor(
    private readonly authState: AuthenticationStateProvider,
    private readonly contextKeys: ContextKeys,
    private readonly localProjectsState: LocalProjectsStateProvider,
    private readonly vercelApi: VercelApiClient,
  ) {
    this.disposable = vscode.Disposable.from(
      this.localProjectsState.onDidChangeLocalProjects((event) => {
        void this.updateLinkedProjectsWhenLocalProjectsChanged(event)
      }),
      this.onDidChangeLinkedProjectsEventEmitter.event(() => {
        const someProjectsNotLinked = this._linkedProjects.length !== this.localProjectsState.localProjects.length
        void this.contextKeys.set(ContextId.SomeProjectsNotLinked, someProjectsNotLinked)
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
    const promise = this.projectsLoadingState.withLoading(async () => {
      await this.linkLocalProjectsWithoutEvents()
    })

    this.onWillChangeLinkedProjectsEventEmitter.fire()
    await promise
  }

  async reloadLocalProjectsAndLinkThem() {
    const promise = this.projectsLoadingState.withLoading(async () => {
      await this.localProjectsState.loadLocalProjectsWithoutEvents()
      await this.linkLocalProjectsWithoutEvents()
    })

    this.onWillChangeLinkedProjectsEventEmitter.fire()
    await promise
    this.onDidChangeLinkedProjectsEventEmitter.fire()
  }

  private async linkLocalProjectsWithoutEvents() {
    const currentSession = this.authState.currentSession
    if (!currentSession) {
      this._linkedProjects = []
      return
    }

    const localProjects = this.localProjectsState.localProjects
    this._linkedProjects = await this.getLinkedProjectsFromLocalProjects(localProjects, currentSession)
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
    const {accessToken, teamId: defaultTeamId} = currentSession

    const [entries, throws] = await settleAllPromises(
      projectJsons.map(async ({projectId, orgId}) => {
        const project = await this.vercelApi.getProjectByNameOrId(projectId, accessToken, orgId ?? defaultTeamId)
        return [projectId, project] as const
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

      this.onDidChangeLinkedProjectsEventEmitter.fire()
    })

    this.onWillChangeLinkedProjectsEventEmitter.fire()
    await promise
  }
}

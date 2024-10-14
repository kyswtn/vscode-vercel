import * as vscode from 'vscode'
import {AuthenticationStateProvider} from './authentication-state-provider'
import {ContextId} from './constants'
import {DeploymentFiltersStateProvider} from './deployment-filters-state-provider'
import {ContextKeys, Injectable, Logger} from './lib'
import {OnDidChangeProjectsEvent, ProjectsStateProvider} from './projects-state-provider'
import {type CustomAuthenticationSession, type PlainVercelDeployment} from './types'
import {settleAllPromises} from './utils'
import {LoadingState} from './utils/loading-state'
import {isValidVercelDeployment} from './utils/validation'
import {VercelApiClient} from './vercel-api-client'
import {VercelDeployment} from './vercel-deployment'
import {VercelProject} from './vercel-project'

export class Deployment extends VercelDeployment {
  id: string

  constructor(readonly data: PlainVercelDeployment) {
    super(data)

    this.id = data.uid
  }
}

@Injectable()
export class DeploymentsStateProvider implements vscode.Disposable {
  private readonly logger = new Logger(DeploymentsStateProvider.name)
  private readonly deploymentsLoadingState = new LoadingState()
  private _deployments = new Map<string, Deployment[]>()
  private readonly onWillChangeDeploymentsEventEmitter = new vscode.EventEmitter<void>()
  private _focusedDeployment: Deployment | undefined
  private readonly onDidSetFocusedDeploymentEventEmitter = new vscode.EventEmitter<void>()
  private readonly disposable: vscode.Disposable

  constructor(
    private readonly authState: AuthenticationStateProvider,
    private readonly contextKeys: ContextKeys,
    private readonly projectsState: ProjectsStateProvider,
    private readonly vercelApi: VercelApiClient,
    private readonly deploymentFiltersState: DeploymentFiltersStateProvider,
  ) {
    this.disposable = vscode.Disposable.from(
      this.projectsState.onDidChangeProjects((event) => {
        void this.updateDeploymentsWhenProjectIdsChanged(event)
      }),
      this.deploymentFiltersState.onDidChangeFilters(() => {
        void this.loadDeployments()
      }),
      this.contextKeys.onDidSetContext((key) => {
        if (key === ContextId.FocusedDeploymentId) {
          this.setFocusedDeployment()
        }
      }),
    )
  }

  dispose() {
    this.disposable.dispose()
    this.onWillChangeDeploymentsEventEmitter.dispose()
    this.onDidSetFocusedDeploymentEventEmitter.dispose()
  }

  get deployments() {
    return Array.from(this._deployments.values())
      .flat()
      .sort((a, b) => b.data.createdAt - a.data.createdAt)
      .slice(0, 25) // TODO: See if there's a better way to do this than hardcode 25.
  }

  get onWillChangeDeployments() {
    return this.onWillChangeDeploymentsEventEmitter.event
  }

  get loadingPromise() {
    return this.deploymentsLoadingState.loadingPromise
  }

  async loadDeployments() {
    const filters = this.deploymentFiltersState.searchParams
    const promise = this.deploymentsLoadingState.withLoading(async () => {
      const projects = this.projectsState.projects
      if (projects.length === 0) return

      if (!this.authState.currentSession) return
      const currentSession = this.authState.currentSession

      const prefetchedDeployments = await this.prefetchVercelDeployments(projects, filters, currentSession)
      for (const [projectId, deployments] of prefetchedDeployments) {
        this._deployments.set(
          projectId,
          deployments.map((deployment) => new Deployment(deployment)),
        )
      }
      this.setFocusedDeployment()
    })

    this.onWillChangeDeploymentsEventEmitter.fire()
    await promise
  }

  getCurrentDeploymentIds() {
    // TODO: Check if this is the correct way to get current production deployment.

    return Array.from(this._deployments.values())
      .map((deployments) => deployments.find((d) => d.data.target === 'production' && d.data.state === 'READY'))
      .filter((deployment) => deployment !== undefined)
      .map((deployment) => deployment.id)
  }

  getLatestDeployments(): Record<string, Deployment> {
    return Object.fromEntries(
      Array.from(this._deployments.entries())
        .map(([_, deployments]) => [_, deployments.sort((a, b) => b.data.createdAt - a.data.createdAt)[0]])
        .filter(([_, deployments]) => deployments !== undefined),
    )
  }

  getDeploymentById(id: string) {
    return Array.from(this._deployments.values())
      .flat()
      .find((deployment) => deployment.id === id)
  }

  get focusedDeployment() {
    return this._focusedDeployment
  }

  async setFocusedDeploymentId(id: string) {
    await this.contextKeys.set(ContextId.FocusedDeploymentId, id)
  }

  get onDidSetFocusedDeployment() {
    return this.onDidSetFocusedDeploymentEventEmitter.event
  }

  private async prefetchVercelDeployments(
    projects: readonly VercelProject[],
    searchParams: URLSearchParams,
    currentSession: CustomAuthenticationSession,
  ) {
    const {accessToken, teamId: authenticatedTeamId} = currentSession

    const [entries, throws] = await settleAllPromises(
      projects.map(async (project) => {
        const deployments = await this.vercelApi
          .listDeploymentsByProjectId(project.id, searchParams, accessToken, project.teamId ?? authenticatedTeamId)
          .then((deployments) => deployments.filter(isValidVercelDeployment))
        return [project.id, deployments] as const
      }),
    )
    for (const error of throws) {
      this.logger.error(error.message)
    }
    return new Map(entries)
  }

  private async updateDeploymentsWhenProjectIdsChanged(event: OnDidChangeProjectsEvent) {
    const filters = this.deploymentFiltersState.searchParams
    const promise = this.deploymentsLoadingState.withLoading(async () => {
      if (event.removed.length > 0) {
        for (const project of event.removed) {
          this._deployments.delete(project.id)
        }
        this.setFocusedDeployment()
      }

      if (!this.authState.currentSession) return
      const currentSession = this.authState.currentSession

      if (event.added.length > 0) {
        const prefetchedDeployments = await this.prefetchVercelDeployments(event.added, filters, currentSession)

        for (const project of event.added) {
          const deployments = prefetchedDeployments.get(project.id)
          if (!deployments) continue

          this._deployments.set(
            project.id,
            deployments.map((deployment) => new Deployment(deployment)),
          )
          this.setFocusedDeployment()
        }
      }
    })

    this.onWillChangeDeploymentsEventEmitter.fire()
    await promise
  }

  private setFocusedDeployment() {
    const deployments = Array.from(this._deployments.values()).flat()
    const focusedDeploymentId = this.contextKeys.get(ContextId.FocusedDeploymentId)

    this._focusedDeployment = deployments.find((deployment) => deployment.id === focusedDeploymentId)
    this.onDidSetFocusedDeploymentEventEmitter.fire()
  }
}

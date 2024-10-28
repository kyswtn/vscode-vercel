import * as vscode from 'vscode'
import {Injectable, Logger} from '../lib'
import {VercelDeployment} from '../models/vercel-deployment'
import {VercelProject} from '../models/vercel-project'
import {settleAllPromises} from '../utils'
import {VercelApiError} from '../utils/errors'
import {LoadingState} from '../utils/loading-state'
import {PromiseQueue} from '../utils/promise-queue'
import {VercelApiClient} from '../vercel-api-client'
import {AuthenticationStateProvider} from './authentication-state-provider'
import {DeploymentFiltersStateProvider} from './deployment-filters-state-provider'
import {OnDidChangeProjectsEvent, ProjectsStateProvider} from './projects-state-provider'

@Injectable()
export class DeploymentsStateProvider implements vscode.Disposable {
  private readonly logger = new Logger(DeploymentsStateProvider.name)
  private readonly deploymentsLoadingState = new LoadingState()
  private _deployments: VercelDeployment[] = []
  private readonly onWillChangeDeploymentsEventEmitter = new vscode.EventEmitter<void>()
  private readonly onDidChangeDeploymentsEventEmitter = new vscode.EventEmitter<void>()
  private readonly disposable: vscode.Disposable

  constructor(
    private readonly authState: AuthenticationStateProvider,
    private readonly deploymentFiltersState: DeploymentFiltersStateProvider,
    private readonly projectsState: ProjectsStateProvider,
    private readonly vercelApi: VercelApiClient,
  ) {
    const updateDeploymentsQueue = new PromiseQueue()

    this.disposable = vscode.Disposable.from(
      this.projectsState.onDidChangeProjects((event) => {
        void updateDeploymentsQueue.enqueue(() => this.updateDeploymentsWhenProjectsChanged(event))
      }),
      this.deploymentFiltersState.onDidChangeFilters(() => {
        void updateDeploymentsQueue.enqueue(() => this.loadDeployments())
      }),
    )
  }

  dispose() {
    this.disposable.dispose()
    this.onWillChangeDeploymentsEventEmitter.dispose()
    this.onDidChangeDeploymentsEventEmitter.dispose()
  }

  get deployments() {
    return this._deployments.sort((next, prev) => prev.data.createdAt - next.data.createdAt)
  }

  get onWillChangeDeployments() {
    return this.onWillChangeDeploymentsEventEmitter.event
  }

  get loadingPromise() {
    return this.deploymentsLoadingState.loadingPromise
  }

  get onDidChangeDeployments() {
    return this.onDidChangeDeploymentsEventEmitter.event
  }

  async loadDeployments() {
    const currentSession = this.authState.currentSession
    if (!currentSession) return

    const projects = this.projectsState.projects
    if (projects.length === 0) return

    const filters = this.deploymentFiltersState.searchParams
    const promise = this.deploymentsLoadingState.withLoading(async () => {
      this._deployments = await this.fetchVercelDeploymentsFromProjects(projects, filters, currentSession.accessToken)
      this.onDidChangeDeploymentsEventEmitter.fire()
    })

    this.onWillChangeDeploymentsEventEmitter.fire()
    await promise
  }

  async loadDeploymentsInBackground() {
    const currentSession = this.authState.currentSession
    if (!currentSession) return

    const projects = this.projectsState.projects
    if (projects.length === 0) return

    const filters = this.deploymentFiltersState.searchParams
    this._deployments = await this.fetchVercelDeploymentsFromProjects(projects, filters, currentSession.accessToken)
    this.onDidChangeDeploymentsEventEmitter.fire()
  }

  getCurrentDeployments() {
    return this.getOnePerProject(
      this.deployments.filter(
        (deployment) =>
          // TODO: Check if this is the correct way to get current production deployment.
          deployment.data.target === 'production' && deployment.data.state === 'READY',
      ),
    )
  }

  getLatestDeployments() {
    return this.getOnePerProject(this.deployments)
  }

  async getDeploymentOrFetch(deploymentId: string, projectId: string, teamId: string) {
    const existing = this._deployments.find((deployment) => deployment.id === deploymentId)
    if (existing) return existing

    // The rest of this function is to support when the user try to open a file from another window
    // in current workspace e.g. via drag-n-drop. Even if the project/deployment is not from within
    // current state, try to fetch them as long as the user's authenticated.

    const currentSession = this.authState.currentSession
    if (!currentSession) return

    const project = await this.projectsState.getProjectOrFetch(projectId, currentSession.accessToken, teamId)
    if (!project) return

    try {
      const deployment = await this.vercelApi
        .getDeploymentById(deploymentId, currentSession.accessToken, teamId)
        .then((deployment) => new VercelDeployment(deployment, project))
      return deployment
    } catch (error) {
      if (error instanceof VercelApiError && error.status === 404) return
      throw error
    }
  }

  async refreshDeployment(deploymentId: string) {
    const currentSession = this.authState.currentSession
    if (!currentSession) return

    const deploymentIndex = this._deployments.findIndex((deployment) => deployment.id === deploymentId)
    const existingDeployment = this._deployments[deploymentIndex]!
    if (!existingDeployment) return

    const newDeployment = await this.vercelApi
      .getDeploymentById(deploymentId, currentSession.accessToken, existingDeployment.project.teamId)
      .then((data) => new VercelDeployment(data, existingDeployment.project))
    this._deployments.splice(deploymentIndex, 1, newDeployment)
  }

  private getOnePerProject(deployments: VercelDeployment[]) {
    return this.projectsState.projects
      .map((project) => deployments.find((deployment) => deployment.project.id === project.id))
      .filter((deployment) => deployment !== undefined)
  }

  private async updateDeploymentsWhenProjectsChanged(event: OnDidChangeProjectsEvent) {
    const filters = this.deploymentFiltersState.searchParams

    const promise = this.deploymentsLoadingState.withLoading(async () => {
      if (event.removed.length > 0) {
        const removedProjectIds = event.removed.map((project) => project.id)
        this._deployments = this._deployments.filter((deployment) => !removedProjectIds.includes(deployment.project.id))
      }

      const currentSession = this.authState.currentSession
      if (!currentSession) return

      if (event.added.length > 0) {
        const added = await this.fetchVercelDeploymentsFromProjects(event.added, filters, currentSession.accessToken)
        this._deployments = this._deployments.concat(added)
      }

      if (event.removed.length + event.added.length > 0) {
        this.onDidChangeDeploymentsEventEmitter.fire()
      }
    })

    this.onWillChangeDeploymentsEventEmitter.fire()
    await promise
  }

  private async fetchVercelDeploymentsFromProjects(
    projects: readonly VercelProject[],
    searchParams: URLSearchParams,
    accessToken: string,
  ) {
    const [entries, throws] = await settleAllPromises(
      projects.map(async (project) => {
        const deployments = await this.vercelApi.listDeploymentsByProjectId(
          project.id,
          searchParams,
          accessToken,
          project.teamId,
        )
        return deployments.map((deployment) => new VercelDeployment(deployment, project))
      }),
    )

    for (const error of throws) {
      this.logger.error(error.message)
    }

    return entries.flat()
  }
}

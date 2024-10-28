import ms from 'ms'
import * as vscode from 'vscode'
import {CommandId, ContextId} from '../constants'
import {ContextKeys, Injectable} from '../lib'
import {VercelDeployment} from '../models/vercel-deployment'
import {DeploymentsStateProvider} from '../state/deployments-state-provider'
import {ProjectsStateProvider} from '../state/projects-state-provider'
import {CustomIcon} from '../types'
import {capitalize} from '../utils'

@Injectable()
export class DeploymentStatusBarItem implements vscode.Disposable {
  private readonly icon = `  $(${'custom-icons-vercel-triangle-fill-small' satisfies CustomIcon})`
  private readonly statusBarItem: vscode.StatusBarItem
  private readonly disposable: vscode.Disposable

  constructor(
    private readonly contextKeys: ContextKeys,
    private readonly deploymentsState: DeploymentsStateProvider,
    private readonly projectsState: ProjectsStateProvider,
  ) {
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right)
    this.statusBarItem.command = CommandId.SwitchFocusedProject

    this.disposable = vscode.Disposable.from(
      this.projectsState.onDidChangeProjects(() => {
        if (projectsState.projects.length < 1) {
          this.statusBarItem.hide()
        } else {
          this.statusBarItem.show()
        }
      }),
      this.deploymentsState.onDidChangeDeployments(() => {
        this.updateStatusBarItem()
      }),
      this.contextKeys.onDidSetContext((key) => {
        if (key === ContextId.FocusedProjectId) {
          this.updateStatusBarItem()
        }
      }),
    )
  }

  dispose() {
    this.statusBarItem.dispose()
    this.disposable.dispose()
  }

  setInitialDisplayState() {
    if (this.projectsState.projects.length < 1) {
      this.statusBarItem.hide()
    } else {
      this.statusBarItem.show()
    }
  }

  private setLoading() {
    this.statusBarItem.text = `${this.icon} ···`
    this.statusBarItem.tooltip = new vscode.MarkdownString('$(loading~spin) Loading', /* supportThemeIcons */ true)
  }

  private async updateStatusBarItem() {
    const focusedProjectId = this.contextKeys.get<string>(ContextId.FocusedProjectId)
    const latestDeployments = this.deploymentsState.getLatestDeployments()
    let deploymentToShow = latestDeployments.find((deployment) => deployment.project.id === focusedProjectId)

    if (focusedProjectId && !deploymentToShow) {
      await this.contextKeys.delete(ContextId.FocusedProjectId)
      deploymentToShow = latestDeployments[0]
    }

    if (deploymentToShow) {
      const status = deploymentToShow.data.state ? capitalize(deploymentToShow.data.state) : 'Unknown'

      this.statusBarItem.text = `${this.icon} ${status}`
      this.statusBarItem.tooltip = this.getTooltipFromDeployments(latestDeployments)
    } else {
      this.statusBarItem.text = `${this.icon} N/A`
      this.statusBarItem.tooltip = 'No deployments found'
    }
  }

  private getTooltipFromDeployments(latestDeployments: VercelDeployment[]) {
    const tooltips = latestDeployments.map((latestDeployment) => {
      const {data: deployment, commit} = latestDeployment

      const status = deployment.state && `${capitalize(deployment.state)}`
      const environment = deployment.target && `on ${capitalize(deployment.target ?? 'preview')}`
      const duration = deployment.ready && `(took ${ms(deployment.ready - deployment.createdAt)})`
      const timeAgo = `${ms(new Date().getTime() - deployment.createdAt)} ago`
      const byAuthor = commit && `by ${commit.authorName}`
      const message = [status, environment, duration, timeAgo, byAuthor]
        .filter((item) => typeof item === 'string')
        .join(' ')

      return `**${deployment.name}:** ${message}`
    })

    const tooltip = new vscode.MarkdownString(tooltips.join('\n\n---\n'), true)
    return tooltip
  }
}

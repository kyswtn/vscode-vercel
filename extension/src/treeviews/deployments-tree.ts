import ms from 'ms'
import * as vscode from 'vscode'
import {
  CommandId,
  ConfigId,
  FileSystemProviderScheme,
  TreeId,
  TreeItemContextValue,
  VercelDeploymentState,
} from '../constants'
import {Injectable} from '../lib'
import {VercelDeployment} from '../models/vercel-deployment'
import {showDeploymentFiltersQuickPick} from '../quickpicks/show-deployment-filters-quickpick'
import {DeploymentFiltersStateProvider} from '../state/deployment-filters-state-provider'
import {DeploymentsStateProvider} from '../state/deployments-state-provider'
import {ExtensionConfigStateProvider} from '../state/extension-config-state-provider'
import {CustomIcon, GitBranch, GitCommit} from '../types'
import {capitalize, withMarkdownUrl} from '../utils'

const deploymentStatusIcons = {
  INITIALIZING: 'issue-draft',
  READY: 'pass',
  ERROR: 'error',
  BUILDING: 'wrench',
  QUEUED: 'watch',
  CANCELED: 'close',
} satisfies Record<VercelDeploymentState, string>

const deploymentStatusColors = {
  INITIALIZING: 'testing.iconUnset',
  READY: 'testing.iconPassed',
  ERROR: 'testing.iconErrored',
  BUILDING: 'inputValidation.warningBorder',
  QUEUED: 'testing.iconQueued',
  CANCELED: 'testing.iconSkipped',
} satisfies Record<VercelDeploymentState, string>

export class DeploymentTreeItem extends vscode.TreeItem {
  override contextValue = TreeItemContextValue.Deployment

  constructor(public readonly deployment: VercelDeployment) {
    super(deployment.data.name, vscode.TreeItemCollapsibleState.Collapsed)

    this.id = deployment.id
    this.resourceUri = vscode.Uri.parse(`vscode-vercel-view://deployments/${deployment.id}`)
    this.iconPath = this.getIcon()
    this.description = this.getDescription()
    this.tooltip = this.getTooltip()
  }

  private getIcon() {
    const readyState = this.deployment.data.state

    return new vscode.ThemeIcon(
      readyState ? deploymentStatusIcons[readyState] : ('custom-icons-blank' satisfies CustomIcon),
      new vscode.ThemeColor((readyState && deploymentStatusColors[readyState]) ?? deploymentStatusColors.CANCELED),
    )
  }

  private getDescription() {
    return `${ms(new Date().getTime() - this.deployment.data.createdAt)} ago`
  }

  private getTooltip() {
    const tooltip = new vscode.MarkdownString('', true)
    const {branch, commit, data: deployment} = this.deployment

    if (deployment.state) {
      tooltip.appendMarkdown(
        `### $(info) ${capitalize(deployment.state)} on ${capitalize(deployment.target ?? 'preview')}`,
      )
    }

    if (deployment.ready) {
      tooltip.appendMarkdown(` (took ${ms(deployment.ready - deployment.createdAt)})\n\n`)
    }

    if (deployment.state || deployment.ready) {
      tooltip.appendMarkdown('\n---\n\n')
    }

    if (deployment.url) {
      tooltip.appendMarkdown(`$(globe) [${deployment.url}](https://${deployment.url})\n\n`)
    }

    if (commit) {
      tooltip.appendMarkdown(`$(git-commit) ${commit.message}\n\n`)
    }

    if (deployment.url || commit) {
      tooltip.appendMarkdown('---\n\n')
    }

    tooltip.appendText(`${ms(new Date().getTime() - deployment.createdAt)} ago`)

    if (branch) {
      tooltip.appendMarkdown(` from ${withMarkdownUrl(`$(git-branch) ${branch.name}`, branch.url)}`)
    }

    if (commit) {
      tooltip.appendText(` by ${commit.authorName}`)
    }

    return tooltip
  }
}

export class DeploymentBuildLogsItem extends vscode.TreeItem {
  override iconPath = new vscode.ThemeIcon('pulse')

  constructor(name: string, state: VercelDeploymentState, authority: string) {
    super('Build Logs', vscode.TreeItemCollapsibleState.None)
    this.description = state.toString()

    this.command = {
      title: 'Build Logs',
      command: 'vscode.open',
      arguments: [`${FileSystemProviderScheme.Files}://${authority}/${name}.log`],
    }
  }
}

export class DeploymentOpenUrlItem extends vscode.TreeItem {
  override iconPath = new vscode.ThemeIcon('globe')

  constructor(url: string) {
    super('Visit', vscode.TreeItemCollapsibleState.None)
    this.description = url
    this.command = {
      title: 'Open Deployed URL',
      command: 'vscode.open',
      arguments: [`https://${url}`],
    }
  }
}

export class DeploymentGitBranchItem extends vscode.TreeItem {
  override iconPath = new vscode.ThemeIcon('git-branch')

  constructor(branch: GitBranch, repoRef?: string) {
    super(branch.name, vscode.TreeItemCollapsibleState.None)
    this.description = repoRef ?? false
    this.tooltip = 'Git Branch'
    this.command = {
      title: 'Open Git Branch URL',
      command: 'vscode.open',
      arguments: [branch.url],
    }
  }
}

export class DeploymentGitCommitItem extends vscode.TreeItem {
  override iconPath = new vscode.ThemeIcon('git-commit')

  constructor(commit: GitCommit) {
    super(commit.message ?? 'No commit message', vscode.TreeItemCollapsibleState.None)
    this.description = `${commit.authorName}`
    this.tooltip = 'Git Commit'
    this.command = {
      title: 'Open Git Commit URL',
      command: 'vscode.open',
      arguments: [commit.url],
    }
  }
}

export class DeploymentViewFilesItem extends vscode.TreeItem {
  override iconPath = new vscode.ThemeIcon('indent')

  constructor(deploymentId: string, projectId: string, teamId: string) {
    super('View Files', vscode.TreeItemCollapsibleState.None)
    this.command = {
      title: 'View Files',
      command: CommandId.SelectDeploymentForFiles,
      arguments: [deploymentId, projectId, teamId],
    }
  }
}

@Injectable()
export class DeploymentsTreeDataProvider implements vscode.TreeDataProvider<vscode.TreeItem>, vscode.Disposable {
  private isLoading = false
  private refreshInterval: ReturnType<typeof setInterval> | undefined
  private readonly onDidChangeTreeDataEventEmitter = new vscode.EventEmitter<vscode.TreeItem | undefined>()
  private readonly disposable: vscode.Disposable

  constructor(
    private readonly deploymentsState: DeploymentsStateProvider,
    private readonly extensionConfig: ExtensionConfigStateProvider,
  ) {
    this.configureRefreshInterval()
    this.disposable = vscode.Disposable.from(
      this.deploymentsState.onWillChangeDeployments(() => {
        this.refreshRoot()
      }),
      this.extensionConfig.onDidChangeConfig((configId) => {
        if ([ConfigId.DeploymentsAutoRefresh, ConfigId.DeploymentsAutoRefreshPeriod].includes(configId)) {
          this.configureRefreshInterval()
        }
      }),
    )
  }

  dispose() {
    this.disposable.dispose()
    this.onDidChangeTreeDataEventEmitter.dispose()
    clearInterval(this.refreshInterval)
  }

  get onDidChangeTreeData() {
    return this.onDidChangeTreeDataEventEmitter.event
  }

  getTreeItem(item: vscode.TreeItem) {
    return item
  }

  async getChildren(deploymentTreeItem?: DeploymentTreeItem) {
    if (deploymentTreeItem) {
      return this.getDeploymentActionItems(deploymentTreeItem.deployment)
    }

    try {
      this.isLoading = true
      await this.deploymentsState.loadingPromise
      return this.deploymentsState.deployments
        .slice(0, 25) // TODO: See if there's a better way to do this than hardcode 25.
        .map((deployment) => new DeploymentTreeItem(deployment))
    } finally {
      this.isLoading = false
    }
  }

  private refreshRoot() {
    if (this.isLoading) return
    this.onDidChangeTreeDataEventEmitter.fire(undefined)
  }

  private getDeploymentActionItems(deployment: VercelDeployment) {
    const {name, state, project, url, commit, branch, repo} = deployment
    const repoRef = repo && `${repo.org}/${repo.repo}`

    // TODO: Allow toggling these items on/off from settings.
    const items: vscode.TreeItem[] = []
    if (url) {
      items.push(new DeploymentOpenUrlItem(url))
    }
    if (commit) {
      items.push(new DeploymentGitCommitItem(commit))
    }
    if (branch) {
      items.push(new DeploymentGitBranchItem(branch, repoRef))
    }
    if (state && state !== VercelDeploymentState.Canceled) {
      items.push(new DeploymentBuildLogsItem(name, state, deployment.authority))
    }
    if (state === VercelDeploymentState.Ready) {
      items.push(new DeploymentViewFilesItem(deployment.id, project.id, project.teamId))
    }
    return items
  }

  private configureRefreshInterval() {
    clearInterval(this.refreshInterval)
    if (!this.extensionConfig.deploymentsAutoRefresh) return

    this.refreshInterval = setInterval(() => {
      this.deploymentsState.loadDeploymentsInBackground()
      this.refreshRoot()
    }, this.extensionConfig.deploymentsAutoRefreshPeriod * 1000)
  }
}

@Injectable()
export class DeploymentsTreeView implements vscode.Disposable {
  private readonly treeView: vscode.TreeView<vscode.TreeItem>
  private readonly disposable: vscode.Disposable

  constructor(
    treeDataProvider: DeploymentsTreeDataProvider,
    private readonly deploymentsState: DeploymentsStateProvider,
    private readonly filtersState: DeploymentFiltersStateProvider,
  ) {
    this.treeView = vscode.window.createTreeView(TreeId.Deployments, {
      treeDataProvider,
      showCollapseAll: true,
    })

    this.disposable = vscode.Disposable.from(
      vscode.commands.registerCommand(CommandId.RefreshDeployments, this.refreshDeployments, this),
      vscode.commands.registerCommand(CommandId.FilterDeployments, this.filterDeployments, this),
      vscode.commands.registerCommand(CommandId.FilterDeploymentsFilled, this.filterDeployments, this),
      vscode.commands.registerCommand(CommandId.ResetFilters, this.resetFilters, this),
    )
  }

  dispose() {
    this.treeView.dispose()
    this.disposable.dispose()
  }

  private refreshDeployments() {
    this.deploymentsState.loadDeployments()
  }

  private async filterDeployments() {
    const newFilters = await showDeploymentFiltersQuickPick(this.filtersState.filters)
    if (!newFilters) return

    this.filtersState.updateFilters(newFilters)
  }

  private resetFilters() {
    this.filtersState.resetFilters()
  }
}

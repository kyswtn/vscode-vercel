import * as vscode from 'vscode'
import {CommandId, TreeId, VercelDeploymentState} from './constants'
import {DeploymentFiltersStateProvider} from './deployment-filters-state-provider'
import {
  DeploymentBuildLogsItem,
  DeploymentDetailsItem,
  DeploymentGitBranchItem,
  DeploymentGitCommitItem,
  DeploymentOpenUrlItem,
  DeploymentTreeItem,
} from './deployment-tree-items'
import {Deployment, DeploymentsStateProvider} from './deployments-state-provider'
import {Injectable} from './lib'
import {showDeploymentFiltersQuickPick} from './quickpicks/show-deployment-filters-quickpick'

@Injectable()
export class DeploymentsTreeDataProvider implements vscode.TreeDataProvider<vscode.TreeItem>, vscode.Disposable {
  private isLoading = false
  private readonly onDidChangeTreeDataEventEmitter = new vscode.EventEmitter<vscode.TreeItem | undefined>()
  private readonly disposable: vscode.Disposable

  constructor(private readonly deploymentsState: DeploymentsStateProvider) {
    this.disposable = vscode.Disposable.from(
      deploymentsState.onWillChangeDeployments(() => {
        this.refreshRoot()
      }),
    )
  }

  dispose() {
    this.disposable.dispose()
    this.onDidChangeTreeDataEventEmitter.dispose()
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
      return this.deploymentsState.deployments.map((deployment) => new DeploymentTreeItem(deployment))
    } finally {
      this.isLoading = false
    }
  }

  private refreshRoot() {
    if (this.isLoading) return
    this.onDidChangeTreeDataEventEmitter.fire(undefined)
  }

  private getDeploymentActionItems(deployment: Deployment) {
    const {
      data: {uid: deploymentId, url: deploymentUrl, state: deploymentState, name: deploymentName},
      repo,
      branch,
      commit,
    } = deployment
    const repoRef = repo && `${repo.org}/${repo.repo}`

    return [
      deploymentUrl !== undefined && new DeploymentOpenUrlItem(deploymentUrl),
      // TODO: Add setting to toggle these items off.
      commit && new DeploymentGitCommitItem(commit),
      branch && new DeploymentGitBranchItem(branch, repoRef),
      new DeploymentBuildLogsItem(deploymentId, deploymentName, deploymentState),
      deploymentState === VercelDeploymentState.Ready && new DeploymentDetailsItem(deploymentId),
    ].filter((item) => item instanceof vscode.TreeItem)
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

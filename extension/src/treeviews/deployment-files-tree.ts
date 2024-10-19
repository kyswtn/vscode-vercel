import path from 'pathe'
import * as vscode from 'vscode'
import {CommandId, FileSystemProviderScheme, TreeId} from '../constants'
import {Injectable} from '../lib'
import {VercelDeployment} from '../models/vercel-deployment'
import {AuthenticationStateProvider} from '../state/authentication-state-provider'
import {DeploymentFilesStateProvider} from '../state/deployment-files-state-provider'
import {DeploymentsStateProvider} from '../state/deployments-state-provider'
import {VercelFile} from '../types'
import {VercelApiClient} from '../vercel-api-client'

type DeploymentFileTreeData = {
  deploymentUrl: string
  deployment: VercelDeployment
  filePath: string
  file: VercelFile
  accessToken: string
  teamId: string
}

@Injectable()
export class DeploymentFilesTreeDataProvider
  implements vscode.TreeDataProvider<DeploymentFileTreeData>, vscode.Disposable
{
  private readonly onDidChangeTreeDataEventEmitter = new vscode.EventEmitter<DeploymentFileTreeData | undefined>()
  private readonly disposable: vscode.Disposable

  constructor(
    private readonly auth: AuthenticationStateProvider,
    private readonly filesState: DeploymentFilesStateProvider,
    private readonly vercelApi: VercelApiClient,
  ) {
    this.disposable = this.filesState.onDidChangeSelectedDeployment(() => {
      this.refreshRoot()
    })
  }

  dispose() {
    this.disposable.dispose()
    this.onDidChangeTreeDataEventEmitter.dispose()
  }

  get onDidChangeTreeData() {
    return this.onDidChangeTreeDataEventEmitter.event
  }

  getTreeItem(data: DeploymentFileTreeData): vscode.TreeItem {
    const {deployment, file, filePath} = data
    const treeItem = new vscode.TreeItem(
      file.name,
      file.type === 'directory' ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
    )

    if (file.type === 'lambda' || file.type === 'middleware') {
      treeItem.iconPath = new vscode.ThemeIcon('cloud')
    }

    if (file.type === 'file') {
      const filePathWithoutOut = filePath.replace(/^out\//i, '')
      let resourceUri = `${FileSystemProviderScheme.Files}://${deployment.authority}/${filePathWithoutOut}`

      // TODO: This v6 thing is kind of a mess, reach out to Vercel about this.
      const useV6 = file.link.startsWith('/api/v6')
      if (useV6) resourceUri += '?v6'

      treeItem.resourceUri = vscode.Uri.parse(resourceUri)
      treeItem.command = {
        title: 'Open Deployed URL',
        command: 'vscode.open',
        arguments: [resourceUri],
      }
    }

    return treeItem
  }

  /**
   * This is the only `getChildren` function that does the actual fetching of data, hence why
   * the state `DeploymentFileTreeData` is much less strictly structured.
   */
  async getChildren(item?: DeploymentFileTreeData): Promise<DeploymentFileTreeData[]> {
    if (item) {
      const {deploymentUrl, filePath, accessToken, teamId} = item
      const files = await this.vercelApi.getDeploymentFileTree(deploymentUrl, filePath, accessToken, teamId)

      return files.map((file) => ({
        ...item,
        file,
        filePath: path.join(item.filePath, file.name),
      }))
    }

    const currentSession = this.auth.currentSession
    if (!currentSession) return []
    const {accessToken, teamId: defaultTeamId} = currentSession

    const deployment = this.filesState.selectedDeployment
    if (!deployment || !deployment.data.url) return []

    const teamId = deployment.project.teamId ?? defaultTeamId
    const deploymentUrl = deployment.data.url

    // Vercel API requires us to pass in /out prefix in files to get output files. Otherwise it'll
    // return source files. But the files read can only read /out files, therefore it must be stripped
    // from resource URIs.
    const filePath = 'out'
    const files = await this.vercelApi.getDeploymentFileTree(deploymentUrl, filePath, accessToken, teamId)

    return files.map((file) => ({
      deploymentUrl,
      deployment,
      filePath: path.join(filePath, file.name),
      file,
      accessToken,
      teamId,
    }))
  }

  refreshRoot() {
    this.onDidChangeTreeDataEventEmitter.fire(undefined)
  }
}

@Injectable()
export class DeploymentFilesTreeView implements vscode.Disposable {
  private readonly treeView: vscode.TreeView<DeploymentFileTreeData | undefined>
  private readonly disposable: vscode.Disposable

  constructor(
    private readonly treeDataProvider: DeploymentFilesTreeDataProvider,
    private readonly deploymentsState: DeploymentsStateProvider,
    private readonly filesState: DeploymentFilesStateProvider,
  ) {
    this.treeView = vscode.window.createTreeView(TreeId.DeploymentFiles, {
      treeDataProvider,
      showCollapseAll: true,
    })

    this.disposable = vscode.Disposable.from(
      // biome-ignore format: Keep it one line.
      vscode.commands.registerCommand(CommandId.SelectDeploymentForFiles, this.setSelectedDeploymentId, this),
      vscode.commands.registerCommand(CommandId.RefreshDeploymentFiles, this.refreshDeploymentFiles, this),
    )
  }

  dispose() {
    this.treeView.dispose()
    this.disposable.dispose()
  }

  private async setSelectedDeploymentId(deploymentId: string, projectId: string, teamId: string) {
    const deployment = await this.deploymentsState.getDeploymentOrFetch(deploymentId, projectId, teamId)
    if (!deployment) return

    await this.filesState.setSelectedDeployment(deployment)
    await vscode.commands.executeCommand(`${TreeId.DeploymentFiles}.focus`)
  }

  private refreshDeploymentFiles() {
    this.treeDataProvider.refreshRoot()
  }
}

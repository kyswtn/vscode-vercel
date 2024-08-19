import path from 'pathe'
import * as vscode from 'vscode'
import {AuthenticationStateProvider} from './authentication-state-provider'
import {CommandId, TreeId, UriAuthority, fileSystemProviderScheme} from './constants'
import {DeploymentsStateProvider} from './deployments-state-provider'
import {Injectable} from './lib'
import {VercelFile} from './types'
import {isValidVercelFile} from './utils/validation'
import {VercelApiClient} from './vercel-api-client'

type DeploymentFileTreeData = {
  deploymentId: string
  deploymentUrl: string
  file: VercelFile
  filePath: string

  accessToken: string
  teamId: string | undefined
}

@Injectable()
export class DeploymentFilesTreeDataProvider
  implements vscode.TreeDataProvider<DeploymentFileTreeData>, vscode.Disposable
{
  private readonly onDidChangeTreeDataEventEmitter = new vscode.EventEmitter<DeploymentFileTreeData | undefined>()
  private readonly disposable: vscode.Disposable

  constructor(
    private readonly vercelApi: VercelApiClient,
    private readonly auth: AuthenticationStateProvider,
    private readonly deploymentsState: DeploymentsStateProvider,
  ) {
    this.disposable = this.deploymentsState.onDidSetFocusedDeployment(() => {
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
    const {deploymentId, file, filePath} = data
    const treeItem = new vscode.TreeItem(
      file.name,
      file.type === 'directory' ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
    )

    if (file.type === 'lambda') {
      treeItem.iconPath = new vscode.ThemeIcon('cloud')
    }

    if (file.type === 'file') {
      const filePathWithoutOut = filePath.replace(/^out\//i, '')
      let resourceUri = `${fileSystemProviderScheme}://${UriAuthority.Deployments}/${deploymentId}/files/${filePathWithoutOut}`

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
      const files = await this.vercelApi
        .getDeploymentFileTree(deploymentUrl, filePath, accessToken, teamId)
        .then((files) => files.filter(isValidVercelFile))

      return files.map((file) => ({
        ...item,
        file,
        filePath: path.join(item.filePath, file.name),
      }))
    }

    const currentSession = this.auth.currentSession
    if (!currentSession) return []
    const {accessToken, teamId} = currentSession

    const focusedDeployment = this.deploymentsState.focusedDeployment
    const deploymentUrl = focusedDeployment?.url
    if (!deploymentUrl) return []

    // Vercel API requires us to pass in /out prefix in files to get output files. Otherwise it'll
    // return source files. But the files read can only read /out files, therefore it must be stripped
    // from resource URIs.
    const filePath = 'out'

    const files = await this.vercelApi
      .getDeploymentFileTree(focusedDeployment.url, filePath, accessToken, teamId)
      .then((files) => files.filter(isValidVercelFile))

    return files.map((file) => ({
      deploymentId: focusedDeployment.id,
      filePath: path.join(filePath, file.name),
      deploymentUrl,
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
  ) {
    this.treeView = vscode.window.createTreeView(TreeId.DeploymentFiles, {
      treeDataProvider,
      showCollapseAll: true,
    })

    this.disposable = vscode.Disposable.from(
      // biome-ignore format: Keep it one line.
      vscode.commands.registerCommand(CommandId.SetFocusedDeploymentId, this.setFocusedDeploymentId, this),
      vscode.commands.registerCommand(CommandId.RefreshDeploymentFiles, this.refreshDeploymentFiles, this),
    )
  }

  dispose() {
    this.treeView.dispose()
    this.disposable.dispose()
  }

  private async setFocusedDeploymentId(id: string) {
    await this.deploymentsState.setFocusedDeploymentId(id)
    await vscode.commands.executeCommand(`${TreeId.DeploymentFiles}.focus`)
  }

  private refreshDeploymentFiles() {
    this.treeDataProvider.refreshRoot()
  }
}

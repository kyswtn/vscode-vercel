import ms from 'ms'
import * as vscode from 'vscode'
import {ConfigId, FileSystemProviderScheme, TreeId, TreeItemContextValue} from '../constants'
import {Injectable} from '../lib'
import {DeploymentContentStateProvider} from '../state/deployment-content-state-provider'
import {ExtensionConfigStateProvider} from '../state/extension-config-state-provider'
import {CustomIcon, VercelDeploymentCheck, VercelDeploymentCheckConclusion, VercelDeploymentCheckStatus} from '../types'

const checkStatusIcons = {
  registered: 'issue-draft',
  running: 'wrench',
  completed: 'custom-icons-blank' satisfies CustomIcon,

  canceled: 'close',
  failed: 'error',
  neutral: 'issue-draft',
  skipped: 'issue-draft',
  succeeded: 'pass',
  stale: 'watch',
} satisfies Record<VercelDeploymentCheckStatus | VercelDeploymentCheckConclusion, string>

const checkIconColors = {
  registered: 'testing.iconUnset',
  running: 'inputValidation.warningBorder',
  completed: 'testing.iconUnset',

  canceled: 'testing.iconSkipped',
  failed: 'testing.iconErrored',
  neutral: 'testing.iconUnset',
  skipped: 'testing.iconSkipped',
  succeeded: 'testing.iconPassed',
  stale: 'testing.iconQueued',
} satisfies Record<VercelDeploymentCheckStatus | VercelDeploymentCheckConclusion, string>

class DeploymentCheckTreeItem extends vscode.TreeItem {
  override contextValue = TreeItemContextValue.Check
  private readonly checkStatus: VercelDeploymentCheckStatus | VercelDeploymentCheckConclusion

  constructor(private readonly check: VercelDeploymentCheck) {
    super(check.name, vscode.TreeItemCollapsibleState.None)
    this.checkStatus = check.conclusion ?? check.status

    this.id = check.id
    this.iconPath = this.getIcon()
    this.resourceUri = vscode.Uri.parse(`${FileSystemProviderScheme.View}://checks/${check.id}`)
    this.description = this.checkStatus.toUpperCase()
    this.tooltip = this.getTooltip()
  }

  private getIcon() {
    return new vscode.ThemeIcon(
      checkStatusIcons[this.checkStatus],
      new vscode.ThemeColor(checkIconColors[this.checkStatus]),
    )
  }

  private getTooltip() {
    const tooltip = new vscode.MarkdownString('', true)
    const iconId = (this.iconPath as vscode.ThemeIcon).id

    const {name, createdAt, updatedAt} = this.check
    const lastUpdatedMsAgo = new Date().getTime() - (updatedAt ?? createdAt)

    tooltip.appendMarkdown(`$(${iconId}) ${name}\n\n---\n\n`)
    tooltip.appendMarkdown(`$(info) ${this.checkStatus} ${ms(lastUpdatedMsAgo)} ago\n\n`)

    return tooltip
  }
}

@Injectable()
export class DeploymentChecksTreeDataProvider implements vscode.TreeDataProvider<vscode.TreeItem>, vscode.Disposable {
  private refreshInterval: ReturnType<typeof setInterval> | undefined
  private readonly onDidChangeTreeDataEventEmitter = new vscode.EventEmitter<vscode.TreeItem | undefined>()
  private readonly disposable: vscode.Disposable

  constructor(
    private readonly deploymentContent: DeploymentContentStateProvider,
    private readonly extensionConfig: ExtensionConfigStateProvider,
  ) {
    this.configureRefreshInterval()
    this.disposable = vscode.Disposable.from(
      this.deploymentContent.onDidChangeSelectedDeployment((newDeploymentId) => {
        ;(async () => {
          if (newDeploymentId) {
            await this.deploymentContent.loadDeploymentChecksInBackground()
            this.refreshRoot()
          }
          this.configureRefreshInterval()
        })()
      }),
      this.extensionConfig.onDidChangeConfig((configId) => {
        if (configId === ConfigId.ChecksAutoRefresh) {
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

  getTreeItem(data: vscode.TreeItem): vscode.TreeItem {
    return data
  }

  async getChildren(): Promise<vscode.TreeItem[]> {
    return this.deploymentContent.deploymentChecks.map((check) => new DeploymentCheckTreeItem(check))
  }

  refreshRoot() {
    this.onDidChangeTreeDataEventEmitter.fire(undefined)
  }

  private configureRefreshInterval() {
    clearInterval(this.refreshInterval)
    this.refreshInterval = undefined
    if (!this.extensionConfig.checksAutoRefresh || !this.deploymentContent.selectedDeployment) return

    this.refreshInterval = setInterval(() => {
      ;(async () => {
        await this.deploymentContent.loadDeploymentChecksInBackground()
        this.refreshRoot()
      })()
    }, 6 * 1000) // Refresh checks 10 times a minute.
  }
}

@Injectable()
export class DeploymentChecksTreeView implements vscode.Disposable {
  private readonly treeView: vscode.TreeView<vscode.TreeItem | undefined>

  constructor(treeDataProvider: DeploymentChecksTreeDataProvider) {
    this.treeView = vscode.window.createTreeView(TreeId.DeploymentChecks, {
      treeDataProvider,
    })
  }

  dispose() {
    this.treeView.dispose()
  }
}

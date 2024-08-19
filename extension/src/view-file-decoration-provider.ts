import ms from 'ms'
import * as vscode from 'vscode'
import {DeploymentsStateProvider} from './deployments-state-provider'
import {Injectable} from './lib'

@Injectable()
export class ViewFileDecorationProvider implements vscode.FileDecorationProvider, vscode.Disposable {
  private readonly onDidChangeEventEmitter = new vscode.EventEmitter<vscode.Uri | vscode.Uri[] | undefined>()
  private readonly disposable: vscode.Disposable

  constructor(private readonly deploymentsState: DeploymentsStateProvider) {
    this.disposable = vscode.window.registerFileDecorationProvider(this)
  }

  dispose() {
    this.disposable.dispose()
  }

  get onDidChangeFileDecorations() {
    return this.onDidChangeEventEmitter.event
  }

  provideFileDecoration(uri: vscode.Uri) {
    if (uri.scheme !== 'vscode-vercel-view') return
    if (uri.authority === 'deployments') {
      const deploymentId = uri.path.substring(1)
      return this.decorateDeployment(deploymentId)
    }

    return
  }

  private decorateDeployment(deploymentId: string): vscode.FileDecoration | undefined {
    const deployment = this.deploymentsState.deployments.find((deployment) => deployment.id === deploymentId)
    if (!deployment) return

    const currentDeploymentIds = this.deploymentsState.getCurrentDeploymentIds()
    if (currentDeploymentIds.includes(deploymentId)) {
      const {createdAt, bootedAt} = deployment.data
      const timeAgo = ms(new Date().getTime() - (bootedAt ?? createdAt))

      return {
        badge: '⏶',
        tooltip: `Promoted ${timeAgo} ago`,
      }
    }

    if (deployment.data.target === 'production') {
      return {
        badge: 'P',
      }
    }

    return
  }
}

import * as vscode from 'vscode'
import {TreeId} from './constants'
import {Injectable} from './lib'

// TODO: Add deployment checks.

@Injectable()
export class DeploymentChecksTreeDataProvider implements vscode.TreeDataProvider<vscode.TreeItem>, vscode.Disposable {
  private readonly onDidChangeTreeDataEventEmitter = new vscode.EventEmitter<vscode.TreeItem | undefined>()

  dispose() {
    this.onDidChangeTreeDataEventEmitter.dispose()
  }

  get onDidChangeTreeData() {
    return this.onDidChangeTreeDataEventEmitter.event
  }

  getTreeItem(data: vscode.TreeItem): vscode.TreeItem {
    return data
  }

  async getChildren(): Promise<vscode.TreeItem[]> {
    return []
  }

  refreshRoot() {
    this.onDidChangeTreeDataEventEmitter.fire(undefined)
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

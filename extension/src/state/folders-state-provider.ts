import * as vscode from 'vscode'
import {Injectable} from '../lib'
import {diffArrays, normalizePath} from '../utils'

/**
 * Manages state for workspace folders without overlapping, i.e. in a directory structure like `A/B`,
 * VSCode allows opening both `B` and `A/B` in different workspace folders in the same window. In that
 * case we'll only take `A`.
 */
@Injectable()
export class FoldersStateProvider implements vscode.Disposable {
  private _folders: vscode.WorkspaceFolder[]
  private readonly onDidChangeFoldersEventEmitter = new vscode.EventEmitter<vscode.WorkspaceFoldersChangeEvent>()
  private readonly disposable: vscode.Disposable

  constructor() {
    this._folders = this.getWorkspaceFoldersWithoutOverlaps()
    this.disposable = vscode.workspace.onDidChangeWorkspaceFolders(() => {
      const oldFolders = this._folders
      const newFolders = (this._folders = this.getWorkspaceFoldersWithoutOverlaps())

      const diff = diffArrays(oldFolders, newFolders, (l, r) => l.uri.path === r.uri.path)
      if (diff) this.onDidChangeFoldersEventEmitter.fire(diff)
    })
  }

  dispose() {
    this.disposable.dispose()
    this.onDidChangeFoldersEventEmitter.dispose()
  }

  get folders(): readonly vscode.WorkspaceFolder[] {
    return this._folders
  }

  get onDidChangeFolders() {
    return this.onDidChangeFoldersEventEmitter.event
  }

  getParentFolder(uri: vscode.Uri) {
    const folders = [...this._folders]
      // Sort the folders so that shorter URIs come first. Though this should not be necessary as
      // this._folders is guranteed to not contain any overlapped URIs.
      .sort((next, prev) => next.uri.path.length - prev.uri.path.length)

    const found = folders.find((folder) => uri.path.startsWith(folder.uri.path))
    return found
  }

  private getWorkspaceFoldersWithoutOverlaps() {
    const folders = (vscode.workspace.workspaceFolders ?? [])
      // Ensure that all folders have normalized URIs.
      .map((folder) => ({...folder, uri: folder.uri.with({path: normalizePath(folder.uri.path)})}))
      // Sort the folders so that longer URIs come first.
      .sort((next, prev) => prev.uri.path.length - next.uri.path.length)

    // Loop through the sorted array and check if other folder URIs start with the same path.
    // Otherwise add it to the final result array.
    const result: vscode.WorkspaceFolder[] = []
    for (const folder of folders) {
      if (!folders.some((f) => f.index !== folder.index && f.uri.path.startsWith(folder.uri.path))) {
        result.push(folder)
      }
    }

    return result
  }
}

import * as vscode from 'vscode'
import {ConfigId, extensionPrefix} from './constants'
import {Injectable} from './lib'

@Injectable()
export class ExtensionConfiguration implements vscode.Disposable {
  private readonly config = vscode.workspace.getConfiguration()
  private readonly disposable: vscode.Disposable
  private _filesExclude: string[] = []

  constructor() {
    this.updateCache()
    this.disposable = vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(extensionPrefix)) {
        this.updateCache()
      }
    })
  }

  dispose() {
    this.disposable.dispose()
  }

  private updateCache() {
    // `files.exclude` is not a string array. It's an object of patterns with boolean values.
    const vscodeFilesExclude = this.config.get<Record<string, boolean>>('files.exclude', {})
    const vscodeFilesExcludeGlobs = Object.entries(vscodeFilesExclude)
      .filter(([, enabled]) => enabled)
      .map(([globPattern]) => globPattern)

    this._filesExclude = [...vscodeFilesExcludeGlobs, ...this.config.get<string[]>(ConfigId.FilesExclude, [])]
  }

  get filesExclude() {
    return this._filesExclude
  }
}

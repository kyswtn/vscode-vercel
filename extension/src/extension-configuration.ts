import * as vscode from 'vscode'
import {ConfigId, extensionPrefix} from './constants'
import {Injectable} from './lib'
import {diffArrays} from './utils'

export type OnDidChangeFilesExcludeEvent = {
  added: string[]
  removed: string[]
}

@Injectable()
export class ExtensionConfiguration implements vscode.Disposable {
  private readonly disposable: vscode.Disposable
  private filesConfig = vscode.workspace.getConfiguration('files')
  private vercelConfig = vscode.workspace.getConfiguration(extensionPrefix)

  private allFilesExclude = this.getAllFilesExclude()
  private readonly onDidChangeFilesExcludeEventEmitter = new vscode.EventEmitter<OnDidChangeFilesExcludeEvent>()

  constructor() {
    this.disposable = vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(extensionPrefix)) {
        this.vercelConfig = vscode.workspace.getConfiguration(extensionPrefix)
      }

      if (event.affectsConfiguration('files')) {
        this.filesConfig = vscode.workspace.getConfiguration('files')
      }

      if (this.affectsSomeConfigurations(event, [`${extensionPrefix}.${ConfigId.FilesExclude}`, 'files.exclude'])) {
        const newFileExcludes = this.getAllFilesExclude()
        const diff = diffArrays(this.allFilesExclude, newFileExcludes)

        if (diff) {
          this.allFilesExclude = newFileExcludes
          this.onDidChangeFilesExcludeEventEmitter.fire(diff)
        }
      }
    })
  }

  dispose() {
    this.disposable.dispose()
  }

  get filesExclude() {
    return this.allFilesExclude
  }

  get onDidChangeFilesExclude() {
    return this.onDidChangeFilesExcludeEventEmitter.event
  }

  private affectsSomeConfigurations(event: vscode.ConfigurationChangeEvent, sections: string[]) {
    return sections.some((section) => event.affectsConfiguration(section))
  }

  private getAllFilesExclude() {
    // `files.exclude` is not a string array. It's an object of patterns with boolean values.
    const vscodeFilesExclude = this.filesConfig.get<Record<string, boolean>>('exclude', {})
    const vscodeFilesExcludeGlobs = Object.entries(vscodeFilesExclude)
      .filter(([, enabled]) => enabled)
      .map(([glob]) => glob)

    return [...vscodeFilesExcludeGlobs, ...this.vercelConfig.get<string[]>(ConfigId.FilesExclude, [])]
  }
}

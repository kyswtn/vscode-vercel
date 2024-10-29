import * as vscode from 'vscode'
import {ConfigId} from '../constants'
import {Injectable} from '../lib'
import {diffArrays} from '../utils'

@Injectable()
export class ExtensionConfigStateProvider implements vscode.Disposable {
  private _filesExclude = this.getAllFilesExclude()
  private _logsAutoRefresh = this.getExtensionConfig(ConfigId.LogsAutoRefresh, true)
  private _checksAutoRefresh = this.getExtensionConfig(ConfigId.ChecksAutoRefresh, true)
  private _deploymentsAutoRefresh = this.getExtensionConfig(ConfigId.DeploymentsAutoRefresh, true)
  private _deploymentsAutoRefreshPeriod = this.getExtensionConfig(ConfigId.DeploymentsAutoRefreshPeriod, 30)
  private readonly onDidChangeConfigEventEmitter = new vscode.EventEmitter<ConfigId>()
  private readonly disposable: vscode.Disposable

  constructor() {
    this.disposable = vscode.workspace.onDidChangeConfiguration((event) => {
      // This is very boilerplate-y and repeated. I'll make it drier next time once I've settled
      // on configuration system design for VEDK.

      if (this.affectsSomeConfigurations(event, ['files.exclude', ConfigId.FilesExclude])) {
        const newFilesExclude = this.getAllFilesExclude()
        const diff = diffArrays(this._filesExclude, newFilesExclude)

        if (diff) {
          this._filesExclude = newFilesExclude
          this.onDidChangeConfigEventEmitter.fire(ConfigId.FilesExclude)
        }
      }

      if (event.affectsConfiguration(ConfigId.LogsAutoRefresh)) {
        const oldValue = this._logsAutoRefresh
        this._logsAutoRefresh = this.getExtensionConfig(ConfigId.LogsAutoRefresh, true)

        if (this._logsAutoRefresh !== oldValue) {
          this.onDidChangeConfigEventEmitter.fire(ConfigId.LogsAutoRefresh)
        }
      }

      if (event.affectsConfiguration(ConfigId.ChecksAutoRefresh)) {
        const oldValue = this._logsAutoRefresh
        this._checksAutoRefresh = this.getExtensionConfig(ConfigId.ChecksAutoRefresh, true)

        if (this._checksAutoRefresh !== oldValue) {
          this.onDidChangeConfigEventEmitter.fire(ConfigId.ChecksAutoRefresh)
        }
      }

      if (event.affectsConfiguration(ConfigId.DeploymentsAutoRefresh)) {
        const oldValue = this._deploymentsAutoRefresh
        this._deploymentsAutoRefresh = this.getExtensionConfig(ConfigId.DeploymentsAutoRefresh, true)

        if (this._deploymentsAutoRefresh !== oldValue) {
          this.onDidChangeConfigEventEmitter.fire(ConfigId.DeploymentsAutoRefresh)
        }
      }

      if (event.affectsConfiguration(ConfigId.DeploymentsAutoRefreshPeriod)) {
        const oldValue = this._deploymentsAutoRefreshPeriod
        this._deploymentsAutoRefreshPeriod = this.getExtensionConfig(ConfigId.DeploymentsAutoRefreshPeriod, 6)

        if (this._deploymentsAutoRefreshPeriod !== oldValue) {
          this.onDidChangeConfigEventEmitter.fire(ConfigId.DeploymentsAutoRefreshPeriod)
        }
      }
    })
  }

  dispose() {
    this.disposable.dispose()
  }

  get onDidChangeConfig() {
    return this.onDidChangeConfigEventEmitter.event
  }

  get filesExclude() {
    return this._filesExclude
  }

  get logsAutoRefresh() {
    return this._logsAutoRefresh
  }

  get checksAutoRefresh() {
    return this._checksAutoRefresh
  }

  get deploymentsAutoRefresh() {
    return this._deploymentsAutoRefresh
  }

  get deploymentsAutoRefreshPeriod() {
    return this._deploymentsAutoRefreshPeriod
  }

  private getConfig<T>(path: string, scope: vscode.ConfigurationScope | null = null): T | undefined {
    const firstDot = path.indexOf('.')
    if (!firstDot) return undefined

    const section1 = path.slice(0, firstDot)
    const section2 = path.slice(firstDot + 1)
    return vscode.workspace.getConfiguration(section1, scope).get<T>(section2)
  }

  private getExtensionConfig<T>(id: string, defaultValue: T) {
    return this.getConfig<T>(id) ?? defaultValue
  }

  private affectsSomeConfigurations(event: vscode.ConfigurationChangeEvent, sections: string[]) {
    return sections.some((section) => event.affectsConfiguration(section))
  }

  private getAllFilesExclude() {
    // `files.exclude` is not a string array. It's an object of patterns with boolean values.
    const filesExclude = this.getExtensionConfig<Record<string, boolean>>('files.exclude', {})
    const filesExcludeGlobs = Object.entries(filesExclude)
      .filter(([, enabled]) => enabled)
      .map(([glob]) => glob)

    const vercelFilesExclude = this.getExtensionConfig<string[]>(ConfigId.FilesExclude, [])
    return filesExcludeGlobs.concat(vercelFilesExclude)
  }
}

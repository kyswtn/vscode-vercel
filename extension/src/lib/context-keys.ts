import * as vscode from 'vscode'
import {Injectable} from './decorators'
import {GlobalState} from './global-state'
import {Logger} from './logger'
import {WorkspaceState} from './workspace-state'

@Injectable()
export class ContextKeys implements vscode.Disposable {
  private readonly logger = new Logger(ContextKeys.name)
  private readonly persistStorageKey = 'persisted-context-keys'
  private readonly contextKeys = new Map<string, unknown>()
  private readonly onDidSetContextEventEmitter = new vscode.EventEmitter<string>()

  constructor(
    private readonly globalState: GlobalState,
    private readonly workspaceState: WorkspaceState,
  ) {}

  dispose() {
    this.onDidSetContextEventEmitter.dispose()
  }

  /**
   * Emits an event when `setContext` is called. Only works within the same workspace window.
   */
  get onDidSetContext() {
    return this.onDidSetContextEventEmitter.event
  }

  async restore() {
    const persisted: Record<string, unknown> = {
      ...this.globalState.get(this.persistStorageKey),
      // This means, workspace level persisted context keys will replace global ones in case of
      // name collision.
      ...this.workspaceState.get(this.persistStorageKey),
    }

    const entries = Object.entries(persisted)
    await Promise.allSettled(entries.map(([key, value]) => this.setContext(key, value)))
    this.logger.trace(`Restored ${entries.length} context key${entries.length === 1 ? '' : 's'}`)
  }

  async clear() {
    await Promise.all([
      this.globalState.update(this.persistStorageKey, undefined),
      this.workspaceState.update(this.persistStorageKey, undefined),
    ])
  }

  get<T>(name: string): T | undefined {
    return this.contextKeys.get(name) as T | undefined
  }

  async set<T>(name: string, value: T, persist?: 'workspaceState' | 'globalState') {
    if (persist) {
      await this[persist].update(this.persistStorageKey, {
        ...this[persist].get<T>(persist),
        [name]: value,
      })
    }
    await this.setContext(name, value)
    this.onDidSetContextEventEmitter.fire(name)
  }

  async delete(name: string, persist?: 'workspaceState' | 'globalState') {
    await this.set(name, undefined, persist)
  }

  private async setContext<T>(name: string, value: T) {
    this.logger.trace(`Setting context ${name} to ${String(value)}`)

    await vscode.commands.executeCommand('setContext', name, value)
    if (value === undefined) {
      this.contextKeys.delete(name)
    } else {
      this.contextKeys.set(name, value)
    }
  }
}

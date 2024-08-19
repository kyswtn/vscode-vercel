import * as vscode from 'vscode'
import {EXTENSION_CONTEXT_TOKEN, GLOBAL_STATE_TOKEN, SECRET_STORAGE_TOKEN, WORKSPACE_STATE_TOKEN} from './constants'
import {Container} from './container'
import {Logger} from './logger'
import type {Constructable} from './types'
import {isOnExtensionBootstrap} from './utils'

import {ContextKeys} from './context-keys'
import {GlobalState} from './global-state'
import {SecretStorage} from './secret-storage'
import {WorkspaceState} from './workspace-state'

type ExtensionOptions = {
  entries: Constructable[]
}

export class Extension {
  public readonly container = new Container()
  private readonly entries: Constructable[]

  constructor(options: ExtensionOptions) {
    this.entries = options.entries

    this.container.register(ContextKeys)
    this.container.register(WorkspaceState)
    this.container.register(GlobalState)
    this.container.register(SecretStorage)

    for (const entry of this.entries) {
      this.container.register(entry)
    }
  }

  async activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(this.container)

    this.container.register(EXTENSION_CONTEXT_TOKEN, context)
    this.container.register(GLOBAL_STATE_TOKEN, context.globalState)
    this.container.register(WORKSPACE_STATE_TOKEN, context.workspaceState)
    this.container.register(SECRET_STORAGE_TOKEN, context.secrets)

    // SAFETY: `package.json` content should always be a record.
    const packageJson = context.extension.packageJSON as Record<string, unknown>

    const extensionName = packageJson['displayName']
    if (!extensionName || typeof extensionName !== 'string') {
      throw new Error('`displayName` field must be set to a string in package.json file.')
    }

    // Setup logger.
    const logOutputChannel = vscode.window.createOutputChannel(extensionName, {log: true})
    logOutputChannel.clear()
    context.subscriptions.push(logOutputChannel)
    Logger.__output__ = logOutputChannel

    // Restore persisted context keys from other/previous sessions.
    const contextKeys = this.container.resolve(ContextKeys)
    await contextKeys.restore()

    // Resolve all entries.
    const resolvedEntries = this.entries.map((entry) => this.container.resolve(entry))

    // Run `OnExtensionBootstrap` lifecycle.
    const onExtensionBootstraps = resolvedEntries
      .filter(isOnExtensionBootstrap)
      .map((entry) => entry.onExtensionBootstrap())
    await Promise.all(onExtensionBootstraps)
  }
}

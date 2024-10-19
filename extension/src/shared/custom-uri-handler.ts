import * as vscode from 'vscode'
import {Injectable} from '../lib'

export type OnUriEvent = {
  path: string
  fragment: string
  query: Record<string, unknown>
}

@Injectable()
export class CustomUriHandler implements vscode.UriHandler, vscode.Disposable {
  private readonly onUriEventEmitter = new vscode.EventEmitter<OnUriEvent>()
  private readonly disposable: vscode.Disposable

  constructor() {
    this.disposable = vscode.window.registerUriHandler(this)
  }

  dispose() {
    this.onUriEventEmitter.dispose()
    this.disposable.dispose()
  }

  get onUri() {
    return this.onUriEventEmitter.event
  }

  handleUri(uri: vscode.Uri) {
    const queryParsed = Object.fromEntries(new URLSearchParams(uri.query))
    this.onUriEventEmitter.fire({
      path: uri.path,
      fragment: uri.fragment,
      query: queryParsed,
    })
  }
}

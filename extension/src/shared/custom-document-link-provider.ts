import * as vscode from 'vscode'
import {FileSystemProviderScheme} from '../constants'
import {Injectable} from '../lib'

@Injectable()
export class CustomDocumentLinkProvider implements vscode.DocumentLinkProvider, vscode.Disposable {
  private readonly disposable: vscode.Disposable

  constructor() {
    this.disposable = vscode.languages.registerDocumentLinkProvider({scheme: FileSystemProviderScheme.Files}, this)
  }

  dispose() {
    this.disposable.dispose()
  }

  async provideDocumentLinks(_document: vscode.TextDocument, _token: vscode.CancellationToken) {
    return null
  }

  async resolveDocumentLink(_link: vscode.DocumentLink, _token: vscode.CancellationToken) {
    return null
  }
}

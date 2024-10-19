import * as vscode from 'vscode'
import {FileSystemProviderScheme} from '../constants'
import {Injectable} from '../lib'
import {AuthenticationStateProvider} from '../state/authentication-state-provider'
import {DeploymentFilesStateProvider} from '../state/deployment-files-state-provider'
import {decodeId} from '../utils'

@Injectable()
export class FilesFileSystemProvider implements vscode.FileSystemProvider, vscode.Disposable {
  private readonly onDidChangeFileEventEmitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>()
  private readonly disposable: vscode.Disposable

  constructor(
    private readonly auth: AuthenticationStateProvider,
    private readonly deploymentFiles: DeploymentFilesStateProvider,
  ) {
    this.disposable = vscode.workspace.registerFileSystemProvider(FileSystemProviderScheme.Files, this, {
      // Because of teamId, projectId & deploymentId.
      isCaseSensitive: true,
      isReadonly: true,
    })
  }

  dispose() {
    this.disposable.dispose()
    this.onDidChangeFileEventEmitter.dispose()
  }

  get onDidChangeFile() {
    return this.onDidChangeFileEventEmitter.event
  }

  async stat(uri: vscode.Uri): Promise<vscode.FileStat> {
    if (!this.auth.currentSession) {
      throw vscode.FileSystemError.NoPermissions('User must be signed in to view deployment files.')
    }

    const uriParsed = this.parseUri(uri)
    const version = uri.query.includes('v6') ? 'v6' : undefined

    const fileContent = await this.deploymentFiles.getFile({...uriParsed, version})
    if (!fileContent) throw vscode.FileSystemError.FileNotFound()

    return {
      type: vscode.FileType.File,
      permissions: vscode.FilePermission.Readonly,
      ...fileContent,
    }
  }

  async readFile(uri: vscode.Uri) {
    if (!this.auth.currentSession) {
      throw vscode.FileSystemError.NoPermissions('User must be signed in to view deployment files.')
    }

    const uriParsed = this.parseUri(uri)
    const version = uri.query.includes('v6') ? 'v6' : undefined

    const fileContent = await this.deploymentFiles.getFile({...uriParsed, version})
    if (!fileContent) throw vscode.FileSystemError.FileNotFound()

    return fileContent.bytes
  }

  parseUri(uri: vscode.Uri) {
    const [deploymentId, projectId, teamId] = uri.authority.split('.')
    if (!deploymentId || !projectId || !teamId) {
      throw vscode.FileSystemError.FileNotFound('Invalid URL.')
    }

    // Make sure to remove the first slash.
    const filePath = uri.path.toString().replace(/^\/+/, '')

    return {
      deploymentId: decodeId(deploymentId),
      projectId: decodeId(projectId),
      teamId: decodeId(teamId),
      filePath,
    }
  }

  // All required methods below are intentionally unimplemented.

  watch(
    _uri: vscode.Uri,
    _options: {readonly recursive: boolean; readonly excludes: readonly string[]},
  ): vscode.Disposable {
    throw new Error('Method not implemented.')
  }
  readDirectory(_uri: vscode.Uri): [string, vscode.FileType][] | Thenable<[string, vscode.FileType][]> {
    throw new Error('Method not implemented.')
  }
  createDirectory(_uri: vscode.Uri): void | Thenable<void> {
    throw new Error('Method not implemented.')
  }
  writeFile(
    _uri: vscode.Uri,
    _content: Uint8Array,
    _options: {readonly create: boolean; readonly overwrite: boolean},
  ): void | Thenable<void> {
    throw new Error('Method not implemented.')
  }
  delete(_uri: vscode.Uri, _options: {readonly recursive: boolean}): void | Thenable<void> {
    throw new Error('Method not implemented.')
  }
  rename(_oldUri: vscode.Uri, _newUri: vscode.Uri, _options: {readonly overwrite: boolean}): void | Thenable<void> {
    throw new Error('Method not implemented.')
  }
}

import path from 'pathe'
import * as vscode from 'vscode'
import {AuthenticationStateProvider} from './authentication-state-provider'
import {DeploymentFileAccessType, UriAuthority, fileSystemProviderScheme} from './constants'
import {DeploymentContentsStateProvider} from './deployment-contents-state-provider'
import {Injectable} from './lib'
import {logAndShowErrorMessage} from './utils/errors'

@Injectable()
export class CustomFileSystemProvider implements vscode.FileSystemProvider, vscode.Disposable {
  private readonly onDidChangeFileEventEmitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>()
  private readonly disposable: vscode.Disposable

  constructor(
    private readonly auth: AuthenticationStateProvider,
    private readonly deploymentContents: DeploymentContentsStateProvider,
  ) {
    this.disposable = vscode.workspace.registerFileSystemProvider(fileSystemProviderScheme, this, {
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
    const {deploymentId, accessType, path: filePath} = this.parseUri(uri)
    if (!this.auth.currentSession) {
      throw new Error(`User must be signed in to view deployment ${accessType}.`)
    }

    try {
      switch (accessType) {
        case DeploymentFileAccessType.Events: {
          const events = await this.deploymentContents.getEvents(deploymentId)
          if (!events) throw vscode.FileSystemError.FileNotFound()

          return {
            type: vscode.FileType.File,
            permissions: vscode.FilePermission.Readonly,
            size: events.size,
            ctime: events.ctime,
            mtime: events.mtime,
          }
        }
        case DeploymentFileAccessType.Files: {
          const useV6 = uri.query.includes('v6')
          const fileContent = await this.deploymentContents.getFileContent(deploymentId, filePath ?? '', useV6)
          if (!fileContent) throw vscode.FileSystemError.FileNotFound()

          return {
            type: vscode.FileType.File,
            permissions: vscode.FilePermission.Readonly,
            size: fileContent.size,
            ctime: fileContent.ctime,
            mtime: fileContent.mtime,
          }
        }
        default:
          throw vscode.FileSystemError.FileNotFound()
      }
    } catch (error) {
      logAndShowErrorMessage(error, `fetch deployment ${accessType}`)
      throw error
    }
  }

  async readFile(uri: vscode.Uri) {
    const {accessType, deploymentId, path: filePath} = this.parseUri(uri)
    if (!this.auth.currentSession) {
      throw new Error(`User must be signed in to view deployment ${accessType}.`)
    }

    try {
      switch (accessType) {
        case DeploymentFileAccessType.Events: {
          const events = await this.deploymentContents.getEvents(deploymentId)
          if (!events) throw vscode.FileSystemError.FileNotFound()

          return events.bytes
        }
        case DeploymentFileAccessType.Files: {
          const useV6 = uri.query.includes('v6')
          const fileContent = await this.deploymentContents.getFileContent(deploymentId, filePath ?? '/', useV6)
          if (!fileContent) throw vscode.FileSystemError.FileNotFound()

          return fileContent.bytes
        }
        default:
          throw vscode.FileSystemError.FileNotFound()
      }
    } catch (error) {
      logAndShowErrorMessage(error, `fetch deployment ${accessType}`)
      throw error
    }
  }

  parseUri(uri: vscode.Uri) {
    if (uri.authority !== UriAuthority.Deployments) {
      throw vscode.FileSystemError.FileNotFound('Only deployment related files are supported.')
    }

    const pathString = uri.path.toString()
    const matched = pathString.match(/^(?:\/?)([^\/]+)\/([^\/]+)(?:\/?)(.*)/)

    const deploymentId = matched?.[1]
    const fileAccessType = matched?.[2]

    if (!matched || !deploymentId || !fileAccessType) {
      throw vscode.FileSystemError.FileNotFound('Invalid file path.')
    }

    if (fileAccessType.endsWith('.log')) {
      return {
        deploymentId,
        accessType: DeploymentFileAccessType.Events,
        deploymentName: path.basename(fileAccessType, '.log'),
      }
    }

    return {
      deploymentId,
      accessType: DeploymentFileAccessType.Files,
      path: matched?.[3],
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

import * as vscode from 'vscode'
import {ConfigId, FileSystemProviderScheme} from '../constants'
import {Injectable} from '../lib'
import {AuthenticationStateProvider} from '../state/authentication-state-provider'
import {DeploymentContentStateProvider, GetFileOptions} from '../state/deployment-content-state-provider'
import {ExtensionConfigStateProvider} from '../state/extension-config-state-provider'
import {decodeId, isLogFilePath} from '../utils'

type ParsedUri = GetFileOptions
type ParsedUriAuthority = Pick<ParsedUri, 'teamId' | 'projectId' | 'deploymentId'>

@Injectable()
export class CustomFileSystemProvider implements vscode.FileSystemProvider, vscode.Disposable {
  private readonly onDidChangeFileEventEmitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>()
  private readonly parsedUriAuthorities = new Map<string, ParsedUriAuthority>()
  private readonly disposable: vscode.Disposable
  private refreshInterval: ReturnType<typeof setInterval> | undefined
  private watchedFileUris: vscode.Uri[] = []

  constructor(
    private readonly authState: AuthenticationStateProvider,
    private readonly deploymentContentState: DeploymentContentStateProvider,
    private readonly extensionConfig: ExtensionConfigStateProvider,
  ) {
    this.configureRefreshInterval()
    this.disposable = vscode.Disposable.from(
      vscode.workspace.registerFileSystemProvider(FileSystemProviderScheme.Files, this, {
        // Because of teamId, projectId & deploymentId.
        isCaseSensitive: true,
        isReadonly: true,
      }),
      vscode.window.onDidChangeVisibleTextEditors((editors) => {
        const allOpenedUris = editors
          .filter((e) => !e.document.isClosed && e.document.uri.scheme === FileSystemProviderScheme.Files)
          .map((e) => e.document.uri)

        // We'll only watch log files for now. Other files should not change once built.
        this.watchedFileUris = allOpenedUris.filter((uri) => isLogFilePath(uri.fsPath))
      }),
      extensionConfig.onDidChangeConfig((configId) => {
        if (configId === ConfigId.LogsAutoRefresh) {
          this.configureRefreshInterval()
        }
      }),
    )
  }

  dispose() {
    this.disposable.dispose()
    this.onDidChangeFileEventEmitter.dispose()
    clearInterval(this.refreshInterval)
  }

  get onDidChangeFile() {
    return this.onDidChangeFileEventEmitter.event
  }

  async stat(uri: vscode.Uri) {
    const uriParsed = this.parseUri(uri)
    const file = await this.getFile(uriParsed)
    return file
  }

  async readFile(uri: vscode.Uri) {
    const uriParsed = this.parseUri(uri)
    const file = await this.getFile(uriParsed)
    return file.bytes
  }

  parseUri(uri: vscode.Uri) {
    const authorityParsed = this.parseUriAuthority(uri.authority)

    // Make sure to remove the first slash.
    const filePath = uri.path.toString().replace(/^\/+/, '')

    // We'll allow the user to specify the apiVersion with a query param.
    const apiVersion = uri.query.includes('v6') ? 'v6' : undefined

    return {
      ...authorityParsed,
      filePath,
      apiVersion,
    } satisfies ParsedUri
  }

  private parseUriAuthority(authority: string) {
    const memoized = this.parsedUriAuthorities.get(authority)
    if (memoized) return memoized

    const [deploymentId, projectId, teamId] = authority.split('.')
    if (!deploymentId || !projectId || !teamId) {
      throw vscode.FileSystemError.FileNotFound('Invalid URL.')
    }

    const result: ParsedUriAuthority = {
      deploymentId: decodeId(deploymentId),
      projectId: decodeId(projectId),
      teamId: decodeId(teamId),
    }
    this.parsedUriAuthorities.set(authority, result)
    return result
  }

  private async getFile(options: ReturnType<typeof this.parseUri>) {
    if (!this.authState.currentSession) {
      throw vscode.FileSystemError.NoPermissions('User must be signed in to view deployment files.')
    }

    const fileContent = await this.deploymentContentState.getFile(options)
    if (!fileContent) throw vscode.FileSystemError.FileNotFound()

    return {
      type: vscode.FileType.File,
      permissions: vscode.FilePermission.Readonly,
      ...fileContent,
    } satisfies vscode.FileStat
  }

  private configureRefreshInterval() {
    clearInterval(this.refreshInterval)
    if (!this.extensionConfig.logsAutoRefresh) return

    this.refreshInterval = setInterval(() => {
      if (this.watchedFileUris.length < 1) return

      this.onDidChangeFileEventEmitter.fire(
        this.watchedFileUris.map((uri) => ({
          type: vscode.FileChangeType.Changed,
          uri,
        })),
      )
    }, 6 * 1000) // Refresh log files 10 times a minute. Max rate-limit.
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

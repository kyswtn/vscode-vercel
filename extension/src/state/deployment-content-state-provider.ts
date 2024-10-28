import stripAnsi from 'strip-ansi'
import * as vscode from 'vscode'
import {ContextId, finishedDeploymentStates} from '../constants'
import {ContextKeys, Injectable} from '../lib'
import {VercelDeployment} from '../models/vercel-deployment'
import {formatTimestamp, isLogFilePath} from '../utils'
import {VercelApiClient} from '../vercel-api-client'
import {AuthenticationStateProvider} from './authentication-state-provider'
import {DeploymentsStateProvider} from './deployments-state-provider'

export type FileContent = {
  bytes: Buffer
  size: number
  ctime: number
  mtime: number
}

export type GetFileOptions = {
  teamId: string
  projectId: string
  deploymentId: string
  filePath: string
  apiVersion: string | undefined
}

@Injectable()
export class DeploymentContentStateProvider implements vscode.Disposable {
  // We only have one sidebar, so files for only one deployment can be displayed at a time.
  // Everytime this gets mutated, we'll reset the cache, otherwise the cache will never be GC-ed.
  private _selectedDeployment: VercelDeployment | undefined
  private readonly onDidChangeSelectedDeploymentEventEmitter = new vscode.EventEmitter<void>()
  private readonly files: Map<string, FileContent> = new Map()
  private readonly disposable: vscode.Disposable

  constructor(
    private readonly authState: AuthenticationStateProvider,
    private readonly contextKeys: ContextKeys,
    private readonly deploymentsState: DeploymentsStateProvider,
    private readonly vercelApi: VercelApiClient,
  ) {
    this.disposable = vscode.Disposable.from(
      this.onDidChangeSelectedDeploymentEventEmitter.event(() => {
        this.files.clear()
      }),
    )
  }

  dispose() {
    this.disposable.dispose()
    this.onDidChangeSelectedDeploymentEventEmitter.dispose()
  }

  get selectedDeployment() {
    return this._selectedDeployment
  }

  async setSelectedDeployment(deployment: VercelDeployment) {
    const oldSelectedDeployment = this._selectedDeployment
    this._selectedDeployment = deployment

    if (oldSelectedDeployment?.id !== deployment?.id) {
      this.onDidChangeSelectedDeploymentEventEmitter.fire()
    }

    await this.contextKeys.set(ContextId.SelectedDeploymentIdForFiles, deployment.hashPath)
  }

  get onDidChangeSelectedDeployment() {
    return this.onDidChangeSelectedDeploymentEventEmitter.event
  }

  async getFile(options: GetFileOptions) {
    const currentSession = this.authState.currentSession
    if (!currentSession) return
    const {accessToken} = currentSession

    const {deploymentId, projectId, teamId, filePath, apiVersion} = options
    const deployment = await this.deploymentsState.getDeploymentOrFetch(deploymentId, projectId, teamId)
    if (!deployment) throw vscode.FileSystemError.FileNotFound('Deployment for the file could not be found.')

    const key = `${deployment.hashPath}/${filePath}`
    const memoized = this.files.get(key)
    if (memoized) return memoized

    const isLogFile = isLogFilePath(filePath)
    const file: FileContent = isLogFile
      ? await this.getBuildLogs(deploymentId, accessToken, teamId)
      : await this.getFileContent(deploymentId, filePath, apiVersion, accessToken, teamId)

    // Set default ctime & mtime.
    file.ctime = file.ctime || (deployment.data.createdAt ?? 0)
    file.mtime = file.mtime || (deployment.data.bootedAt ?? file.ctime)

    // If the file is a log file, only cache if the deployment is done.
    if (!isLogFile || finishedDeploymentStates.includes(deployment.state)) {
      this.files.set(key, file)
    }

    return file
  }

  private async getFileContent(
    deploymentId: string,
    filePath: string,
    version: string | undefined,
    accessToken: string,
    teamId: string,
  ) {
    let fileData: Buffer
    if (version === 'v6') {
      const arrayBuffer = await this.vercelApi.getDeploymentFileContentV6(deploymentId, filePath, accessToken, teamId)
      fileData = Buffer.from(arrayBuffer)
    } else {
      const fileContent = await this.vercelApi.getDeploymentFileContent(deploymentId, filePath, accessToken, teamId)
      fileData = Buffer.from(fileContent, 'base64')
    }

    return {
      bytes: fileData,
      size: fileData.byteLength,
      ctime: 0,
      mtime: 0,
    }
  }

  private async getBuildLogs(deploymentId: string, accessToken: string, teamId: string) {
    // Build logs are internally referred to as deployment events.

    const events = await this.vercelApi.getDeploymentEvents(deploymentId, accessToken, teamId)
    const ctime = events[0]?.created ?? 0
    const mtime = (events.length > 0 ? events[events.length - 1]?.created : ctime) ?? 0

    const renderedString = events
      .filter((event) => 'text' in event)
      .map((event) => `${formatTimestamp(event.created)} ${stripAnsi(event.text!)}`)
      .join('\n')
    const renderedBytes = Buffer.from(renderedString, 'utf-8')

    return {
      bytes: renderedBytes,
      size: renderedBytes.byteLength,
      ctime,
      mtime,
    }
  }
}

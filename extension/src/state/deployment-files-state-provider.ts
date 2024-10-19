import path from 'pathe'
import stripAnsi from 'strip-ansi'
import * as vscode from 'vscode'
import {ContextId} from '../constants'
import {ContextKeys, Injectable} from '../lib'
import {VercelDeployment} from '../models/vercel-deployment'
import {formatTimestamp} from '../utils'
import {VercelApiClient} from '../vercel-api-client'
import {AuthenticationStateProvider} from './authentication-state-provider'
import {DeploymentsStateProvider} from './deployments-state-provider'

type FileContent = {
  bytes: Buffer
  size: number
  ctime: number
  mtime: number
}

type GetFileContentOptions = {
  teamId: string
  projectId: string
  deploymentId: string
  filePath: string
  version: 'v6' | undefined
}

@Injectable()
export class DeploymentFilesStateProvider implements vscode.Disposable {
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

    /**
     * The value for this should be in the format `teamId/projectId/deploymentId`. The reason is to
     * make it stateless to make viewing deployment files separately accessible outside of current
     * workspace projects, in the future.
     */
    const deploymentId = [deployment.project.teamId, deployment.project.id, deployment.id].join('/')
    await this.contextKeys.set(ContextId.SelectedDeploymentIdForFiles, deploymentId)
  }

  get onDidChangeSelectedDeployment() {
    return this.onDidChangeSelectedDeploymentEventEmitter.event
  }

  async getFile(options: GetFileContentOptions) {
    const currentSession = this.authState.currentSession
    if (!currentSession) return
    const {accessToken} = currentSession

    const {deploymentId, projectId, teamId, filePath, version} = options
    const deployment = await this.deploymentsState.getDeploymentOrFetch(deploymentId, projectId, teamId)
    if (!deployment) throw vscode.FileSystemError.FileNotFound('Deployment for the file could not be found.')

    const key = [teamId, projectId, deploymentId, filePath].join('/')
    const memoized = this.files.get(key)
    if (memoized) return memoized

    const isLogFile = ['.', '/'].includes(path.dirname(filePath)) && path.extname(filePath) === '.log'
    const file = isLogFile
      ? await this.getEvents(deploymentId, accessToken, teamId)
      : await this.getFileContent(deploymentId, filePath, version, accessToken, teamId)

    // Set default ctime & mtime.
    file.ctime = file.ctime || (deployment.data.createdAt ?? 0)
    file.mtime = file.mtime || (deployment.data.bootedAt ?? file.ctime)

    this.files.set(key, file)
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

  private async getEvents(deploymentId: string, accessToken: string, teamId: string) {
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

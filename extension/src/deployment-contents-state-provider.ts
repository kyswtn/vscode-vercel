import stripAnsi from 'strip-ansi'
import {AuthenticationStateProvider} from './authentication-state-provider'
import {Injectable} from './lib'
import {formatTimestamp} from './utils'
import {VercelApiClient} from './vercel-api-client'

type RenderedContent = {
  bytes: Buffer
  size: number
  ctime: number
  mtime: number
}

@Injectable()
export class DeploymentContentsStateProvider {
  private readonly events: Map<string, RenderedContent> = new Map()
  private readonly files: Map<string, RenderedContent> = new Map()

  constructor(
    private readonly auth: AuthenticationStateProvider,
    private readonly vercelApi: VercelApiClient,
  ) {}

  async getEvents(deploymentId: string) {
    if (!this.auth.currentSession) return
    const {accessToken, teamId} = this.auth.currentSession

    const memoized = this.events.get(deploymentId)
    if (memoized) return memoized

    const events = await this.vercelApi.getDeploymentEvents(deploymentId, accessToken, teamId)
    const ctime = events[0]?.created ?? 0
    const mtime = (events.length > 0 ? events[events.length - 1]?.created : ctime) ?? 0

    const renderedString = events
      .map((event) => {
        if (!('text' in event)) return ''
        return `${formatTimestamp(event.created)} ${stripAnsi(event.text)}`
      })
      .join('\n')
    const renderedBytes = Buffer.from(renderedString, 'utf-8')

    const event = {
      bytes: renderedBytes,
      size: renderedBytes.byteLength,
      ctime,
      mtime,
    }

    this.events.set(deploymentId, event)
    return event
  }

  async getFileContent(deploymentId: string, filePath: string, useV6 = false) {
    if (!this.auth.currentSession) return
    const {accessToken, teamId} = this.auth.currentSession

    const key = `${deploymentId}+${filePath}`
    const memoized = this.files.get(key)
    if (memoized) return memoized

    let fileData: Buffer
    if (useV6) {
      const arrayBuffer = await this.vercelApi.getDeploymentFileContentV6(deploymentId, filePath, accessToken, teamId)
      fileData = Buffer.from(arrayBuffer)
    } else {
      const fileContent = await this.vercelApi.getDeploymentFileContent(deploymentId, filePath, accessToken, teamId)
      fileData = Buffer.from(fileContent, 'base64')
    }

    const file = {
      bytes: fileData,
      size: fileData.byteLength,
      // TODO: Should I fetch time from deployment data? Is this important?
      ctime: 0,
      mtime: 0,
    }

    this.files.set(key, file)
    return file
  }
}

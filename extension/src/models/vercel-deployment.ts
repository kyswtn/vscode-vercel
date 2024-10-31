import {VercelDeploymentState} from '../constants'
import {PlainVercelDeployment, PlainVercelDeploymentListed, VercelDeploymentTarget} from '../types'
import {encodeId, parseDeploymentMeta} from '../utils'
import {VercelProject} from './vercel-project'

export class VercelDeployment {
  public readonly id: string
  public readonly name: string
  public readonly target: VercelDeploymentTarget | undefined
  public readonly state: VercelDeploymentState | undefined
  public readonly url: string | undefined
  public readonly authority: string
  public readonly hashPath: string
  private readonly metaParsed: ReturnType<typeof parseDeploymentMeta>

  constructor(
    public readonly data: PlainVercelDeployment | PlainVercelDeploymentListed,
    public readonly project: VercelProject,
  ) {
    this.id = 'id' in data ? data.id : data.uid
    this.name = data.name
    this.target = data.target
    this.url = data.url
    this.state = data.state
    this.authority = `${encodeId(this.id)}.${this.project.authority}`
    this.hashPath = `${this.project.hashPath}/${this.id}`

    if (data.meta) {
      this.metaParsed = parseDeploymentMeta(data.meta)
    }
  }

  get sourceProvider() {
    return this.metaParsed?.provider
  }

  get repo() {
    return this.metaParsed?.repo
  }

  get branch() {
    return this.metaParsed?.branch
  }

  get commit() {
    return this.metaParsed?.commit
  }
}

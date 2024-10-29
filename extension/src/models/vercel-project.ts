import {PlainVercelProject} from '../types'
import {encodeId, parseDeploymentMeta} from '../utils'

export class VercelProject {
  public readonly id: string
  public readonly name: string
  public readonly teamId: string
  public readonly url: string
  public readonly authority: string
  public readonly hashPath: string
  private readonly parsedLatestDeploymentMeta: ReturnType<typeof parseDeploymentMeta>

  constructor(private readonly project: PlainVercelProject) {
    this.id = project.id
    this.name = project.name
    this.teamId = project.accountId
    this.url = `https://vercel.com/${this.teamId}/${this.name}`
    this.authority = `${encodeId(this.id)}.${encodeId(this.teamId)}`
    this.hashPath = `${this.teamId}/${this.id}`

    const latestDeploymentMeta = this.project.latestDeployments?.[0]?.meta
    if (latestDeploymentMeta) {
      this.parsedLatestDeploymentMeta = parseDeploymentMeta(latestDeploymentMeta)
    }
  }

  get lastUpdatedMsAgo() {
    return new Date().getTime() - (this.project.updatedAt ?? this.project.createdAt)
  }

  get productionAlias() {
    return this.project.alias?.filter((alias) => alias.deployment)?.[0]?.domain || this.project.alias?.[0]?.domain
  }

  get latestDeploymentMeta() {
    return this.parsedLatestDeploymentMeta
  }
}

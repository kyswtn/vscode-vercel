import {PlainVercelProject} from './types'
import {parseDeploymentMeta} from './utils/vercel'

export class VercelProject {
  public readonly id: string
  public readonly teamId: string
  public readonly name: string
  private parsedLatestDeploymentMeta: ReturnType<typeof parseDeploymentMeta>

  constructor(private readonly project: PlainVercelProject) {
    this.id = project.id
    this.teamId = project.accountId
    this.name = project.name
  }

  get projectUrl() {
    // TODO: Using accountId as slug is undocumented and might break for old org style users or in the future.
    const {accountId, name} = this.project
    return `https://vercel.com/${accountId}/${name}`
  }

  get latestUpdatedMsAgo() {
    return new Date().getTime() - (this.project.updatedAt ?? this.project.createdAt)
  }

  get productionAlias() {
    return this.project.alias?.filter((alias) => alias.deployment)?.[0]?.domain || this.project.alias?.[0]?.domain
  }

  get latestDeploymentMeta() {
    if (!this.parsedLatestDeploymentMeta) {
      const latestDeploymentMeta = this.project.latestDeployments?.[0]?.meta
      if (latestDeploymentMeta) {
        this.parsedLatestDeploymentMeta = parseDeploymentMeta(latestDeploymentMeta)
      }
    }

    return this.parsedLatestDeploymentMeta
  }
}

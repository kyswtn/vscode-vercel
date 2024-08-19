import {PlainVercelDeployment} from './types'
import {parseDeploymentMeta} from './utils/vercel'

export class VercelDeployment {
  public readonly url: string | undefined
  private metaParsed: ReturnType<typeof parseDeploymentMeta>

  constructor(deployment: PlainVercelDeployment) {
    this.url = deployment.url

    if (deployment.meta) {
      this.metaParsed = parseDeploymentMeta(deployment.meta)
    }
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

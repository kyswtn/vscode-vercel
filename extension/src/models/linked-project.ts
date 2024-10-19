import {PlainVercelProject} from '../types'
import {LocalProject} from './local-project'
import {VercelProject} from './vercel-project'

export class LinkedProject {
  public local: LocalProject
  public remote: VercelProject

  constructor(local: LocalProject, remote: PlainVercelProject) {
    this.local = local
    this.remote = new VercelProject(remote)
  }
}

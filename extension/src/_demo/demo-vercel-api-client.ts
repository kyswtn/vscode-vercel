import path from 'pathe'
import {VercelDeploymentEnvironment} from '../constants'
import {VercelApiError} from '../utils/errors'
import {VercelApiClient} from '../vercel-api-client'
import demoData from './demo-data'

const fakeDelay = (ms = 700) =>
  new Promise<void>((resolve) => {
    setTimeout(() => resolve(), ms)
  })

export class DemoVercelApiClient extends VercelApiClient {
  override async exchangeAccessToken(_code: string): ReturnType<VercelApiClient['exchangeAccessToken']> {
    await fakeDelay()
    return demoData.accessToken
  }

  override async getUser(_accessToken: string): ReturnType<VercelApiClient['getUser']> {
    await fakeDelay()
    return demoData.user
  }

  override async listTeams(_accessToken: string): ReturnType<VercelApiClient['listTeams']> {
    await fakeDelay()
    return demoData.teams
  }

  override async listProjects(_accessToken: string, teamId?: string): ReturnType<VercelApiClient['listProjects']> {
    await fakeDelay()

    if (teamId) {
      return demoData.projects.filter((project) => project.accountId === teamId)
    }
    return demoData.projects.filter((project) => project.accountId === demoData.user.defaultTeamId)
  }

  override async getProjectByNameOrId(
    nameOrId: string,
    _accessToken: string,
    teamId?: string,
  ): ReturnType<VercelApiClient['getProjectByNameOrId']> {
    await fakeDelay()
    const project = teamId
      ? demoData.projects.find((p) => p.accountId === teamId && (p.name === nameOrId || p.id === nameOrId))
      : demoData.projects.find((p) => p.name === nameOrId || p.id === nameOrId)

    if (!project) throw new VercelApiError('404', 'not found')
    return project
  }

  override async pullProjectEnvs(
    _projectId: string,
    _target: VercelDeploymentEnvironment,
    _accessToken: string,
    _teamId?: string,
  ): ReturnType<VercelApiClient['pullProjectEnvs']> {
    await fakeDelay()
    return demoData.envs
  }

  override async listDeploymentsByProjectId(
    projectId: string,
    searchParams: URLSearchParams,
    _accessToken: string,
    _teamId?: string,
  ): ReturnType<VercelApiClient['listDeploymentsByProjectId']> {
    await fakeDelay()
    const projectName = demoData.projects.find((project) => project.id === projectId)!.name
    let deployments = demoData.deployments.filter((deployment) => deployment.name.startsWith(projectName))

    for (const [key, value] of searchParams) {
      const decodedValue = decodeURIComponent(value)
      let values = [decodedValue]
      if (decodedValue.includes(',')) {
        values = decodedValue.split(',').map((value) => value.trim())
      }

      deployments = deployments.filter((deployment) => {
        if (key in deployment) {
          const value = deployment[key as keyof typeof deployment] as string
          return value && values.includes(value)
        }

        return false
      })
    }

    return deployments
  }

  override async getDeploymentEvents(
    _deploymentId: string,
    _accessToken: string,
    _teamId?: string,
  ): ReturnType<VercelApiClient['getDeploymentEvents']> {
    await fakeDelay()
    return demoData.deploymentEvents
  }

  override async getDeploymentFileTree(
    _url: string,
    base: string,
    _accessToken: string,
    _teamId?: string,
  ): ReturnType<VercelApiClient['getDeploymentFileTree']> {
    await fakeDelay()

    if (base === 'out/_next') {
      return [
        {type: 'file', name: 'index.js', link: ''},
        {type: 'file', name: 'bundled.js', link: ''},
      ]
    }

    if (base === 'out/api') {
      return [
        {type: 'lambda', name: 'download-files', link: ''},
        {type: 'lambda', name: 'send-email', link: ''},
        {type: 'lambda', name: 'report-user', link: ''},
      ]
    }

    return demoData.deploymentFileTree
  }

  override async getDeploymentFileContent(
    _deploymentId: string,
    filePath: string,
    _accessToken: string,
    _teamId?: string,
  ): ReturnType<VercelApiClient['getDeploymentFileContent']> {
    await fakeDelay()

    const extName = path.extname(filePath).substring(1) || 'html'
    const fileContent = demoData.deploymentFileContents[extName as keyof (typeof demoData)['deploymentFileContents']]
    return Buffer.from(fileContent.trim(), extName === 'ico' ? 'base64' : 'utf-8').toString('base64')
  }

  override async getDeploymentFileContentV6(
    _deploymentId: string,
    _path: string,
    _accessToken: string,
    _teamId?: string,
  ): ReturnType<VercelApiClient['getDeploymentFileContentV6']> {
    await fakeDelay()
    return new ArrayBuffer(0)
  }

  override async listDeploymentChecks(
    _deploymentId: string,
    _accessToken: string,
    _teamId?: string,
  ): ReturnType<VercelApiClient['listDeploymentChecks']> {
    await fakeDelay()
    return demoData.deploymentChecks
  }
}

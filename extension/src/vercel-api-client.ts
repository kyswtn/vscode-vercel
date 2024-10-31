import {VercelDeploymentEnvironment} from './constants'
import {Injectable, Logger} from './lib'
import type {
  PlainVercelDeployment,
  PlainVercelDeploymentListed,
  PlainVercelProject,
  VercelDeploymentCheck,
  VercelDeploymentEvent,
  VercelFile,
  VercelTeam,
  VercelUser,
} from './types'
import {VercelApiError, parseVercelErrorFromResponse} from './utils/errors'

type FetchParams = Omit<Parameters<typeof fetch>, 'url'>
type FetchWrappedParams<T extends boolean> = FetchParams[1] & {
  path: string
  baseUrl?: string
  getArrayBuffer?: T
  searchParams?: URLSearchParams
  accessToken?: string | undefined
  teamId?: string | undefined | null
}

@Injectable()
export class VercelApiClient {
  private readonly baseUrl = 'https://api.vercel.com'
  private readonly logger = new Logger(VercelApiClient.name)

  async exchangeAccessToken(code: string) {
    const body = new URLSearchParams()
    body.append('code', code)
    body.append('client_id', process.env.CLIENT_ID)
    body.append('client_secret', process.env.CLIENT_SECRET)
    body.append('redirect_uri', process.env.REDIRECT_URI)

    const json = await this.doFetch<VercelApiClient.ExchangeAccessTokenResponse>({
      method: 'POST',
      path: '/v2/oauth/access_token',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    })

    return json.access_token
  }

  async getUser(accessToken: string) {
    const json = await this.doFetch<VercelApiClient.GetUserResponse>({
      path: '/v2/user',
      accessToken,
    })

    return json.user
  }

  async listTeams(accessToken: string) {
    const json = await this.doFetch<VercelApiClient.ListTeamsResponse>({
      path: '/v2/teams',
      accessToken,
    })

    return json.teams ?? []
  }

  async listProjects(accessToken: string, teamId?: string) {
    const json = await this.doFetch<VercelApiClient.ListProjectsResponse>({
      path: '/v4/projects',
      accessToken,
      teamId,
    })

    return json.projects ?? []
  }

  async getProjectByNameOrId(nameOrId: string, accessToken: string, teamId?: string) {
    const json = await this.doFetch<PlainVercelProject>({
      path: `/v4/projects/${decodeURIComponent(nameOrId)}`,
      accessToken,
      teamId,
    })

    return json
  }

  async pullProjectEnvs(projectId: string, target: VercelDeploymentEnvironment, accessToken: string, teamId?: string) {
    const json = await this.doFetch<VercelApiClient.PullProjectEnvsResponse>({
      path: `/v2/env/pull/${projectId}/${target}`,
      accessToken,
      teamId,
    })

    return json.env
  }

  // TODO: To request Vercel to accept multiple projectIds on the API.
  async listDeploymentsByProjectId(
    projectId: string,
    searchParams: URLSearchParams,
    accessToken: string,
    teamId?: string,
  ) {
    const json = await this.doFetch<VercelApiClient.ListDeploymentsResponse>({
      path: `/v6/deployments?projectId=${projectId}&limit=50`,
      searchParams,
      accessToken,
      teamId,
    })

    return json.deployments ?? []
  }

  async getDeploymentById(deploymentId: string, accessToken: string, teamId?: string) {
    const json = await this.doFetch<PlainVercelDeployment>({
      path: `/v13/deployments/${deploymentId}`,
      accessToken,
      teamId,
    })

    return json
  }

  async getDeploymentEvents(deploymentId: string, accessToken: string, teamId?: string) {
    const json = await this.doFetch({
      path: `/v3/deployments/${deploymentId}/events`,
      accessToken,
      teamId,
    })

    // SAFETY:
    // Escape patch out of Partial wrapper inside `doFetch` because this endpoint responds an array.
    return json as VercelDeploymentEvent[]
  }

  async getDeploymentFileTree(url: string, base: string, accessToken: string, teamId?: string) {
    const json = await this.doFetch({
      baseUrl: 'https://vercel.com',
      path: `/api/file-tree/${url}?base=${base}`,
      accessToken,
      teamId,
    })

    // SAFETY:
    // Escape patch out of Partial wrapper inside `doFetch` because this endpoint responds an array.
    return json as VercelFile[]
  }

  async getDeploymentFileContent(deploymentId: string, path: string, accessToken: string, teamId?: string) {
    const json = await this.doFetch<VercelApiClient.GetDeploymentFileContentResponse>({
      path: `/v7/deployments/${deploymentId}/files/get?path=${encodeURIComponent(path)}`,
      accessToken,
      teamId,
    })

    return json.data ?? ''
  }

  async getDeploymentFileContentV6(deploymentId: string, path: string, accessToken: string, teamId?: string) {
    const fileContent = await this.doFetch({
      getArrayBuffer: true,
      path: `/v6/deployments/${deploymentId}/files/outputs?file=${encodeURIComponent(path)}`,
      accessToken,
      teamId,
    })

    return fileContent
  }

  async listDeploymentChecks(deploymentId: string, accessToken: string, teamId?: string) {
    const json = await this.doFetch<VercelApiClient.ListDeploymentChecksResponse>({
      path: `/v1/deployments/${deploymentId}/checks`,
      accessToken,
      teamId,
    })

    return json.checks ?? []
  }

  async rollbackDeployment(deploymentId: string, projectId: string, accessToken: string, teamId?: string) {
    await this.doFetch({
      method: 'POST',
      path: `/v9/projects/${projectId}/rollback/${deploymentId}`,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: '{}',
      accessToken,
      teamId,
    })
  }

  async redeploy(
    deploymentId: string,
    deploymentName: string,
    deploymentTarget: string | undefined,
    accessToken: string,
    teamId?: string,
  ) {
    const deployment = await this.doFetch<PlainVercelDeployment>({
      method: 'POST',
      path: '/v13/deployments?forceNew=1',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        deploymentId: deploymentId,
        meta: {
          action: 'redeploy',
        },
        name: deploymentName,
        target: deploymentTarget ?? undefined,
      }),
      accessToken,
      teamId,
    })
    return deployment
  }

  async promoteByCreation(deploymentId: string, projectName: string, accessToken: string, teamId?: string) {
    await this.doFetch({
      method: 'POST',
      path: '/v13/deployments',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        deploymentId: deploymentId,
        name: projectName,
        target: 'production',
        meta: {
          action: 'promote',
        },
      }),
      accessToken,
      teamId,
    })
  }

  async promote(deploymentId: string, projectId: string, accessToken: string, teamId?: string) {
    await this.doFetch({
      method: 'POST',
      path: `/v10/projects/${projectId}/promote/${deploymentId}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: '{}',
      accessToken,
      teamId,
    })
  }

  private async doFetch<T, K extends boolean = false>(
    params: FetchWrappedParams<K>,
  ): Promise<K extends true ? ArrayBuffer : T> {
    const {path: urlPath, baseUrl, getArrayBuffer, searchParams, accessToken, teamId, ...options} = params

    const url = new URL(urlPath, baseUrl ?? this.baseUrl)
    if (teamId) url.searchParams.append('teamId', teamId)

    if (accessToken) {
      options.headers = {
        ...(options.headers ?? {}),
        Authorization: `Bearer ${accessToken}`,
      }
    }

    if (searchParams && searchParams.size > 0) {
      for (const [key, value] of searchParams) {
        url.searchParams.append(key, value)
      }
    }

    if (process.env.NODE_ENV === 'development') {
      const method = params.method ?? 'GET'
      this.logger.trace(`Making a "${method}" request to "${url}".`)
    }

    try {
      const response = await fetch(url, options)

      if (!response.ok) {
        const error = await parseVercelErrorFromResponse(response)
        throw error
          ? new VercelApiError(error.code, error.message, response.status)
          : new Error(`Request failed with status code ${response.status} ${response.statusText}.`)
      }

      if (getArrayBuffer) {
        const bodyText = await response.arrayBuffer()
        // @ts-ignore
        return bodyText
      }

      let json: unknown = null
      try {
        json = await response.json()
      } catch (error) {
        throw new Error('Request responded with invalid JSON.')
      }

      // We can do this because we always expect a JSON object response from the API.
      const typeOfJSON = typeof json
      if (typeOfJSON !== 'object' || json === null) {
        throw new Error(`Request responded with "${json === null ? 'null' : typeOfJSON}" instead of "object".`)
      }

      // @ts-ignore
      return json as T
    } catch (_error) {
      let error = _error

      if (error instanceof Error) {
        this.logger.error(error.message)
      } else {
        this.logger.error(`Unknown error ${error}`)
        error = new Error('Request failed with an unknown error.')
      }

      if ((error as Error).message === 'fetch failed') {
        this.logger.error('Extension seems to be offline.')
        error = new Error('Request could not be made.')
      }

      throw error
    }
  }
}

declare namespace VercelApiClient {
  type ExchangeAccessTokenResponse = {
    access_token: string
  }

  type GetUserResponse = {
    user: VercelUser
  }

  type ListTeamsResponse = {
    teams: VercelTeam[]
  }

  type ListProjectsResponse = {
    projects: PlainVercelProject[]
  }

  type ListDeploymentsResponse = {
    deployments: PlainVercelDeploymentListed[]
  }

  type PullProjectEnvsResponse = {
    env: Record<string, string>
  }

  type GetDeploymentFileContentResponse = {
    data: string
  }

  type ListDeploymentChecksResponse = {
    checks: VercelDeploymentCheck[]
  }
}

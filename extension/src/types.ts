import * as vscode from 'vscode'
import {VercelDeploymentState} from './constants'

// TODO: Remove constant enums (which are values) from this file.

export type CustomIcon = `custom-icons-${keyof typeof import('./custom-icons.json')}`

export type AuthJson = {
  token: string
}

export type ProjectJson = {
  projectId: string
  orgId: string
}

// #region VSCode related types.

export interface CustomAuthenticationSession extends vscode.AuthenticationSession {
  teamId?: string
}

// #endregion

// #region Git related types.

export type GitProviders = 'github' | 'gitlab' | 'bitbucket'

export type GitRepo = {
  org: string
  repo: string
  url: string
}

export type GitBranch = {
  name: string
  url: string | undefined
}

export type GitCommit = {
  sha: string
  message: string
  authorName: string
  url: string | undefined
}

// #endregion

// #region Vercel related types.

// 1. As the data these types represent are external, all non-optional, non-partial types must be
//    validated before use.
// 2. Don't type unless used. Type only enough to be used.
// 3. All violations of rules above must come with a SAFETY note.

export type RedirectUriResponseQuery = {
  code: string
  state: string
  team_id?: string | undefined
}

export type PlainVercelError = {
  code: string
  message: string
}

export type VercelUser = {
  id: string
  username: string

  // SAFETY: Vercel API documentation confirms this enum.
  version?: 'northstar'
  defaultTeamId?: string
}

// As returned from v2/teams/:id.
export type VercelTeam = {
  // SAFETY: Vercel API documentation confirms these aren't optional.
  id: string
  name: string
}

// As returned from v4/projects/:id.
export type PlainVercelProject = {
  id: string
  name: string
  createdAt: number
  accountId: string

  updatedAt?: number
  link?: Partial<VercelProjectLink>
  alias?: Array<{
    deployment?: unknown
    domain?: string
  }>
  latestDeployments?: Array<Partial<PlainVercelDeployment>>
}

type VercelProjectLink = (
  | {
      type: 'github'
      org: string
      repo: string
    }
  | {
      type: 'gitlab'
      projectId: string
      projectName: string
      projectNamespace: string
      projectNameWithNamespace: string
      projectUrl: string
    }
  | {
      type: 'bitbucket'
      name: string
      slug: string
      owner: string
      uuid: string
      workspaceUuid: string
    }
) & {
  createdAt: number
  updatedAt?: number
  sourceless: boolean
  productionBranch: string
}

// SAFETY: Vercel API documentation confirms these enums are exhausted.

type VercelV6DeploymentSource = 'api-trigger-git-deploy' | 'cli' | 'clone/repo' | 'git' | 'import' | 'import/repo'
type VercelV6DeploymentTarget = 'production' | null

// As returned from v6/deployments?projectId.
export type PlainVercelDeployment = {
  uid: string
  name: string
  createdAt: number

  url?: string
  state?: VercelDeploymentState
  source?: VercelV6DeploymentSource
  meta?: Partial<VercelDeploymentMeta>
  ready?: number
  target?: VercelV6DeploymentTarget
  bootedAt?: number
}

type VercelDeploymentMeta =
  | {
      githubDeployment: '1'

      // user
      githubCommitAuthorLogin: string // username
      githubCommitAuthorName: string // display name

      // repo
      githubOrg: string
      githubRepo: string
      githubRepoId: string

      // branch
      githubCommitRef: string
      branchAlias: string

      // commit
      githubCommitOrg: string
      githubCommitRepo: string
      githubCommitRepoId: string
      githubCommitSha: string
      githubCommitMessage: string
    }
  | {
      gitlabDeployment: '1'

      // user
      gitlabCommitAuthorLogin: string
      gitlabCommitAuthorName: string
      gitlabCommitRawAuthorEmail: string
      gitlabCommitAuthorAvatar: string

      // project
      gitlabProjectId: string
      gitlabProjectName: string
      gitlabProjectNamespace: string
      gitlabProjectNamespaceKind: string
      gitlabProjectVisibility: string
      gitlabProjectRepo: string
      gitlabProjectPath: string

      // branch
      gitlabCommitRef: string
      branchAlias: string

      // commit
      gitlabCommitMessage: string
      gitlabCommitSha: string
    }
  | {
      bitbucketDeployment: '1'

      // TODO: Add Bitbucket deployment meta interface.
    }

// SAFETY: Vercel API documentation confirms these enums are exhausted.
type VercelDeploymentEventType =
  | 'command'
  | 'stdout'
  | 'stderr'
  | 'exit'
  | 'deployment-state'
  | 'delimiter'
  | 'middleware'
  | 'middleware-invocation'
  | 'edge-function-invocation'
  | 'fatal'

export type VercelDeploymentEvent = {
  type: VercelDeploymentEventType
  created: number
  text?: string
}

export type VercelFile =
  | {
      type: 'directory'
      name: string
    }
  | {
      type: 'file' | 'lambda'
      name: string
      link: string
    }

export type VercelCheckStatus = 'registered' | 'running' | 'completed'
export type VercelCheckConclusion = 'canceled' | 'failed' | 'neutral' | 'skipped' | 'succeeded' | 'stale'

export type VercelCheck = {
  id: string
  integrationId: string
  name: string
  createdAt: number
  updatedAt: number
  status: VercelCheckStatus
  conclusion?: VercelCheckConclusion
}

// #endregion

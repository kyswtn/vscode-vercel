import {noCommitMessage} from '../constants'
import type {GitBranch, GitCommit, GitProviders, GitRepo, PlainVercelDeployment} from '../types'

export function vercelUsernameToMarkdownLink(username: string) {
  return `[@${username}](https://vercel.com/${username})`
}

export function parseDeploymentMeta(meta: PlainVercelDeployment['meta']) {
  if (!meta) return

  let provider: GitProviders | undefined
  let repo: GitRepo | undefined
  let branch: GitBranch | undefined
  let commit: GitCommit | undefined

  if ('githubDeployment' in meta) {
    provider = 'github'

    if (meta.githubOrg && meta.githubRepo) {
      repo = {
        org: meta.githubOrg,
        repo: meta.githubRepo,
        url: `https://github.com/${meta.githubOrg}/${meta.githubRepo}`,
      }
    }

    if (meta.githubCommitRef) {
      branch = {
        name: meta.githubCommitRef,
        url: repo && `${repo.url}/tree/${meta.githubCommitRef}`,
      }
    }

    if (meta.githubCommitSha) {
      commit = {
        sha: meta.githubCommitSha,
        message: meta.githubCommitMessage ?? noCommitMessage,
        authorName: meta.githubCommitAuthorName ?? 'Unknown',
        url: repo && `${repo.url}/commit/${meta.githubCommitSha}`,
      }
    }
  }

  if ('gitlabDeployment' in meta) {
    provider = 'gitlab'

    if (meta.gitlabProjectNamespace && meta.gitlabProjectRepo) {
      repo = {
        org: meta.gitlabProjectNamespace,
        repo: meta.gitlabProjectRepo,
        url: `https://gitlab.com/${meta.gitlabProjectPath}`,
      }
    }

    if (meta.gitlabCommitRef) {
      branch = {
        name: meta.gitlabCommitRef,
        url: repo && `${repo.url}/-/tree/${meta.gitlabCommitRef}`,
      }
    }

    if (meta.gitlabCommitSha) {
      commit = {
        sha: meta.gitlabCommitSha,
        message: meta.gitlabCommitMessage ?? noCommitMessage,
        authorName: meta.gitlabCommitAuthorName ?? 'Unknown',
        url: repo && `${repo.url}/-/commit/${meta.gitlabCommitSha}`,
      }
    }
  }

  if ('bitbucketDeployment' in meta) {
    provider = 'bitbucket'

    // TODO: Handle BitBucket deployments.
  }

  return {
    provider,
    repo,
    branch,
    commit,
  }
}

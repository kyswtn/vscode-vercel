import path from 'pathe'
import * as vscode from 'vscode'
import {noCommitMessage} from '../constants'
import {Logger} from '../lib'
import type {GitBranch, GitCommit, GitProviders, GitRepo, PlainVercelDeployment} from '../types'
import {AuthJson, type ProjectJson} from '../types'
import {makeNaiveObjectValidator} from './naive-object-validator'
import {homedir, platform} from './node'

export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function uniqueBy<T extends object>(array: T[], key: keyof T) {
  return array.reduce<T[]>((left, right) => {
    if (!left.find((l) => l[key] === right[key])) {
      left.push(right)
    }
    return left
  }, [])
}

export function truncateWithEllipsis(str: string, maxLength?: number) {
  if (maxLength === undefined || str.length < maxLength) return str
  return `${str.substring(0, maxLength)}...`
}

export function withMarkdownUrl(contentToWrap: string, url?: string | undefined) {
  return url !== undefined ? `[${contentToWrap}](${url})` : contentToWrap
}

export function diffArrays<T>(left: T[], right: T[], compareFn = (l: T, r: T) => l === r) {
  const added = right.filter((n) => !left.some((o) => compareFn(n, o)))
  const removed = left.filter((o) => !right.some((n) => compareFn(o, n)))

  // If both arrays are empty, return `undefined`.
  return added.length + removed.length > 0 ? {added, removed} : undefined
}

/**
 * Settle all promises and return a tuple of awaited results and errors. Errors are guaranteed to be
 * of type `Error`. `null` or `undefined` values will be discarded.
 */
export async function settleAllPromises<T>(
  promises: Iterable<T | PromiseLike<T>>,
): Promise<[Array<NonNullable<Awaited<T>>>, Error[]]> {
  const results = await Promise.allSettled(promises)

  const values = []
  const reasons = []

  for (const result of results) {
    if (result.status === 'fulfilled' && result.status !== undefined && result.status !== null) {
      values.push(result.value as NonNullable<Awaited<T>>)
    } else {
      if (result.reason instanceof Error) {
        reasons.push(result.reason)
      } else {
        reasons.push(new Error(`Unknown error ${result.reason}.`))
      }
    }
  }

  return [values, reasons]
}

export function formatTimestamp(timestamp: number) {
  const date = new Date(timestamp)
  const time = date.toLocaleTimeString('en-US', {hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'})
  const milliseconds = date.getMilliseconds().toString().padStart(3, '0')

  return `${time}.${milliseconds}`
}

export function recordToDotenv(record: Record<string, string>) {
  return Object.entries(record)
    .map(([key, value]) => `${key}="${value}"`)
    .join('\n')
}

/**
 * Removes trailing slashes from paths. Always make sure to normalize a URI path when using
 * 1. `vscode.Uri.parse` to turn a path into a URI,
 * 2. `uri.with({ path: * })` to clone a new URI with path modifications, and
 * 3. URI values provided by VSCode API.
 */
export function normalizePath(uriPath: string) {
  return path.normalize(uriPath).replace(/\/+$/, '')
}

/**
 * Hashes the string into a hexadecimal string naively.
 */
export function naiveHash(input: string) {
  let hash = 0
  for (let i = 0, len = input.length; i < len; i++) {
    const chr = input.charCodeAt(i)
    hash = (hash << 5) - hash + chr
    hash >>>= 0 // Convert to unsigned 32bit integer
  }
  return hash.toString(16)
}

export function getDataDir(_productName: string): string {
  let dataPath: string | undefined
  let productName = _productName

  const p = platform()
  switch (p) {
    case 'darwin':
      dataPath = path.join(homedir(), 'Library', 'Application Support')
      break
    case 'linux':
      dataPath = process.env['XDG_CONFIG_HOME'] || path.join(homedir(), '.config')
      break
    case 'win32': {
      dataPath = process.env['APPDATA'] || path.join(homedir(), 'AppData', 'Roaming')
      productName = path.join(productName, 'Data') // Thanks Stefan.
      break
    }
    default:
      throw new Error('Platform not supported')
  }

  return path.join(dataPath, productName)
}

/**
 * Naively checks if a path string matches the glob pattern. Only works on ** patterns.
 * VSCode should really have an API for this because they implement their own glob library.
 */
export function naiveGlobMatch(p: string, glob: string) {
  const regex = new RegExp(glob.replaceAll('**', '.*'), 'g')
  return regex.test(p)
}

export function vercelUsernameMarkdownLink(username: string) {
  return `[@${username}](https://vercel.com/${username})`
}

export function vercelProjectMarkdownLink(teamId: string, projectName: string) {
  return `[${projectName}](${`https://vercel.com/${teamId}/${projectName}`})`
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

/**
 * Reads a json file and return serialized JSON, or undefined if JSON is invalid.
 */
export async function readJsonFile(file: vscode.Uri): Promise<unknown | undefined> {
  const json = await vscode.workspace.fs
    .readFile(file)
    .then((buffer) => Buffer.from(buffer).toString('utf-8'))
    .then((string) => {
      try {
        return JSON.parse(string)
      } catch (_) {
        return
      }
    })
  return json
}

export async function writeFile(file: vscode.Uri, content: string | Buffer): Promise<void> {
  const buffer = content instanceof Buffer ? content : Buffer.from(content, 'utf-8')
  await vscode.workspace.fs.writeFile(file, buffer)
}

export async function fileExists(file: vscode.Uri): Promise<boolean> {
  try {
    await vscode.workspace.fs.stat(file)
    return true
  } catch (_) {
    return false
  }
}

// The entire alphabet should be Vercel's ID safe. The first 36 digits are URI authority safe.
const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_'
const base = BigInt(alphabet.length)

/**
 * Encode Vercel's ID string to be URI authority safe.
 *
 * Vercel's `deploymentId`, `projectId` and `teamId` can contain `/[a-Z]/` and is case-sensitive.
 * If we want to put it in the URI's authority portion, we need to make it case-insensitive. Even
 * though VSCode does allow you to force paths and queries to be case-sensitive but there's no such
 * control over the authority.
 */
export function encodeId(id: string, reverse = false) {
  let [from, to] = [base, 36n]
  if (reverse) [from, to] = [to, from]

  // Convert to BigInt decimal.
  let decimal = id.split('').reduce((l, r) => l * from + BigInt(alphabet.indexOf(r)), 0n)

  let result = ''
  while (decimal > 0) {
    result = alphabet[Number(decimal % to)] + result
    decimal = decimal / to
  }

  return result
}

export function decodeId(id: string) {
  return encodeId(id, /* reverse */ true)
}

function makeLoggingValidator<T>(...options: Parameters<typeof makeNaiveObjectValidator>) {
  const logger = new Logger(`${options[0]}Validation`)
  const validate = makeNaiveObjectValidator<T>(...options)

  return (object: unknown): object is T => {
    const errors = validate(object)
    for (const error of errors) {
      logger.error(error.message)
    }
    return errors.length === 0
  }
}

export const isValidAuthJson = makeLoggingValidator<AuthJson>('AuthJson', {
  token: 'string',
})

export const isValidProjectJson = makeLoggingValidator<ProjectJson>('ProjectJson', {
  orgId: 'string',
  projectId: 'string',
})

/**
 * If a file path is not within any directory (except root) and has a `.log` extension, then it's
 * a log file.
 */
export function isLogFilePath(filePath: string) {
  return ['.', '/'].includes(path.dirname(filePath)) && path.extname(filePath) === '.log'
}

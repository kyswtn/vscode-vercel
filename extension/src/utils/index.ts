import path from 'pathe'
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

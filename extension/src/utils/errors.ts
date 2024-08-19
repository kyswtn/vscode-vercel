import * as vscode from 'vscode'
import {Logger} from '../lib'
import {PlainVercelError} from '../types'

const logger = new Logger('UnknownError')
export async function logAndShowErrorMessage(error: unknown, action?: string) {
  let message: string
  if (error instanceof Error) {
    message = error.message
  } else {
    logger.error(String(error))
    message = `An unknown error occourred${action ? ` while trying to ${action}` : ''}.`
  }
  await vscode.window.showErrorMessage(message)
}

export class VercelApiError extends Error {
  constructor(
    readonly code: string,
    override readonly message: string,
  ) {
    super()
  }
}

export async function parseVercelErrorFromResponse(response: Response): Promise<PlainVercelError | undefined> {
  let json: unknown
  try {
    json = await response.json()
  } catch (_) {}

  const error = isRecord(json) ? json['error'] ?? json['err'] : undefined

  // There's no `validateVercelError` just like there are for `validateVercelProject` because there's
  // no need to validate the types of individual values of error.
  if (isRecord(error) && 'code' in error && 'message' in error) {
    // SAFETY: The condition above confirms the safety of this.
    return error as PlainVercelError
  }

  return
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

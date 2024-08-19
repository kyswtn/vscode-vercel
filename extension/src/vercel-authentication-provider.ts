import path from 'pathe'
import * as vscode from 'vscode'
import {AuthenticationMethod} from './constants'
import {CustomUriHandler} from './custom-uri-handler'
import {Injectable, SecretStorage} from './lib'
import {showAuthenticationQuickPick} from './quickpicks/show-authentication-quickpick'
import {CustomAuthenticationSession, RedirectUriResponseQuery} from './types'
import {getDataDir} from './utils'
import {crypto} from './utils/node'
import {isValidAuthJson} from './utils/validation'
import {fileExists, readJsonFile} from './utils/vscode'
import {VercelApiClient} from './vercel-api-client'

type AuthenticationResult = {
  accessToken: string
  teamId?: string
}

interface CustomAuthenticationSessionChangeEvent {
  readonly added: readonly CustomAuthenticationSession[] | undefined
  readonly removed: readonly CustomAuthenticationSession[] | undefined
  readonly changed: readonly CustomAuthenticationSession[] | undefined
}

@Injectable()
export class VercelAuthenticationProvider implements vscode.AuthenticationProvider, vscode.Disposable {
  public readonly providerId = 'vercel'
  public readonly providerLabel = 'Vercel'

  private readonly secretSessionKey = 'vercel-auth-session'
  private readonly onAuthenticatedEventEmitter = new vscode.EventEmitter<RedirectUriResponseQuery>()
  private readonly onDidChangeSessionsEventEmitter = new vscode.EventEmitter<CustomAuthenticationSessionChangeEvent>()

  private currentSession: Promise<CustomAuthenticationSession | undefined> | undefined
  private disposables: vscode.Disposable[] = []

  private readonly authenticationMethods: Record<AuthenticationMethod, () => Promise<AuthenticationResult>> = {
    [AuthenticationMethod.OAuth]: this.authenticateViaOAuth,
    [AuthenticationMethod.EnterAccessToken]: this.authenticateViaPrompt,
    [AuthenticationMethod.StoredAccessToken]: this.authenticateViaSavedToken,
  }

  constructor(
    customUriHandler: CustomUriHandler,
    private readonly secretStorage: SecretStorage,
    private readonly vercelApi: VercelApiClient,
  ) {
    this.disposables.push(
      // Register the custom authentication provider.
      vscode.authentication.registerAuthenticationProvider(this.providerId, this.providerLabel, this, {
        supportsMultipleAccounts: false,
      }),
      // Handle /authenticate uri incoming.
      customUriHandler.onUri(({path, query}) => {
        if (path !== '/authenticate') return

        const {code, state, team_id} = query as Partial<RedirectUriResponseQuery>
        if (!code || !state) {
          const name = code ? 'state' : 'code'
          throw new Error(`Required property \`${name}\` is missing from the query.`)
        }

        this.onAuthenticatedEventEmitter.fire({code, state, team_id})
      }),
      // Detect when the session was updated in _any window_ since secrets are shared across all open windows.
      this.secretStorage.onDidChange((event) => {
        if (event.key === this.secretSessionKey) {
          void this.checkForUpdates()
        }
      }),
      // Detect when the user login/logout via the Accounts menu.
      vscode.authentication.onDidChangeSessions((event) => {
        if (event.provider.id === this.providerId) {
          void this.checkForUpdates()
        }
      }),
    )
  }

  dispose() {
    this.onAuthenticatedEventEmitter.dispose()
    this.onDidChangeSessionsEventEmitter.dispose()
    vscode.Disposable.from(...this.disposables).dispose()
  }

  async getSessions() {
    const session = await this.cacheSessionFromStorage()
    return session ? [session] : []
  }

  async createSession() {
    const method = await showAuthenticationQuickPick()
    if (method === undefined) {
      throw new Error('Authentication was cancelled.')
    }

    const session = await this.authenticate(method)
    await this.secretStorage.storeJSON(this.secretSessionKey, session)
    return session
  }

  async removeSession() {
    await this.secretStorage.delete(this.secretSessionKey)
  }

  get onDidChangeSessions() {
    return this.onDidChangeSessionsEventEmitter.event
  }

  private cacheSessionFromStorage() {
    this.currentSession = this.secretStorage.getJSON<CustomAuthenticationSession>(this.secretSessionKey)
    return this.currentSession
  }

  private async checkForUpdates() {
    const prev = await this.currentSession
    const now = (await this.getSessions())[0]

    const added: CustomAuthenticationSession[] = []
    const removed: CustomAuthenticationSession[] = []
    const changed: CustomAuthenticationSession[] = []

    if (!prev && now) {
      added.push(now)
    } else if (prev && !now) {
      removed.push(prev)
    } else if (prev && now && prev.id !== now.id) {
      // We push the changed item, the values have been changed.
      changed.push(now)
    } else {
      return
    }

    this.onDidChangeSessionsEventEmitter.fire({added, removed, changed})
  }

  private async authenticate(method: AuthenticationMethod) {
    const {accessToken, teamId} = await this.authenticationMethods[method].call(this)

    const user = await this.vercelApi.getUser(accessToken)
    if (!user || !user.id || !user.username) {
      throw new Error('Unable to get a valid user from access token')
    }

    // Users signed in with OAuth have no teams endpoint privilege.
    const scopes = []
    // Users signed in using Vercel CLI token will have teams endpoint provilege.
    if (method === AuthenticationMethod.StoredAccessToken) {
      scopes.push('teams')
    } else if (method === AuthenticationMethod.EnterAccessToken) {
      // Users authenticated with an access token with "Full Account" can have teams endpoint privilege.
      try {
        await this.vercelApi.listTeams(accessToken)
        scopes.push('teams')
      } catch (_) {}
    }

    return {
      id: crypto.randomUUID(),
      accessToken,
      teamId,
      account: {
        id: user.id,
        label: user.username,
      },
      scopes,
    }
  }

  private async authenticateViaOAuth() {
    const state = crypto.randomUUID()
    const loginUrl = `https://vercel.com/integrations/${process.env.INTEGRATION_ID}/new?state=${state}`
    await vscode.env.openExternal(vscode.Uri.parse(loginUrl))

    const waitForRedirect = new Promise<RedirectUriResponseQuery>((resolve, reject) => {
      this.disposables.push(
        this.onAuthenticatedEventEmitter.event((value) => {
          resolve(value)
        }),
      )

      setTimeout(() => {
        reject(new Error('Cancelling Vercel OAuth login after 60s. Try again.'))
      }, 60 * 1000)
    })

    const result = await vscode.window.withProgress(
      {
        title: 'Waiting for OAuth redirect from Vercel.',
        location: vscode.ProgressLocation.Notification,
      },
      () =>
        waitForRedirect.then(async (query) => {
          // Validate state matches.
          if (query.state !== state) {
            throw new Error("State returned from authentication response doesn't match.")
          }

          // Exchange code to get token.
          const accessToken = await this.vercelApi.exchangeAccessToken(query.code)
          if (!accessToken) {
            throw new Error('Missing `access_token` from authentication response.')
          }

          const result: AuthenticationResult = {accessToken}
          if (query.team_id) result.teamId = query.team_id

          return result
        }),
    )

    return result
  }

  private async authenticateViaPrompt() {
    const accessToken = await vscode.window
      .showInputBox({
        title: 'Add access token',
        password: true,
      })
      .then((input) => {
        if (input === undefined) {
          throw new Error('Authentication was cancelled.')
        }

        return input
      })

    return {accessToken}
  }

  private async authenticateViaSavedToken() {
    const dataDir = getDataDir('com.vercel.cli')
    const authJsonFileUri = vscode.Uri.parse(path.join(dataDir, 'auth.json'))

    const authJsonFileExists = await fileExists(authJsonFileUri)
    if (!authJsonFileExists) {
      throw new Error('No saved `auth.json` file was found.')
    }

    const authJson = await readJsonFile(authJsonFileUri)
    if (!isValidAuthJson(authJson)) {
      throw new Error('Could not find a valid access token in `auth.json`.')
    }

    // TODO: Should I read `config.json` and get `currentTeamId`?

    return {accessToken: authJson.token}
  }
}

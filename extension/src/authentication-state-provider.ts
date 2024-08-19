import * as vscode from 'vscode'
import {ContextId} from './constants'
import {ContextKeys, Injectable} from './lib'
import {CustomAuthenticationSession} from './types'
import {VercelAuthenticationProvider} from './vercel-authentication-provider'

@Injectable()
export class AuthenticationStateProvider implements vscode.Disposable {
  private _currentSession: CustomAuthenticationSession | undefined
  private readonly onDidChangeCurrentSessionEventEmitter = new vscode.EventEmitter<typeof this._currentSession>()
  private readonly disposable: vscode.Disposable

  constructor(
    private readonly contextKeys: ContextKeys,
    private readonly vercelAuth: VercelAuthenticationProvider,
  ) {
    this.disposable = vscode.Disposable.from(
      this.vercelAuth.onDidChangeSessions((event) => {
        const session = event.changed?.[0] ?? event.added?.[0] ?? undefined
        this.onDidChangeCurrentSessionEventEmitter.fire((this._currentSession = session))
      }),
      this.onDidChangeCurrentSession((session) => {
        void this.contextKeys.set(ContextId.IsAuthenticated, session !== undefined, 'globalState')
      }),
    )
  }

  dispose() {
    this.onDidChangeCurrentSessionEventEmitter.dispose()
    this.disposable.dispose()
  }

  async loadSessionOnBootstrap() {
    const session = await vscode.authentication.getSession(this.vercelAuth.providerId, [], {silent: true})

    // SAFETY:
    // This is safe as vscode can actually returns custom session values.
    this._currentSession = session as unknown as CustomAuthenticationSession

    // Do not emit an event to prevent an extra render. Only set the context key.
    void this.contextKeys.set(ContextId.IsAuthenticated, session !== undefined, 'globalState')
  }

  get currentSession() {
    return this._currentSession
  }

  get onDidChangeCurrentSession() {
    return this.onDidChangeCurrentSessionEventEmitter.event
  }

  async signIn() {
    const session = await vscode.authentication.getSession(this.vercelAuth.providerId, [], {
      clearSessionPreference: true,
      createIfNone: true,
    })

    // SAFETY:
    // This is safe as vscode can actually returns custom session values.
    return session as unknown as CustomAuthenticationSession
  }

  async signOut() {
    await this.vercelAuth.removeSession()
  }
}

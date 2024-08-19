import * as vscode from 'vscode'
import {AuthenticationStateProvider} from './authentication-state-provider'
import {CommandId} from './constants'
import {Injectable} from './lib'
import {SignOutCommand} from './sign-out-command'
import {logAndShowErrorMessage} from './utils/errors'
import {vercelUsernameToMarkdownLink} from './utils/vercel'

@Injectable()
export class SignInCommand implements vscode.Disposable {
  private checkCount = 0
  private readonly disposable: vscode.Disposable

  constructor(
    private readonly auth: AuthenticationStateProvider,
    private readonly signOutCommand: SignOutCommand,
  ) {
    this.disposable = vscode.commands.registerCommand(CommandId.SignIn, this.run, this)
  }

  dispose() {
    this.disposable.dispose()
  }

  async run() {
    const currentSession = this.auth.currentSession
    if (currentSession) {
      await this.showSignOutSuggestion(currentSession)
      return
    }

    try {
      const session = await this.auth.signIn()
      const username = vercelUsernameToMarkdownLink(session.account.label)
      await vscode.window.showInformationMessage(`Vercel account ${username} has been added.`)
    } catch (error) {
      logAndShowErrorMessage(error, 'sign in')
    }
  }

  private async showSignOutSuggestion(currentSession: vscode.AuthenticationSession) {
    const username = vercelUsernameToMarkdownLink(currentSession.account.label)

    if (this.checkCount < 3) {
      await vscode.window.showInformationMessage(`You are already signed in as ${username}.`)
    } else {
      const signOut = await vscode.window.showInformationMessage(
        `You are signed in as ${username}. Do you want to sign out first?`,
        'Sign Out',
      )
      if (signOut) {
        await this.signOutCommand.run()
        this.checkCount = 0
      }
    }

    this.checkCount++
  }
}

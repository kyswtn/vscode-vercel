import * as vscode from 'vscode'
import {CommandId} from '../constants'
import {Injectable} from '../lib'
import {AuthenticationStateProvider} from '../state/authentication-state-provider'
import {vercelUsernameMarkdownLink} from '../utils'
import {logAndShowErrorMessage} from '../utils/errors'

@Injectable()
export class SignInCommand implements vscode.Disposable {
  private checkCount = 0
  private readonly disposable: vscode.Disposable

  constructor(private readonly authState: AuthenticationStateProvider) {
    this.disposable = vscode.commands.registerCommand(CommandId.SignIn, this.run, this)
  }

  dispose() {
    this.disposable.dispose()
  }

  async run() {
    const currentSession = this.authState.currentSession
    if (currentSession) {
      await this.showSignOutSuggestion(currentSession)
      return
    }

    try {
      const session = await this.authState.signIn()
      const username = vercelUsernameMarkdownLink(session.account.label)
      await vscode.window.showInformationMessage(`Vercel account ${username} has been added.`)
    } catch (error) {
      logAndShowErrorMessage(error, 'sign in')
    }
  }

  private async showSignOutSuggestion(currentSession: vscode.AuthenticationSession) {
    const username = vercelUsernameMarkdownLink(currentSession.account.label)

    if (this.checkCount < 3) {
      await vscode.window.showInformationMessage(`You are already signed in as ${username}.`)
    } else {
      const signOut = await vscode.window.showInformationMessage(
        `You are signed in as ${username}. Do you want to sign out first?`,
        'Sign Out',
      )
      if (signOut) {
        await vscode.commands.executeCommand(CommandId.SignOut)
        this.checkCount = 0
      }
    }

    this.checkCount++
  }
}

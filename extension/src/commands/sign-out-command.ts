import * as vscode from 'vscode'
import {CommandId} from '../constants'
import {Injectable} from '../lib'
import {AuthenticationStateProvider} from '../state/authentication-state-provider'
import {logAndShowErrorMessage} from '../utils/errors'

@Injectable()
export class SignOutCommand implements vscode.Disposable {
  private readonly disposable: vscode.Disposable

  constructor(private readonly auth: AuthenticationStateProvider) {
    this.disposable = vscode.commands.registerCommand(CommandId.SignOut, this.run, this)
  }

  async run() {
    if (!this.auth.currentSession) {
      await vscode.window.showErrorMessage("You're not signed in yet.")
      return
    }

    try {
      await this.auth.signOut()
      await vscode.window.showInformationMessage('Successfully signed out.')
    } catch (error) {
      logAndShowErrorMessage(error, 'sign out')
    }
  }

  dispose() {
    this.disposable.dispose()
  }
}

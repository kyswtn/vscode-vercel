import * as vscode from 'vscode'
import {CommandId} from '../constants'
import {Injectable} from '../lib'
import {LinkFolderToProjectCommand} from './link-folder-to-project-command'

@Injectable()
export class LinkWorkspaceToProjectCommand implements vscode.Disposable {
  private readonly disposable: vscode.Disposable

  constructor(private readonly linkFolderToProjectCommand: LinkFolderToProjectCommand) {
    this.disposable = vscode.commands.registerCommand(CommandId.LinkWorkspaceToProject, this.run, this)
  }

  dispose() {
    this.disposable.dispose()
  }

  async run() {
    const workspaceFolders = vscode.workspace.workspaceFolders ?? []
    if (workspaceFolders.length < 1) {
      await vscode.window.showErrorMessage('No opened folder was found to link.')
      return
    }

    let workspaceFolderUri: vscode.Uri
    if (workspaceFolders.length > 1) {
      const selected = await vscode.window.showWorkspaceFolderPick()
      if (!selected) return

      workspaceFolderUri = selected.uri
    } else {
      // SAFETY:
      // `workspaceFolders[0]` cannot be undefined here.
      workspaceFolderUri = workspaceFolders[0]!.uri
    }

    await this.linkFolderToProjectCommand.run(workspaceFolderUri)
  }
}

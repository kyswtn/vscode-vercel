import * as vscode from 'vscode'
import {CommandId, ContextId} from './constants'
import {ContextKeys, Injectable} from './lib'
import {LinkedProjectsStateProvider} from './linked-projects-state-provider'
import {showVercelProjectQuickPick} from './quickpicks/show-vercel-project-quickpick'

@Injectable()
export class SwitchFocusedProjectCommand implements vscode.Disposable {
  private readonly disposable: vscode.Disposable

  constructor(
    private readonly contextKeys: ContextKeys,
    private readonly linkedProjectsState: LinkedProjectsStateProvider,
  ) {
    this.disposable = vscode.commands.registerCommand(CommandId.SwitchFocusedProject, this.run, this)
  }

  dispose() {
    this.disposable.dispose()
  }

  async run() {
    const remoteProjects = this.linkedProjectsState.remoteProjects
    const selectedProject = await showVercelProjectQuickPick(remoteProjects)
    if (selectedProject === undefined) return

    await this.contextKeys.set(ContextId.FocusedProjectId, selectedProject.id, 'workspaceState')
  }
}

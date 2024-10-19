import * as vscode from 'vscode'
import {CommandId, ContextId} from '../constants'
import {ContextKeys, Injectable} from '../lib'
import {showVercelProjectQuickPick} from '../quickpicks/show-vercel-project-quickpick'
import {ProjectsStateProvider} from '../state/projects-state-provider'

@Injectable()
export class SwitchFocusedProjectCommand implements vscode.Disposable {
  private readonly disposable: vscode.Disposable

  constructor(
    private readonly contextKeys: ContextKeys,
    private readonly projectsState: ProjectsStateProvider,
  ) {
    this.disposable = vscode.commands.registerCommand(CommandId.SwitchFocusedProject, this.run, this)
  }

  dispose() {
    this.disposable.dispose()
  }

  async run() {
    const remoteProjects = this.projectsState.projects
    const selectedProject = await showVercelProjectQuickPick(remoteProjects)
    if (selectedProject === undefined) return

    await this.contextKeys.set(ContextId.FocusedProjectId, selectedProject.id, 'workspaceState')
  }
}

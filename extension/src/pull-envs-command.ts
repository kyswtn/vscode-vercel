import path from 'pathe'
import * as vscode from 'vscode'
import {AuthenticationStateProvider} from './authentication-state-provider'
import {CommandId, VercelDeploymentEnvironment, envFileName} from './constants'
import {Injectable} from './lib'
import {LinkedProject, LinkedProjectsStateProvider} from './linked-projects-state-provider'
import {showEnvironmentQuickPick} from './quickpicks/show-environment-quickpick'
import {showLinkedProjectQuickPick} from './quickpicks/show-linked-project-quickpick'
import {recordToDotenv} from './utils'
import {fileExists, writeFile} from './utils/vscode'
import {VercelApiClient} from './vercel-api-client'

@Injectable()
export class PullEnvsCommand implements vscode.Disposable {
  private readonly disposable: vscode.Disposable

  constructor(
    private readonly linkedProjectsState: LinkedProjectsStateProvider,
    private readonly vercelApi: VercelApiClient,
    private readonly auth: AuthenticationStateProvider,
  ) {
    this.disposable = vscode.commands.registerCommand(CommandId.PullEnvs, this.run, this)
  }

  dispose() {
    this.disposable.dispose()
  }

  async run(project?: LinkedProject, environment?: VercelDeploymentEnvironment) {
    const currentSession = this.auth.currentSession
    if (!currentSession) return
    const {accessToken, teamId} = currentSession

    const selectedProject = project ?? (await showLinkedProjectQuickPick(this.linkedProjectsState.linkedProjects))
    if (!selectedProject) return

    const projectId = selectedProject.remote.id
    const projectUri = selectedProject.local.uri

    const selectedEnv = environment ?? (await showEnvironmentQuickPick())
    if (!selectedEnv) return

    const displayPath = path.join(path.basename(projectUri.path), envFileName)
    const envFileUri = projectUri.with({path: path.join(projectUri.path, envFileName)})

    if (await fileExists(envFileUri)) {
      const override = await vscode.window.showWarningMessage(
        `[${displayPath}](${envFileUri.toString()}) file already exists.`,
        'override',
      )
      if (!override) return
    }

    const envs = await this.vercelApi.pullProjectEnvs(projectId, selectedEnv, accessToken, teamId)
    if (!envs) return

    await writeFile(envFileUri, recordToDotenv(envs))
    await vscode.window.showInformationMessage(`Successfully saved [${displayPath}](${envFileUri}).`)
  }
}

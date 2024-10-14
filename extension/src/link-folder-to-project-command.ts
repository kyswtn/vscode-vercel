import slugify from '@sindresorhus/slugify'
import path from 'pathe'
import * as vscode from 'vscode'
import {AuthenticationStateProvider} from './authentication-state-provider'
import {CommandId, projectJsonPath} from './constants'
import {Injectable} from './lib'
import {showProjectToLinkQuickPickItem} from './quickpicks/show-project-to-link-quickpick'
import {showTeamQuickPick} from './quickpicks/show-team-quickpick'
import {ProjectJson} from './types'
import {logAndShowErrorMessage} from './utils/errors'
import {isValidVercelProject} from './utils/validation'
import {fileExists, writeFile} from './utils/vscode'
import {VercelApiClient} from './vercel-api-client'

@Injectable()
export class LinkFolderToProjectCommand implements vscode.Disposable {
  private readonly disposable: vscode.Disposable

  constructor(
    private readonly auth: AuthenticationStateProvider,
    private readonly vercelApi: VercelApiClient,
  ) {
    this.disposable = vscode.commands.registerCommand(CommandId.LinkFolderToProject, this.run, this)
  }

  dispose() {
    this.disposable.dispose()
  }

  async run(folderUri: vscode.Uri) {
    const currentSession = this.auth.currentSession
    if (!currentSession) return

    const targetProjectJsonFileUri = folderUri.with({path: path.join(folderUri.path, projectJsonPath)})
    const alreadyLinked = await fileExists(targetProjectJsonFileUri)
    if (alreadyLinked) {
      await vscode.window.showInformationMessage('Folder is already linked to a Vercel project.')
      return
    }

    try {
      const loadTeams = () => this.vercelApi.listTeams(currentSession.accessToken)

      let teamId = currentSession.teamId
      if (currentSession.scopes.includes('teams')) {
        const pickedTeamId = await showTeamQuickPick(loadTeams)
        if (!pickedTeamId) return

        teamId = pickedTeamId
      }

      const loadProjects = () =>
        Promise.all([
          this.detectProjectFromFolder(folderUri, currentSession.accessToken, teamId),
          this.vercelApi
            .listProjects(currentSession.accessToken, teamId)
            .then((projects) => projects?.filter(isValidVercelProject)),
        ])

      const [project, user] = await Promise.all([
        showProjectToLinkQuickPickItem(loadProjects),
        // If teamId is empty, we'll need to fetch user details to get default team ID. We'll do that
        // while waiting for the user to pick a team to improve perceived performance.
        teamId === undefined ? this.vercelApi.getUser(currentSession.accessToken) : Promise.resolve(undefined),
      ])
      if (!project) return

      if (user) {
        // Northstar users are those who have already migrated to `teamId` instead of `orgId`.
        teamId = user.version === 'northstar' ? user.defaultTeamId : user.id
      }

      if (!teamId) {
        throw new Error('Unable to find an account or a team to link project.')
      }

      const projectJson: ProjectJson = {projectId: project.id, orgId: teamId}
      await writeFile(targetProjectJsonFileUri, JSON.stringify(projectJson))

      // TODO: Check if the workspace is a git project and add .vercel directory to .gitignore if not already.

      await vscode.window.showInformationMessage(`Successfully linked project ${project.name}.`)
    } catch (error) {
      logAndShowErrorMessage(error, 'link project')
    }
  }

  private async detectProjectFromFolder(folderUri: vscode.Uri, accessToken: string, teamId?: string) {
    const folderName = path.basename(folderUri.path)
    const slugifiedFolderName = slugify(folderName)

    try {
      const [project, slugifiedProject] = await Promise.all([
        this.vercelApi.getProjectByNameOrId(folderName, accessToken, teamId),
        slugifiedFolderName !== folderName
          ? this.vercelApi.getProjectByNameOrId(folderName, accessToken, teamId)
          : null,
      ])

      const detectedProject = project ?? slugifiedProject
      return isValidVercelProject(detectedProject) ? detectedProject : undefined
    } catch (_) {
      // SAFETY:
      // Intentionally doing nothing if project detection fails. This is only used as a suggestion anyway.
      return
    }
  }
}
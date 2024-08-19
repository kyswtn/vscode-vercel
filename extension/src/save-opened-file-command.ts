import path from 'pathe'
import * as vscode from 'vscode'
import {CommandId, DeploymentFileAccessType} from './constants'
import {CustomFileSystemProvider} from './custom-file-system-provider'
import {FoldersStateProvider} from './folders-state-provider'
import {Injectable} from './lib'
import {LinkedProjectsStateProvider} from './linked-projects-state-provider'
import {logAndShowErrorMessage} from './utils/errors'
import {writeFile} from './utils/vscode'

@Injectable()
export class SaveOpenedFileCommand implements vscode.Disposable {
  private readonly disposable: vscode.Disposable

  constructor(
    private readonly customFileSystemProvider: CustomFileSystemProvider,
    private readonly linkedProjectsState: LinkedProjectsStateProvider,
    private readonly foldersState: FoldersStateProvider,
  ) {
    this.disposable = vscode.commands.registerCommand(CommandId.SaveOpenedFile, this.run, this)
  }

  dispose() {
    this.disposable.dispose()
  }

  async run(uri: vscode.Uri) {
    const {deploymentId, deploymentName, accessType, path: filePath} = this.customFileSystemProvider.parseUri(uri)
    const fileContent = await this.customFileSystemProvider.readFile(uri)

    const linkedProjects = this.linkedProjectsState.linkedProjects
    const firstFolderUri = this.foldersState.folders[0]?.uri
    if (!firstFolderUri) throw new Error('No opened folder was found to save the file in.')

    let defaultUri: vscode.Uri
    switch (accessType) {
      case DeploymentFileAccessType.Events: {
        const projectFolderUri =
          linkedProjects.find((project) => project.remote.name === deploymentName!)?.local.uri ?? firstFolderUri
        if (!projectFolderUri) throw new Error('No project folder was found to save the file in.')

        // SAFETY: This split & pop pipeline must hold as long as vercel deployment IDs start witih dpl_.
        const deploymentIdWithoutPrefix = deploymentId.split('dpl_').pop()!
        const projectPrefix = linkedProjects.length > 1 ? `${deploymentName}-` : ''
        const readableFileName = `${projectPrefix}${deploymentIdWithoutPrefix.slice(0, 7)}.log`

        defaultUri = projectFolderUri.with({path: path.join(projectFolderUri.path, readableFileName)})
        break
      }
      case DeploymentFileAccessType.Files: {
        if (!filePath) throw new Error('Cannot save root file path /.')
        const projectFolderUri = firstFolderUri // TODO: How to get the project URI from deployment URI?

        defaultUri = projectFolderUri.with({path: path.join(projectFolderUri.path, path.basename(filePath))})
        break
      }
      default:
        return
    }

    try {
      const savingUri = await vscode.window.showSaveDialog({defaultUri})
      if (savingUri) await writeFile(savingUri, fileContent)
    } catch (error) {
      logAndShowErrorMessage(error, `save deployment ${accessType}`)
      throw error
    }
  }
}

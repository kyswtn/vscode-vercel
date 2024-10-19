import path from 'pathe'
import * as vscode from 'vscode'
import {CommandId} from '../constants'
import {Injectable} from '../lib'
import {FilesFileSystemProvider} from '../shared/custom-file-system-provider'
import {FoldersStateProvider} from '../state/folders-state-provider'
import {LinkedProjectsStateProvider} from '../state/linked-projects-state-provider'
import {writeFile} from '../utils'
import {logAndShowErrorMessage} from '../utils/errors'

@Injectable()
export class SaveOpenedFileCommand implements vscode.Disposable {
  private readonly disposable: vscode.Disposable

  constructor(
    private readonly customFileSystemProvider: FilesFileSystemProvider,
    private readonly foldersState: FoldersStateProvider,
    private readonly linkedProjectsState: LinkedProjectsStateProvider,
  ) {
    this.disposable = vscode.commands.registerCommand(CommandId.SaveOpenedFile, this.run, this)
  }

  dispose() {
    this.disposable.dispose()
  }

  async run(uri: vscode.Uri) {
    const {deploymentId, projectId, filePath} = this.customFileSystemProvider.parseUri(uri)
    if (!filePath) throw new Error('Cannot save root file path /.')

    const linkedProject = this.linkedProjectsState.linkedProjects.find((project) => project.remote.id === projectId)
    const directoryToSaveIn = linkedProject?.local.uri ?? this.foldersState.folders[0]?.uri
    if (!directoryToSaveIn) throw new Error('No opened folder was found to save the file in.')

    let filePathToSaveIn = path.basename(filePath)
    const isLogFile = ['.', '/'].includes(path.dirname(filePath)) && path.extname(filePath) === '.log'
    if (isLogFile) {
      const deploymentIdWithoutPrefix = deploymentId.split('dpl_').pop()!
      const deploymentName = path.basename(filePath, '.log')
      filePathToSaveIn = `${deploymentName}-${deploymentIdWithoutPrefix.slice(0, 7)}.log`
    }

    const fileContent = await this.customFileSystemProvider.readFile(uri)
    const defaultUri = directoryToSaveIn.with({
      path: path.join(directoryToSaveIn.path, filePathToSaveIn),
    })

    try {
      const savingUri = await vscode.window.showSaveDialog({defaultUri})
      if (savingUri) await writeFile(savingUri, fileContent)
    } catch (error) {
      logAndShowErrorMessage(error, 'save deployment file')
      throw error
    }
  }
}

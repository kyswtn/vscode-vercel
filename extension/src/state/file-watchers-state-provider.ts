import * as vscode from 'vscode'
import {FilePattern} from '../constants'
import {FileWatcher, Injectable, type WatchedFileChangeEvent} from '../lib'
import {FoldersStateProvider} from './folders-state-provider'

/**
 * Watches `.vercel` directory and `.vercel/project.json` files, and report any updates to them as
 * observable events. Also handles creating new watchers and deleting old ones based on
 * {@link FoldersStateProvider}.
 */
@Injectable()
export class FileWatchersStateProvider implements vscode.Disposable {
  private readonly fileWatchers: Map<string, vscode.Disposable>
  private readonly fileWatchersEventEmitter = new vscode.EventEmitter<WatchedFileChangeEvent>()
  private readonly disposable: vscode.Disposable

  constructor(foldersState: FoldersStateProvider) {
    this.fileWatchers = new Map(
      foldersState.folders.map((folder) => [folder.uri.path, this.createFileWatchersForFolder(folder)]),
    )

    this.disposable = foldersState.onDidChangeFolders((event) => {
      this.updateFileWatchersWhenFoldersChanged(event)
    })
  }

  dispose() {
    this.disposable.dispose()
    this.fileWatchersEventEmitter.dispose()
    vscode.Disposable.from(...this.fileWatchers.values()).dispose()
  }

  get onDidChangeWatchedFiles() {
    return this.fileWatchersEventEmitter.event
  }

  private createFileWatchersForFolder(folder: vscode.WorkspaceFolder) {
    const fileWatchers = [
      new FileWatcher(new vscode.RelativePattern(folder.uri, FilePattern.ProjectJson)),
      new FileWatcher(new vscode.RelativePattern(folder.uri, FilePattern.DotVercelDirectory)),
    ]
    const eventListeners = fileWatchers.map((watcher) =>
      watcher.onDidChange((event) => {
        this.fileWatchersEventEmitter.fire(event)
      }),
    )
    return vscode.Disposable.from(...fileWatchers, ...eventListeners)
  }

  private updateFileWatchersWhenFoldersChanged(event: vscode.WorkspaceFoldersChangeEvent) {
    for (const folder of event.removed) {
      const uriPath = folder.uri.path
      const existingWatcher = this.fileWatchers.get(uriPath)

      if (existingWatcher) {
        existingWatcher.dispose()
        this.fileWatchers.delete(uriPath)
      }
    }

    for (const folder of event.added) {
      const uriPath = folder.uri.path

      if (!this.fileWatchers.has(uriPath)) {
        this.fileWatchers.set(uriPath, this.createFileWatchersForFolder(folder))
      }
    }
  }
}

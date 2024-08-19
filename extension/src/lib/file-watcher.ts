import * as vscode from 'vscode'

export type WatchedFileChangeEvent = {
  type: 'change' | 'create' | 'delete'
  pattern: string
  uri: vscode.Uri
}

export type FileWatcherOptions = {
  ignoreCreateEvents?: boolean
  ignoreChangeEvents?: boolean
  ignoreDeleteEvents?: boolean
}

export class FileWatcher implements vscode.Disposable {
  private readonly pattern: string
  private readonly watcher: vscode.FileSystemWatcher

  constructor(pattern: vscode.GlobPattern, options?: FileWatcherOptions) {
    this.watcher = vscode.workspace.createFileSystemWatcher(
      pattern,
      options?.ignoreCreateEvents ?? false,
      options?.ignoreChangeEvents ?? false,
      options?.ignoreDeleteEvents ?? false,
    )
    this.pattern = typeof pattern === 'string' ? pattern : pattern.pattern
  }

  dispose() {
    this.watcher.dispose()
  }

  onDidChange(callback: (event: WatchedFileChangeEvent) => void): vscode.Disposable {
    const onDidChange = (type: WatchedFileChangeEvent['type']) => (uri: vscode.Uri) =>
      callback({type, pattern: this.pattern, uri})

    return vscode.Disposable.from(
      this.watcher.onDidChange(onDidChange('change')),
      this.watcher.onDidCreate(onDidChange('create')),
      this.watcher.onDidDelete(onDidChange('delete')),
    )
  }
}

import * as vscode from 'vscode'
import {ProjectJson} from '../types'
import {naiveHash, normalizePath} from '../utils'

export class LocalProject {
  public readonly id: string

  constructor(
    public readonly uri: vscode.Uri,
    public readonly folder: vscode.WorkspaceFolder,
    public readonly projectJson: ProjectJson,
  ) {
    // URI itself might be a problem to be used as an ID because it might not be normalized (i.e. it
    // might contain white spaces, trailing slashes etc). We don't use a UUID here because we want to
    // cache the project state across sessions and windows.
    this.id = naiveHash(normalizePath(uri.path))
  }
}

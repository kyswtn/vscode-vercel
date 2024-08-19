import * as vscode from 'vscode'
import {InjectContext, Injectable} from './decorators'

type _WorkspaceState = vscode.ExtensionContext['workspaceState']

@Injectable()
export class WorkspaceState implements _WorkspaceState {
  constructor(@InjectContext('workspaceState') private readonly workspaceState: _WorkspaceState) {}

  keys() {
    return this.workspaceState.keys()
  }

  get<T>(key: string): T | undefined
  get<T>(key: string, defaultValue?: T) {
    return this.workspaceState.get(key, defaultValue)
  }

  update(key: string, value: unknown) {
    return this.workspaceState.update(key, value)
  }
}

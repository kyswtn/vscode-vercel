import * as vscode from 'vscode'
import {InjectContext, Injectable} from './decorators'

type _GlobalState = vscode.ExtensionContext['globalState']

@Injectable()
export class GlobalState implements _GlobalState {
  constructor(@InjectContext('globalState') private readonly globalState: _GlobalState) {}

  keys() {
    return this.globalState.keys()
  }

  get<T>(key: string): T | undefined
  get<T>(key: string, defaultValue?: T) {
    return this.globalState.get(key, defaultValue)
  }

  update(key: string, value: unknown) {
    return this.globalState.update(key, value)
  }

  setKeysForSync(keys: readonly string[]) {
    return this.globalState.setKeysForSync(keys)
  }
}

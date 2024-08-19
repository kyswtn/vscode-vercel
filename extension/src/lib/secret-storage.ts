import * as vscode from 'vscode'
import {InjectContext, Injectable} from './decorators'

type _SecretStorage = vscode.ExtensionContext['secrets']

@Injectable()
export class SecretStorage implements _SecretStorage {
  constructor(@InjectContext('secrets') private readonly secrets: _SecretStorage) {}

  async get(key: string): Promise<string | undefined> {
    return await this.secrets.get(key)
  }

  async getJSON<T>(key: string): Promise<T | undefined> {
    const secret = await this.get(key)
    if (!secret) return

    try {
      return JSON.parse(secret) as T
    } catch (error) {
      // We'll ignore malformed JSON parsing errors.
      return
    }
  }

  async store(key: string, value: string): Promise<void> {
    await this.secrets.store(key, value)
  }

  async storeJSON(key: string, value: unknown): Promise<void> {
    await this.store(key, JSON.stringify(value))
  }

  async delete(key: string): Promise<void> {
    await this.secrets.delete(key)
  }

  get onDidChange() {
    return this.secrets.onDidChange
  }
}

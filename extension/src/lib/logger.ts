import * as vscode from 'vscode'

type LogMethod = 'trace' | 'debug' | 'info' | 'warn' | 'error'

export class Logger {
  static __output__: vscode.LogOutputChannel

  constructor(private readonly context: string) {}

  private logFn(method: LogMethod) {
    return (message: string) => {
      if (Logger.__output__) {
        Logger.__output__[method](`[${this.context}] ${message}`)
      }
    }
  }

  readonly trace = this.logFn('trace')
  readonly debug = this.logFn('debug')
  readonly info = this.logFn('info')
  readonly warn = this.logFn('warn')
  readonly error = this.logFn('error')
}

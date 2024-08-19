import {Completer} from './completer'

const resolvedEmptyPromise = Promise.resolve()

export class LoadingState {
  private loadingCompleter: Completer | undefined

  private startLoading() {
    this.loadingCompleter = new Completer()
  }

  private stopLoading() {
    if (this.loadingCompleter) {
      this.loadingCompleter.resolve()
    }
  }

  get loadingPromise() {
    return this.loadingCompleter?.promise ?? resolvedEmptyPromise
  }

  async withLoading<T>(fn: () => Promise<T>): Promise<T | undefined> {
    if (this.loadingCompleter && !this.loadingCompleter.isCompleted) return

    this.startLoading()
    try {
      const result = await fn()
      return result
    } finally {
      this.stopLoading()
    }
  }
}

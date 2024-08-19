export class Completer<T = void> {
  private _promise: Promise<T>
  // SAFETY:
  // These do get assigned in constructor but Typescript can't seem to detect it.
  private _isCompleted!: boolean
  private _resolve!: (value: T | PromiseLike<T>) => void
  private _reject!: (reason: unknown) => void

  constructor() {
    this._promise = new Promise<T>((resolve, reject) => {
      this._resolve = resolve
      this._reject = reject
      this._isCompleted = false
    }).finally(() => {
      this._isCompleted = true
    })
  }

  get promise() {
    return this._promise
  }

  get isCompleted() {
    return this._isCompleted
  }

  resolve(value: T | PromiseLike<T>) {
    if (!this._isCompleted) {
      this._resolve(value)
    }
  }

  reject(reason: unknown) {
    if (!this._isCompleted) {
      this._reject(reason)
    }
  }
}

export class PromiseQueue {
  private queue: Array<() => Promise<unknown>> = []
  private isProcessing = false

  enqueue<T>(promiseFn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const task = async () => {
        try {
          const result = await promiseFn()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      }

      this.queue.push(task)
      if (!this.isProcessing) {
        void this.processNext()
      }
    })
  }

  private async processNext() {
    if (this.isProcessing || this.queue.length === 0) {
      return
    }

    this.isProcessing = true
    const task = this.queue.shift()
    try {
      // SAFETY:
      // Task can't be null because the length of the queue has been checked to not be 0.
      await task!()
    } catch (error) {
      // Handle or log the error if needed.
    } finally {
      this.isProcessing = false
      void this.processNext()
    }
  }
}

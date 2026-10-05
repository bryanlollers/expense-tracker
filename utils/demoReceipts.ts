export interface ReceiptStorage {
  put(path: string, file: Blob): Promise<void>
  get(path: string): Promise<Blob | undefined>
  remove(path: string): Promise<void>
  clear(): Promise<void>
}

export class BrowserReceiptStorage implements ReceiptStorage {
  private async database() {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('ledger-demo-receipts-v1', 1)
      request.onupgradeneeded = () =>
        request.result.createObjectStore('receipts')
      request.onsuccess = () => resolve(request.result)
      request.onerror = () =>
        reject(new Error('Receipt storage is unavailable in this browser.'))
    })
  }
  private async execute<T>(
    mode: IDBTransactionMode,
    action: (store: IDBObjectStore) => IDBRequest<T>,
  ): Promise<T> {
    const db = await this.database()
    try {
      return await new Promise<T>((resolve, reject) => {
        const transaction = db.transaction('receipts', mode)
        const request = action(transaction.objectStore('receipts'))
        transaction.oncomplete = () => resolve(request.result)
        transaction.onabort = () =>
          reject(
            new Error(
              'Could not save the receipt. Check available browser storage.',
            ),
          )
        transaction.onerror = () =>
          reject(new Error('Receipt storage failed. Please try again.'))
      })
    } finally {
      db.close()
    }
  }
  async put(path: string, file: Blob) {
    await this.execute('readwrite', (store) => store.put(file, path))
  }
  async get(path: string): Promise<Blob | undefined> {
    return this.execute('readonly', (store) => store.get(path))
  }
  async remove(path: string) {
    await this.execute('readwrite', (store) => store.delete(path))
  }
  async clear() {
    await this.execute('readwrite', (store) => store.clear())
  }
}

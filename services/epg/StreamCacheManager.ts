import type { IStreamCache } from './types'

export class StreamCacheManager {
  protected cache: Map<string, IStreamCache> = new Map()
  protected cacheDuration = 30 * 60 * 1e3 // 30 minutes

  public has(epgUrl: string) {
    const entry = this.cache.get(epgUrl)
    if (!entry) {
      return false
    }

    const now = Date.now()
    if (now - entry.timestamp > this.cacheDuration) {
      this.remove(epgUrl)
      return false
    }

    return true
  }

  public complete(epgUrl: string) {
    const cacheEntry = this.cache.get(epgUrl)
    if (cacheEntry) {
      cacheEntry.isComplete = true
    }
  }

  public load(epgUrl: string) {
    if (!this.has(epgUrl)) {
      return
    }

    const cacheEntry = this.cache.get(epgUrl)!
    if (!cacheEntry.isComplete) {
      return new ReadableStream({
        start(controller) {
          const { cachedChunks } = cacheEntry
          let index = 0
          let timeout = 10e3
          const interval = 500

          const checkNewChunks = () => {
            if (index < cachedChunks.length) {
              for (; index < cachedChunks.length; index++) {
                controller.enqueue(cachedChunks[index])
              }
            }

            if (cacheEntry.isComplete) {
              controller.close()
              return
            }

            timeout -= interval
            if (timeout <= 0) {
              controller.error(new Error('Stream timed out waiting for new data.'))
              return
            }

            setTimeout(checkNewChunks, interval)
          }

          checkNewChunks()
        },
      })
    }

    const start = (controller: ReadableStreamDefaultController<any>) => {
      cacheEntry.cachedChunks.forEach((chunk) => {
        controller.enqueue(chunk)
      })

      controller.close()
    }

    return new ReadableStream({ start })
  }

  public save(epgUrl: string, cacheEntry: Omit<IStreamCache, 'timestamp'>) {
    this.cache.set(epgUrl, { ...cacheEntry, timestamp: Date.now() })
  }

  public remove(epgUrl: string) {
    this.cache.delete(epgUrl)
  }

  public cleanUp() {
    const now = Date.now()
    for (const [epgUrl, { timestamp }] of this.cache.entries()) {
      if (now - timestamp > this.cacheDuration) {
        this.cache.delete(epgUrl)
      }
    }
  }
}

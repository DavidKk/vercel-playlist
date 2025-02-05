import { stream } from '@/initializer/controller'
import { fetchAndProcessEPG } from '@/services/epg/fetch'
import { fetchChannels } from '@/services/playlist'
import type { Channel } from '@/services/epg/types'
import { setHeaders } from '@/services/context'

export const GET = stream(async () => {
  const channels = await fetchChannels()
  const finalChannels = Array.from<Channel>(
    (function* () {
      for (const { id, name, logo } of channels) {
        if (!(id && name && logo)) {
          continue
        }

        yield { id, name, logo }
      }
    })()
  )

  const { stream, isCache } = await fetchAndProcessEPG(finalChannels, 'https://epg.112114.xyz/pp.xml')
  if (isCache) {
    setHeaders({
      'X-Cache-Hit': 'true',
    })
  }

  return stream
})

import { parseM3U, type M3uChannel } from '@iptv/playlist'
import { getGistInfo, readGistFile } from '@/services/gist'
import { fetchWithCache } from '@/services/fetch'
import { convertArrayBufferToString } from '@/utils/buffer'
import { M3U_FILE_NAME } from './constants'

export async function fetchChannels() {
  const { gistId, gistToken } = getGistInfo()
  const content = await readGistFile({ fileName: M3U_FILE_NAME, gistId, gistToken })
  const urls = JSON.parse(content)
  if (!Array.isArray(urls)) {
    return []
  }

  const channels: M3uChannel[] = []
  for (const url of urls) {
    try {
      const response = await fetchWithCache(url)
      const content = convertArrayBufferToString(response)
      const m3u = parseM3U(content)
      channels.push(...m3u.channels)
    } catch {
      // eslint-disable-next-line no-console
      console.error(`Failed to fetch channels from ${url}`)
    }
  }

  return channels
}

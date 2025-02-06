import { parseM3U, type M3uChannel } from '@iptv/playlist'
import { getGistInfo, readGistFile, writeGistFile } from '@/services/gist'
import { fetchWithCache } from '@/services/fetch'
import { convertArrayBufferToString } from '@/utils/buffer'
import { M3U_FILE_NAME } from './constants'
import { isM3uConfig, type M3uConfigCollection, type M3uConfig } from './types'

export async function fetchM3UConfigs() {
  const { gistId, gistToken } = getGistInfo()
  const content = await readGistFile({ fileName: M3U_FILE_NAME, gistId, gistToken })
  const configs: M3uConfigCollection = JSON.parse(content)
  if (!Array.isArray(configs)) {
    return []
  }

  return configs.filter((config) => isM3uConfig(config))
}

export async function fetchChannels() {
  const configs = await fetchM3UConfigs()

  const channels = new Map<string, M3uChannel[]>()
  for (const config of configs) {
    const { name, url, enable = true } = config
    if (!enable) {
      continue
    }

    try {
      const response = await fetchWithCache(url)
      const content = convertArrayBufferToString(response)
      const m3u = parseM3U(content)
      channels.set(name, m3u.channels)
    } catch {
      // eslint-disable-next-line no-console
      console.error(`Failed to fetch channels from ${name} ${url}`)
    }
  }

  return channels
}

export async function updateM3uConfigs(m3uConfigs: M3uConfig[]) {
  const { gistId, gistToken } = getGistInfo()
  const content = JSON.stringify(m3uConfigs, null, 2)
  await writeGistFile({ fileName: M3U_FILE_NAME, content, gistId, gistToken })
}

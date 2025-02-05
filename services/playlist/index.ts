import { getGistInfo, readGistFile, writeGistFile } from '@/services/gist'
import { CHANNEL_FILE_NAME } from './constants'
import { isChannel, type Channel } from './types'

export async function fetchChannels(): Promise<Channel[]> {
  const { gistId, gistToken } = getGistInfo()
  const content = await readGistFile({ fileName: CHANNEL_FILE_NAME, gistId, gistToken })
  if (!content) {
    return []
  }

  const channels = JSON.parse(content)
  if (!(Array.isArray(channels) && channels.length > 0)) {
    return []
  }

  return channels.filter(isChannel)
}

export async function updateChannels(channels: Channel[]) {
  const { gistId, gistToken } = getGistInfo()
  const content = JSON.stringify(channels, null, 2)
  await writeGistFile({ fileName: CHANNEL_FILE_NAME, content, gistId, gistToken })
}

'use server'

import { withAuthAction } from '@/initializer/wrapper'
import { fetchChannels, updateChannels } from '@/services/playlist'
import type { Channel } from '@/services/playlist/types'

export const getChannels = withAuthAction(async () => {
  return fetchChannels()
})

export const putChannels = withAuthAction(async (channels: Channel[]) => {
  await updateChannels(channels)
})

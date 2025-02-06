'use server'

import { withAuthAction } from '@/initializer/wrapper'
import { fetchChannels, fetchM3UConfigs, updateM3uConfigs } from '@/services/m3u'
import type { M3uConfig } from '@/services/m3u/types'

export const getChannels = withAuthAction(async () => {
  return fetchChannels()
})

export const ping = withAuthAction(async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    // eslint-disable-next-line no-console
    console.warn('Channel ping failed', response.status, url)
    return false
  }

  return true
})

export const getM3uConfigs = withAuthAction(async () => {
  return fetchM3UConfigs()
})

export const putM3uConfigs = withAuthAction(async (m3uConfigs: M3uConfig[]) => {
  await updateM3uConfigs(m3uConfigs)
})

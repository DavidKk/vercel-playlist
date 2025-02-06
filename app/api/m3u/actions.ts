'use server'

import { withAuthAction } from '@/initializer/wrapper'
import { fetchChannels } from '@/services/m3u'

export const getChannels = withAuthAction(async () => {
  return fetchChannels()
})

export const pingChannel = withAuthAction(async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    // eslint-disable-next-line no-console
    console.warn('Channel ping failed', response.status, url)
    return false
  }

  return true
})

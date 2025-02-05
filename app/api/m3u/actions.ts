'use server'

import { withAuthAction } from '@/initializer/wrapper'
import { fetchChannels } from '@/services/m3u'

export const getChannels = withAuthAction(async () => {
  return fetchChannels()
})

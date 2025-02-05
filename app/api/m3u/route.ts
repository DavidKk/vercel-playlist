import { api } from '@/initializer/controller'
import { trimAction } from '@/initializer/wrapper'
import { jsonSuccess } from '@/initializer/response'
import { checkAccess } from '@/services/auth/access'
import { getChannels } from './actions'

export const GET = api(async () => {
  await checkAccess()

  const channels = await trimAction(getChannels)()
  return jsonSuccess({ channels })
})

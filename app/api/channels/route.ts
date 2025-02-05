import { api } from '@/initializer/controller'
import { jsonSuccess } from '@/initializer/response'
import { checkAccess } from '@/services/auth/access'
import { getChannels } from './actions'
import { trimAction } from '@/initializer/wrapper'

export const GET = api(async () => {
  await checkAccess()

  const channels = await trimAction(getChannels)()
  return jsonSuccess({ channels })
})

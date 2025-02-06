import { checkAccess } from '@/services/auth/access'
import M3uConfigEditor from './M3uConfigEditor'

export default async function M3uPage() {
  await checkAccess()
  return <M3uConfigEditor />
}

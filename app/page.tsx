import { checkAccess } from '@/services/auth/access'
import ChannelEditor from './channel/ChannelEditor'

export default async function Home() {
  await checkAccess({ checkApiRouter: false })

  return <ChannelEditor />
}

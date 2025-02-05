import { checkAccess } from '@/services/auth/access'
import Editor from './Editor'

export default async function Home() {
  await checkAccess()
  return <Editor />
}

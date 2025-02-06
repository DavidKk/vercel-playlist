import { getM3uConfigs } from '@/app/api/m3u/actions'
import M3uConfigManager from './M3uConfigManager'
import Link from 'next/link'

export default async function M3uConfigEditor() {
  const configs = await getM3uConfigs()

  return (
    <div className="p-2 md:p-4 max-w-6xl mx-auto mt-12">
      <h1 className="text-2xl text-center font-bold mb-8">M3U Config Editor</h1>

      <div className="mb-4">
        <M3uConfigManager configs={configs} />
      </div>

      <div className="flex gap-4 items-center justify-center mb-4 text-center">
        <Link className="text-gray-800 underline" href="/">Channel Editor</Link>
        <Link className="text-gray-800 underline" href="/m3u">Config Editor</Link>
        <Link className="text-gray-800 underline" href="/player">Play Online</Link>
      </div>
    </div>
  )
}

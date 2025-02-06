import { getChannels } from '@/app/api/channels/actions'
import { getChannels as getM3UChannels } from '@/app/api/m3u/actions'
import ChannelManager from './ChannelManager'
import { GettingStart } from './GettingStart'
import type { M3uChannel } from '@iptv/playlist'
import Link from 'next/link'

export default async function ChannelEditor() {
  const channels = await getChannels()
  const m3uChannelsMap = await getM3UChannels()
  const m3uChannels: (M3uChannel & { origin: string })[] = Array.from(m3uChannelsMap.entries()).flatMap(([name, channels]) => {
    return channels.map((channel) => ({ ...channel, origin: name }))
  })

  return (
    <div className="p-2 md:p-4 max-w-6xl mx-auto mt-12">
      <h1 className="text-2xl text-center font-bold mb-8">TV Channel Editor</h1>

      <div className="mb-4">
        <ChannelManager channels={channels} m3uChannels={m3uChannels} />
      </div>

      <GettingStart />

      <div className="mb-4 text-center">
        <Link className="text-blue-500 underline" href="/m3u">
          Go to M3U Config Editor
        </Link>
      </div>
    </div>
  )
}

import { getChannels } from '@/app/api/channels/actions'
import { getChannels as getM3UChannels } from '@/app/api/m3u/actions'
import ChannelManager from './ChannelManager'
import { GettingStart } from './GettingStart'

export default async function Editor() {
  const channels = await getChannels()
  const m3uChannels = await getM3UChannels()

  return (
    <div className="p-2 md:p-4 max-w-6xl mx-auto mt-12">
      <h1 className="text-2xl text-center font-bold mb-8">TV Channel Editor</h1>
      <div className="mb-4">
        <ChannelManager channels={channels} m3uChannels={m3uChannels} />
      </div>

      <GettingStart />
    </div>
  )
}

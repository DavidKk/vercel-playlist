import { NextResponse } from 'next/server'
import { writeM3U } from '@iptv/playlist'
import type { M3uChannel, M3uPlaylist } from '@iptv/playlist'
import { plainText } from '@/initializer/controller'
import { getChannels } from '@/app/api/channels/actions'
import { trimAction } from '@/initializer/wrapper'

export const GET = plainText(async (req) => {
  const uri = new URL(req.url)
  const type = uri.searchParams.get('type')

  const channels = await trimAction(getChannels)()
  const m3uChannels = Array.from<M3uChannel>(
    (function* () {
      for (const { id, name, logo: tvgLogo, group: groupTitle, url } of channels) {
        if (!url) {
          continue
        }

        const tvgId = `${id}`.padStart(4, '0')
        yield { name, url, tvgId, tvgName: name, tvgLogo, groupTitle, tvgUrl: url }
      }
    })()
  )

  const baseUrl = `${uri.protocol}//${uri.host}`
  const m3uPlaylist: M3uPlaylist = {
    channels: m3uChannels,
    headers: {
      urlTvg: `${baseUrl}/api/epg.xml`,
      xTvgUrl: `${baseUrl}/api/epg.xml`,
    },
  }

  const content = writeM3U(m3uPlaylist)
  if (type === 'text' || process.env.NODE_ENV === 'development') {
    return content
  }

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'audio/x-mpegurl; charset=UTF-8',
      'Access-Control-Allow-Origin': '*',
    },
  })
})

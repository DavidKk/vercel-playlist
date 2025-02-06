'use client'

import { PlayIcon } from "@heroicons/react/24/outline"
import Link from "next/link"
import { useEffect, useState } from "react"

const PLAYER_ONLINE_URL = 'http://m3u-ip.tv/browser'

export default function PlayerPage() {
  const [baseUrl, setBaseUrl] = useState('')
  
  useEffect(() => {
    setBaseUrl(window.location.origin)
  }, [])

  const playUrl = baseUrl ? `${PLAYER_ONLINE_URL}/?url=${baseUrl}/api/playlist.m3u` : ''

  const handleClick = () => {
    if (playUrl) {
      window.open(playUrl, '_blank')
    }
  }

  return (
    <>
      <div className="flex items-center justify-center w-full h-[80vh]">
        <div className="text-center max-w-md mx-auto">
          <p className="mb-6 text-lg">Click the button below to play the video</p>

          <button 
            onClick={handleClick} 
            className="px-14 py-6 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
          >
            <PlayIcon />
            Play Online
          </button>

          <p className="mt-6 text-md text-gray-500">
            Since M3U8 and other resources may be hosted on HTTP, the web cannot request HTTP resources over HTTPS. <br />If it automatically redirects to an HTTPS address, you can switch to the HTTP protocol. The player service used is <a className="underline" href={PLAYER_ONLINE_URL} target="_blank">{PLAYER_ONLINE_URL}</a>.
          </p>
        </div>
      </div>

      <div className="flex gap-4 items-center justify-center mb-4 text-center">
        <Link className="text-gray-800 underline" href="/">Channel Editor</Link>
        <Link className="text-gray-800 underline" href="/m3u">Config Editor</Link>
        <Link className="text-gray-800 underline" href="/player">Play Online</Link>
      </div>
    </>
  )
}

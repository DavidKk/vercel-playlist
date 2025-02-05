'use client'

import { useEffect, useRef, useState } from 'react'
import { ClipboardDocumentCheckIcon } from '@heroicons/react/16/solid'
import type { AlertImperativeHandler } from '@/components/Alert'
import Alert from '@/components/Alert'

export function GettingStart() {
  const [baseUrl, setBaseUrl] = useState('')
  const playlistRef = useRef<HTMLInputElement>(null)
  const epgRef = useRef<HTMLInputElement>(null)
  const alertRef = useRef<AlertImperativeHandler>(null)

  useEffect(() => {
    setBaseUrl(window.location.origin)
  }, [])

  const copyToClipboard = (content: string) => {
    if (!content) {
      return
    }

    navigator.clipboard.writeText(content.trim())
    alertRef.current?.show('Copied to clipboard')
  }

  return (
    <>
      <div className="space-y-3 pb-10">
        <Alert ref={alertRef} />

        <div className="group">
          <label className="block text-sm font-medium text-gray-700 mb-1">M3U URL</label>
          <div className="relative flex rounded-md shadow-sm hover:ring-1 hover:ring-indigo-500 transition-all">
            <input
              ref={playlistRef}
              type="text"
              readOnly
              disabled
              value={`${baseUrl}/api/playlist.m3u`}
              className="block w-full pl-4 pr-12 rounded-md border-0 py-1.5 text-gray-900 
                      ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 
                      focus:ring-2 focus:ring-inset focus:ring-indigo-600
                      sm:text-sm sm:leading-6 bg-gray-50"
            />
            <button
              onClick={() => copyToClipboard(playlistRef.current?.value || '')}
              className="absolute right-0 top-0 bottom-0 px-3 flex items-center
                      rounded-r-md bg-transparent hover:bg-gray-100 active:bg-gray-200
                      border-l border-gray-300 group-hover:border-indigo-500
                      transition-colors"
            >
              <ClipboardDocumentCheckIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
            </button>
          </div>
        </div>

        <div className="group">
          <label className="block text-sm font-medium text-gray-700 mb-1">EPG URL</label>
          <div className="relative flex rounded-md shadow-sm hover:ring-1 hover:ring-indigo-500 transition-all">
            <input
              ref={epgRef}
              type="text"
              readOnly
              disabled
              value={`${baseUrl}/api/epg.xml`}
              className="block w-full pl-4 pr-12 rounded-md border-0 py-1.5 text-gray-900 
                      ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 
                      focus:ring-2 focus:ring-inset focus:ring-indigo-600
                      sm:text-sm sm:leading-6 bg-gray-50"
            />
            <button
              onClick={() => copyToClipboard(epgRef.current?.value || '')}
              className="absolute right-0 top-0 bottom-0 px-3 flex items-center
                      rounded-r-md bg-transparent hover:bg-gray-100 active:bg-gray-200
                      border-l border-gray-300 group-hover:border-indigo-500
                      transition-colors"
            >
              <ClipboardDocumentCheckIcon className="w-5 h-5 text-gray-400 hover:text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

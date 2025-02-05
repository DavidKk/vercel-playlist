import { useEffect, useMemo, useState } from 'react'
import { BackspaceIcon } from '@heroicons/react/16/solid'
import { fuzzySearch } from '@/utils/find'
import type { Channel } from '@/services/playlist/types'

export interface FilterBarProps {
  channels: Channel[]
  onFilter: (channels: Channel[]) => void
}

export function FilterBar(props: FilterBarProps) {
  const { channels, onFilter } = props
  const [nameFilter, setNameFilter] = useState('')

  const uniqueNames = useMemo(() => Array.from(new Set(channels.map((channel) => channel.name))), [channels])

  useEffect(() => {
    const filteredRules = channels.filter((channel) => {
      if (nameFilter) {
        if (!('name' in channel)) {
          return false
        }

        return fuzzySearch(nameFilter, channel.name)
      }

      return true
    })

    onFilter(filteredRules)
  }, [channels, nameFilter, onFilter])

  return (
    <div className="flex gap-2 justify-start sm:justify-end overflow-x-auto mb-2 p-2 sm:pb-2 bg-gray-100 rounded-sm shadow-md">
      <input
        type="text"
        placeholder="Filter by value (domain)"
        className="h-8 text-sm border rounded-sm box-border px-3"
        value={nameFilter}
        onChange={(event) => setNameFilter(event.target.value)}
      />

      <button
        className="h-8 flex items-center justify-center text-sm border-gray-300 border rounded-sm box-border px-3"
        onClick={() => {
          setNameFilter('')
        }}
        type="button"
      >
        <BackspaceIcon className="h-4 w-4 text-gray-500" />
      </button>
    </div>
  )
}

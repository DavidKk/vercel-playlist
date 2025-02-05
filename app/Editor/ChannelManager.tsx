'use client'

import { useRequest } from 'ahooks'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { M3uChannel } from '@iptv/playlist'
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { BarsArrowDownIcon, PlayIcon, TrashIcon } from '@heroicons/react/24/solid'
import SortableItem from '@/components/SortableItem'
import Alert, { type AlertImperativeHandler } from '@/components/Alert'
import { Spinner } from '@/components/Spinner'
import ClearableSelect from '@/components/ClearableSelect'
import type { Channel} from '@/services/playlist/types'
import { isChannel } from '@/services/playlist/types'
import { fuzzyMatch } from '@/utils/fuzzyMatch'
import { putChannels } from '@/app/api/channels/actions'
import { FilterBar } from './FilterBar'

export interface EditorProps {
  channels: Channel[]
  m3uChannels: M3uChannel[]
}

export default function ChannelManager(props: EditorProps) {
  const { channels: defaultChannels, m3uChannels } = props
  const [channels, setChannels] = useState([...defaultChannels])
  const [filteredChannels, setFilteredChannels] = useState(channels)
  const alertRef = useRef<AlertImperativeHandler>(null)
  const focusNextRef = useRef<number>(null)
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor))
  const formRef = useRef<HTMLFormElement>(null)

  const channelOptions = useMemo(() => {
    return channels.map((channel) =>
      Array.from(
        (function* () {
          const urls: string[] = []
          const options = Array.from(
            (function* () {
              for (const { tvgName, name: attName, url } of m3uChannels) {
                if (!url) {
                  continue
                }

                const name = tvgName || attName
                if (!name) {
                  continue
                }

                const weight = (() => {
                  const me = channel.name
                  if (tvgName) {
                    return fuzzyMatch(me, tvgName)
                  }

                  if (name) {
                    return fuzzyMatch(me, name)
                  }

                  return 0
                })()

                if (!weight) {
                  continue
                }

                if (urls.includes(url)) {
                  continue
                }

                yield { name, url, weight }
                urls.push(url)
              }
            })()
          )

          const minWeight = Math.min(...options.map((option) => option.weight))
          let index = 0
          for (const option of options) {
            if (option.weight !== minWeight) {
              continue
            }

            index++

            const { name, url: value } = option
            yield { label: `#${index} ${name}`, value }
          }
        })()
      )
    )
  }, [channels.map((channel) => channel.id).join(',')])

  const isFilterMode = filteredChannels.length !== channels.length

  const handleDragEnd = (event: any) => {
    const { active, over } = event
    if (active.id !== over.id) {
      setChannels((prev) =>
        arrayMove(
          prev,
          prev.findIndex((item) => item.id === parseInt(active.id, 10)),
          prev.findIndex((item) => item.id === parseInt(over.id, 10))
        )
      )
    }
  }

  const handleChannelChange = (id: number, field: string, value: string | number) => {
    setChannels((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const prependChannel = (index: number) => {
    const maxNumber = channels.reduce((acc, channel) => (channel.id > acc ? channel.id : acc), 0)
    const id = maxNumber + 1
    const newChannel: Channel = { id, name: '', url: '' }

    setChannels((prev) => {
      const cloned = [...prev]
      cloned.splice(index + 1, 0, newChannel)
      return cloned
    })

    focusNextRef.current = id
  }

  const reset = () => {
    setChannels([...defaultChannels])
    setFilteredChannels([...defaultChannels])
  }

  const removeChannel = (id: number) => {
    if (!confirm(`Are you sure you want to remove this channel?`)) {
      return
    }

    setChannels((prev) => prev.filter((item) => item.id !== id))
  }

  const autoSelect = () => {
    setChannels((prev) => {
      return prev.map((item, index) => {
        if (item.url) {
          return item
        }

        const options = channelOptions[index]
        if (!options.length) {
          return item
        }

        const { value } = options[0]
        return { ...item, url: value }
      })
    })
  }

  const { run: submit, loading: submitting } = useRequest(() => putChannels(channels), {
    manual: true,
    onSuccess: () => {
      alertRef.current?.show('Save Success')
    },
    onError: (error) => {
      alertRef.current?.show(error.message, { type: 'error' })
    },
  })

  const checkFormValidity = () => {
    const index = channels.findIndex((channel) => !isChannel(channel))
    return index === -1
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    event.stopPropagation()

    if (!checkFormValidity()) {
      return
    }

    submit()
  }

  useEffect(() => {
    if (focusNextRef.current) {
      const id = focusNextRef.current
      focusNextRef.current = null

      const index = channels.findIndex((channel) => channel.id === id)
    }
  }, [channels.length])

  const renderChannels = (channel: Channel, index: number) => {
    return (
      <SortableItem disabled={isFilterMode} key={channel.id} id={channel.id + ''}>
        <span className="px-3 text-sm font-medium">{`${channel.id}`.padStart(4, '0')}</span>

        <span className="w-16 h-9 p-2 bg-gray-700 rounded-sm">{channel.logo && <img className="w-full h-full object-contain" src={channel.logo} alt={channel.name} />}</span>

        <input
          className="w-40 h-8 text-sm border rounded-sm box-border px-3"
          type="text"
          value={channel.name}
          onChange={(event) => handleChannelChange(channel.id, 'name', event.target.value)}
          required
        />

        <div className="w-40 box-border">
          <ClearableSelect value={channel.url} options={channelOptions[index]} onChange={(value) => handleChannelChange(channel.id, 'url', value)} />
        </div>

        <div className="flex-grow box-border">
          <ClearableSelect value={channel.group} options={[]} onChange={(value) => handleChannelChange(channel.id, 'group', value)} />
        </div>

        <button
          onClick={() => prependChannel(index)}
          className="flex-basis h-8 text-sm bg-orange-500 text-white rounded-sm hover:bg-orange-600 px-4"
          aria-label="prepend channel"
          type="button"
        >
          <BarsArrowDownIcon className="h-4 w-4 text-white" />
        </button>

        <button className="flex-basis h-8 text-sm bg-gray-800 text-white rounded-sm hover:bg-gray-900 px-4" aria-label="play channel" type="button">
          <PlayIcon className="h-4 w-4 text-white" />
        </button>

        <button
          onClick={() => removeChannel(channel.id)}
          className="flex-basis h-8 text-sm bg-red-500 text-white rounded-sm hover:bg-red-600 px-4"
          aria-label="Remove ClashRule"
          type="button"
        >
          <TrashIcon className="h-4 w-4 text-white" />
        </button>
      </SortableItem>
    )
  }

  const finalChannels = isFilterMode ? filteredChannels : channels

  return (
    <form onSubmit={handleSubmit} ref={formRef}>
      <FilterBar channels={channels} onFilter={setFilteredChannels} />

      <div className="mx-auto">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={channels.map((channel) => channel.id + '')} strategy={verticalListSortingStrategy}>
            <div className="flex flex-nowrap flex-col gap-2 h-[60vh] overflow-y-auto">
              {channels.map(
                (_, index) =>
                  finalChannels[index] && (
                    <div className="flex" key={finalChannels[index].id}>
                      {renderChannels(finalChannels[index], index)}
                    </div>
                  )
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <footer className="flex gap-2 mt-4">
        <div className="flex flex-col flex-grow">
          <Alert ref={alertRef} />
        </div>

        <div className="flex gap-2 ml-auto">
          <button onClick={autoSelect} className="px-4 py-2 bg-blue-500 cursor-pointer text-sm text-white rounded-sm hover:bg-blue-600" type="button">
            Auto
          </button>

          <button onClick={reset} className="px-4 py-2 bg-gray-500 cursor-pointer text-sm text-white rounded-sm hover:bg-gray-600" type="button">
            Reset
          </button>

          <button
            disabled={submitting}
            className="px-4 py-2 bg-green-500 cursor-pointer text-sm text-white rounded-sm hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
          >
            {submitting ? (
              <span className="w-5 h-5 flex flex-row items-center">
                <Spinner />
              </span>
            ) : (
              'Save'
            )}
          </button>
        </div>
      </footer>
    </form>
  )
}

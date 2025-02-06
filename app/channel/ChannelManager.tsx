'use client'

import { useRequest } from 'ahooks'
import { useMemo, useRef, useState } from 'react'
import type { M3uChannel } from '@iptv/playlist'
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { BarsArrowDownIcon, EyeIcon, TrashIcon, CheckIcon, PlusIcon, ArrowPathIcon } from '@heroicons/react/24/solid'
import SortableItem from '@/components/SortableItem'
import Alert, { type AlertImperativeHandler } from '@/components/Alert'
import { Spinner } from '@/components/Spinner'
import ClearableSelect from '@/components/ClearableSelect'
import type { Channel } from '@/services/playlist/types'
import { isChannel } from '@/services/playlist/types'
import { fuzzyMatch } from '@/utils/fuzzyMatch'
import { putChannels } from '@/app/api/channels/actions'
import { ping } from '@/app/api/m3u/actions'
import { FilterBar } from './FilterBar'

export interface EditorProps {
  channels: Channel[]
  m3uChannels: (M3uChannel & { origin: string })[]
}

export default function ChannelManager(props: EditorProps) {
  const { channels: defaultChannels, m3uChannels } = props
  const [channels, setChannels] = useState([...defaultChannels])
  const [filteredChannels, setFilteredChannels] = useState(channels)
  const alertRef = useRef<AlertImperativeHandler>(null)
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor))
  const formRef = useRef<HTMLFormElement>(null)
  const [status, setStatus] = useState<{ url: string; loading: boolean; valid?: boolean }[]>([])

  const channelOptions = useMemo(() => {
    return channels.map((channel) =>
      Array.from(
        (function* () {
          const urls: string[] = []
          const options = Array.from(
            (function* () {
              for (const { origin, tvgName, name: attName, url } of m3uChannels) {
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

                yield { name: `${origin} ${name}`, url, weight }
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

  const testChannel = async (url: string) => {
    setStatus((prev) => {
      const existingStatus = prev.find((item) => item.url === url)
      if (existingStatus) {
        return prev.map((item) => (item.url === url ? { url, loading: true } : item))
      } else {
        return [...prev, { url, loading: true }]
      }
    })

    try {
      const channel = channels.find((channel) => channel.url === url)
      if (!channel) {
        throw new Error('Channel not found')
      }

      if (!(await ping(url))) {
        throw new Error('Failed to fetch channel')
      }

      alertRef.current?.show('Channel is working', { type: 'success' })
      setStatus((prev) => prev.map((item) => (item.url === url ? { url, loading: false, valid: true } : item)))
    } catch (error) {
      const message = error instanceof Error ? error.message : Object.prototype.toString.call(error)
      alertRef.current?.show(message, { type: 'error' })
      setStatus((prev) => prev.map((item) => (item.url === url ? { url, loading: false, valid: false } : item)))
    }
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

  const autoTest = async () => {
    for (const channel of channels) {
      if (!channel.url) {
        continue
      }

      await testChannel(channel.url)
    }
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

  const channelGroups: string[] = []
  for (const channel of channels) {
    if (channel.group && !channelGroups.includes(channel.group)) {
      channelGroups.push(channel.group)
    }
  }

  const renderChannels = (channel: Channel, index: number) => {
    const channelStatus = status.find((item) => item.url === channel.url)

    return (
      <SortableItem disabled={isFilterMode} key={channel.id} id={channel.id + ''}>
        <span className="px-3 text-sm font-medium">{`${channel.id}`.padStart(4, '0')}</span>

        <span className="w-16 h-9 p-2 bg-gray-700 rounded-sm">{channel.logo && <img className="w-full h-full object-contain" src={channel.logo} alt={channel.name} />}</span>

        <input
          className="w-40 h-8 text-sm border rounded-sm box-border px-3"
          type="text"
          value={channel.name || ''}
          onChange={(event) => handleChannelChange(channel.id, 'name', event.target.value)}
          required
        />

        <div className="w-60 box-border">
          <ClearableSelect value={channel.url} options={channelOptions[index]} onChange={(value) => handleChannelChange(channel.id, 'url', value)} />
        </div>

        <div className="flex-grow">
          <input
            className="h-8 w-full text-sm border rounded-sm box-border px-3"
            value={channel.group || ''}
            list="group-suggestions"
            onChange={(event) => handleChannelChange(channel.id, 'group', event.target.value)}
          />
          <datalist id="group-suggestions">
            {channelGroups.map((group) => (
              <option key={group} value={group} />
            ))}
          </datalist>
        </div>

        <button
          onClick={() => prependChannel(index)}
          className="flex-basis h-8 text-sm bg-orange-500 text-white rounded-sm hover:bg-orange-600 px-4"
          aria-label="prepend channel"
          type="button"
        >
          <BarsArrowDownIcon className="h-4 w-4 text-white" />
        </button>

        <button
          disabled={!channel?.url || channelStatus?.loading}
          onClick={() => channel.url && testChannel(channel.url)}
          className={`flex-basis h-8 text-sm text-white rounded-sm px-4 disabled:opacity-50 disabled:cursor-not-allowed ${
            channelStatus?.valid === false ? 'bg-red-500 hover:bg-red-600' : 'bg-yellow-500 hover:bg-yellow-600'
          }`}
          aria-label="test channel"
          type="button"
        >
          {channelStatus?.loading ? (
            <span className="h-full w-4 inline-block">
              <Spinner />
            </span>
          ) : (
            <EyeIcon className="h-4 w-4 text-white" />
          )}
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
          <button
            onClick={autoSelect}
            className="px-4 py-2 bg-cyan-500 cursor-pointer text-sm text-white rounded-sm hover:bg-cyan-600"
            type="button"
            aria-label="Auto Select"
            title="Auto Select"
          >
            <CheckIcon className="h-5 w-5" />
          </button>

          <button
            onClick={autoTest}
            className="px-4 py-2 bg-yellow-500 cursor-pointer text-sm text-white rounded-sm hover:bg-yellow-600"
            type="button"
            aria-label="Test All"
            title="Test All"
          >
            <EyeIcon className="h-5 w-5" />
          </button>

          <button
            onClick={() => prependChannel(channels.length)}
            className="px-4 py-2 bg-blue-500 cursor-pointer text-sm text-white rounded-sm hover:bg-blue-600"
            type="button"
            aria-label="Add Channel"
            title="Add Channel"
          >
            <PlusIcon className="h-5 w-5" />
          </button>

          <button onClick={reset} className="px-4 py-2 bg-gray-500 cursor-pointer text-sm text-white rounded-sm hover:bg-gray-600" type="button" aria-label="Reset" title="Reset">
            <ArrowPathIcon className="h-5 w-5" />
          </button>

          <button
            disabled={submitting}
            className="px-4 py-2 bg-green-500 cursor-pointer text-sm text-white rounded-sm hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
            aria-label="Save"
            title="Save"
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

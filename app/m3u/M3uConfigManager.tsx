'use client'

import { useRequest } from 'ahooks'
import { useRef, useState } from 'react'
import type { M3uConfig } from '@/services/m3u/types'
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { BarsArrowDownIcon, EyeIcon, TrashIcon, PlusIcon, ArrowPathIcon, RectangleStackIcon } from '@heroicons/react/24/solid'
import SortableItem from '@/components/SortableItem'
import Alert, { type AlertImperativeHandler } from '@/components/Alert'
import { Spinner } from '@/components/Spinner'
import ClearableSelect from '@/components/ClearableSelect'
import { isM3uConfig } from '@/services/m3u/types'
import { ping, putM3uConfigs } from '@/app/api/m3u/actions'
import { FilterBar } from './FilterBar'

export interface EditorProps {
  configs: M3uConfig[]
}

export default function M3uConfigManager(props: EditorProps) {
  const { configs: defaultConfigs } = props
  const [configs, setConfigs] = useState([...defaultConfigs])
  const [filteredConfigs, setFilteredConfigs] = useState(configs)
  const alertRef = useRef<AlertImperativeHandler>(null)
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor))
  const formRef = useRef<HTMLFormElement>(null)
  const [status, setStatus] = useState<{ url: string; loading: boolean; valid?: boolean }[]>([])

  const isFilterMode = filteredConfigs.length !== configs.length

  const handleDragEnd = (event: any) => {
    const { active, over } = event
    if (active.id !== over.id) {
      setConfigs((prev) =>
        arrayMove(
          prev,
          prev.findIndex((item) => item.id === parseInt(active.id, 10)),
          prev.findIndex((item) => item.id === parseInt(over.id, 10))
        )
      )
    }
  }

  const handleM3uConfigChange = (id: number, field: string, value: string | number | boolean) => {
    setConfigs((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const testM3uConfig = async (url: string) => {
    setStatus((prev) => {
      const existingStatus = prev.find((item) => item.url === url)
      if (existingStatus) {
        return prev.map((item) => (item.url === url ? { url, loading: true } : item))
      } else {
        return [...prev, { url, loading: true }]
      }
    })

    try {
      const config = configs.find((config) => config.url === url)
      if (!config) {
        throw new Error('M3U Config not found')
      }

      if (!(await ping(url))) {
        throw new Error('Failed to fetch M3U Config')
      }

      alertRef.current?.show('M3U Config is working', { type: 'success' })
      setStatus((prev) => prev.map((item) => (item.url === url ? { url, loading: false, valid: true } : item)))
    } catch (error) {
      const message = error instanceof Error ? error.message : Object.prototype.toString.call(error)
      alertRef.current?.show(message, { type: 'error' })
      setStatus((prev) => prev.map((item) => (item.url === url ? { url, loading: false, valid: false } : item)))
    }
  }

  const prependM3uConfig = (index: number) => {
    const maxNumber = configs.reduce((acc, config) => (config.id > acc ? config.id : acc), 0)
    const id = maxNumber + 1
    const newM3uConfig: M3uConfig = { id, name: '', url: '' }

    setConfigs((prev) => {
      const cloned = [...prev]
      cloned.splice(index + 1, 0, newM3uConfig)
      return cloned
    })
  }

  const reset = () => {
    setConfigs([...defaultConfigs])
    setFilteredConfigs([...defaultConfigs])
  }

  const removeM3uConfig = (id: number) => {
    if (!confirm(`Are you sure you want to remove this M3U Config?`)) {
      return
    }

    setConfigs((prev) => prev.filter((item) => item.id !== id))
  }

  const autoTest = async () => {
    for (const config of configs) {
      if (!config.url) {
        continue
      }

      await testM3uConfig(config.url)
    }
  }

  const { run: submit, loading: submitting } = useRequest(() => putM3uConfigs(configs), {
    manual: true,
    onSuccess: () => {
      alertRef.current?.show('Save Success')
    },
    onError: (error) => {
      alertRef.current?.show(error.message, { type: 'error' })
    },
  })

  const checkFormValidity = () => {
    const index = configs.findIndex((config) => !isM3uConfig(config))
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

  const renderM3uConfigs = (config: M3uConfig, index: number) => {
    const m3uConfigStatus = status.find((item) => item.url === config.url)

    const enableOptions = [
      { label: 'Enable', value: true },
      { label: 'Disable', value: false },
    ]

    const httpsOptions = [
      { label: 'Force Https', value: true },
      { label: 'Disable', value: false },
    ]

    return (
      <SortableItem disabled={isFilterMode} key={config.id} id={config.id + ''}>
        <input
          className="h-8 text-sm border rounded-sm box-border px-3"
          type="text"
          value={config.name || ''}
          onChange={(event) => handleM3uConfigChange(config.id, 'name', event.target.value)}
          title="Name cannot contain punctuation"
          required
        />

        <input
          className="flex-grow h-8 text-sm border rounded-sm box-border px-3"
          type="url"
          value={config.url || ''}
          onChange={(event) => handleM3uConfigChange(config.id, 'url', event.target.value)}
          pattern="https?://.+"
          title="Please enter a valid URL"
          required
        />

        <div className="box-border">
          <ClearableSelect
            value={typeof config.enable === 'boolean' ? config.enable.toString() : 'true'}
            enableClear={false}
            options={enableOptions}
            onChange={(value) => handleM3uConfigChange(config.id, 'enable', value === 'true')}
          />
        </div>

        <div className="box-border">
          <ClearableSelect
            value={typeof config.https === 'boolean' ? config.https.toString() : 'false'}
            enableClear={false}
            options={httpsOptions}
            onChange={(value) => handleM3uConfigChange(config.id, 'https', value === 'true')}
          />
        </div>

        <button
          onClick={() => prependM3uConfig(index)}
          className="flex-basis h-8 text-sm bg-orange-500 text-white rounded-sm hover:bg-orange-600 px-4"
          aria-label="prepend config"
          type="button"
        >
          <BarsArrowDownIcon className="h-4 w-4 text-white" />
        </button>

        <button
          disabled={!config?.url || m3uConfigStatus?.loading}
          onClick={() => config.url && testM3uConfig(config.url)}
          className={`flex-basis h-8 text-sm text-white rounded-sm px-4 disabled:opacity-50 disabled:cursor-not-allowed ${
            m3uConfigStatus?.valid === false ? 'bg-red-500 hover:bg-red-600' : m3uConfigStatus?.valid === true ? 'bg-green-500 hover:bg-green-600' : 'bg-yellow-500 hover:bg-yellow-600'
          }`}
          aria-label="test config"
          type="button"
        >
          {m3uConfigStatus?.loading ? (
            <span className="h-full w-4 inline-block">
              <Spinner />
            </span>
          ) : (
            <EyeIcon className="h-4 w-4 text-white" />
          )}
        </button>

        <button
          onClick={() => removeM3uConfig(config.id)}
          className="flex-basis h-8 text-sm bg-red-500 text-white rounded-sm hover:bg-red-600 px-4"
          aria-label="Remove M3uConfig"
          type="button"
        >
          <TrashIcon className="h-4 w-4 text-white" />
        </button>
      </SortableItem>
    )
  }

  const finalConfigs = isFilterMode ? filteredConfigs : configs

  return (
    <form onSubmit={handleSubmit} ref={formRef}>
      <FilterBar configs={configs} onFilter={setFilteredConfigs} />

      <div className="mx-auto">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={finalConfigs.map((config) => config.id + '')} strategy={verticalListSortingStrategy}>
            <div className="flex flex-nowrap flex-col gap-2 h-[60vh] overflow-y-auto">
              {finalConfigs.map((config, index) => (
                <div className="flex" key={config.id}>
                  {renderM3uConfigs(config, index)}
                </div>
              ))}
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
            onClick={autoTest}
            className="px-4 py-2 bg-cyan-500 cursor-pointer text-sm text-white rounded-sm hover:bg-cyan-600"
            type="button"
            aria-label="Test All"
            title="Test All"
          >
            <RectangleStackIcon className="h-5 w-5" />
          </button>

          <button
            onClick={() => prependM3uConfig(configs.length)}
            className="px-4 py-2 bg-blue-500 cursor-pointer text-sm text-white rounded-sm hover:bg-blue-600"
            type="button"
            aria-label="Add Config"
            title="Add Config"
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

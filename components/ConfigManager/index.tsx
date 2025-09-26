import React, { useState, useRef } from 'react'
import { useRequest } from 'ahooks'
import { DndContext, useSensor, useSensors, closestCenter, PointerSensor, KeyboardSensor } from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { PlusIcon, ArrowPathIcon } from '@heroicons/react/24/solid'
import Alert, { type AlertImperativeHandler } from '@/components/Alert'
import { Spinner } from '@/components/Spinner'
import SortableItem from './SortableItem'
import { FilterBar } from './FilterBar'
import type { Config, ConfigSchema } from './types'
import { fuzzySearch } from '@/utils/find'

export interface ConfigManagerProps<T extends Config> {
  configs: T[]
  onSubmit?: (configs: T[]) => Promise<void>
  configSchema: { [K in keyof T]: ConfigSchema<T[K]> }
}

export default function ConfigManager<T extends Config>(props: ConfigManagerProps<T>) {
  const { configs: defaultConfigs, configSchema, onSubmit } = props

  const [configs, setConfigs] = useState([...defaultConfigs])
  const [filteredConfigs, setFilteredConfigs] = useState(configs)

  const alertRef = useRef<AlertImperativeHandler>(null)
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor))
  const formRef = useRef<HTMLFormElement>(null)

  const isFilterMode = filteredConfigs.length !== configs.length

  const handleDragEnd = (event: any) => {
    const { active, over } = event
    if (active.id !== over.id) {
      setConfigs((prev) =>
        arrayMove(
          prev,
          prev.findIndex((item) => item.id === active.id),
          prev.findIndex((item) => item.id === over.id)
        )
      )
    }
  }

  const prependConfig = (index: number) => {
    const id = crypto.randomUUID()
    const newConfig = { id } as T

    setConfigs((prev) => {
      const cloned = [...prev]
      cloned.splice(index + 1, 0, newConfig)
      return cloned
    })
  }

  const handleConfigChange = (id: string, field: string, value: any) => {
    setConfigs((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const reset = () => {
    setConfigs([...defaultConfigs])
    setFilteredConfigs([...defaultConfigs])
  }

  const handleFilter = (filterOptions: Omit<Config, 'id'>) => {
    configs.filter((config) => {
      Object.keys(filterOptions).some((field) => {
        if (!(field in config)) {
          return false
        }

        const match = (filterOptions as Record<string, unknown>)[field]
        const item = (config as Record<string, unknown>)[field]
        if (typeof item === 'string' && typeof match === 'string') {
          return fuzzySearch(match, item)
        }

        return match === item
      })

      return true
    })
  }

  const { run: handleSubmit, loading: submitting } = useRequest(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      event.stopPropagation()

      if (onSubmit) {
        await onSubmit(configs)
      }
    },
    {
      manual: true,
      debounceWait: 500,
      onSuccess: () => {
        alertRef.current?.show('Config saved successfully', {
          type: 'success',
        })
      },
      onError: (error) => {
        const message = error instanceof Error ? error.message : Object.prototype.toString.call(error)
        alertRef.current?.show(message, { type: 'error' })
      },
    }
  )

  const renderConfigs = (config: T) => {
    const id = config.id
    return (
      <SortableItem id={id} key={id}>
        {Object.keys(configSchema).map((field) => {
          const value = field in config ? (config as any)[field] : ''
          const Component = configSchema[field as keyof T][field]
          return <Component value={value} onChange={(value) => handleConfigChange(id, field, value)} />
        })}
      </SortableItem>
    )
  }

  const finalConfigs = isFilterMode ? filteredConfigs : configs

  return (
    <form onSubmit={handleSubmit} ref={formRef}>
      <FilterBar schema={configSchema} onFilter={handleFilter} />

      <div className="mx-auto">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={configs.map((config) => config.id + '')} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {finalConfigs.map((config) => (
                <div className="flex" key={config.id}>
                  {renderConfigs(config)}
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
            onClick={() => prependConfig(configs.length)}
            className="px-4 py-2 bg-indigo-500 cursor-pointer text-sm text-white rounded-sm hover:bg-indigo-600"
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

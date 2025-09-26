import { useState } from 'react'
import { BackspaceIcon } from '@heroicons/react/24/solid'
import type { Config, ConfigSchema } from './types'

export interface FilterBarProps<T extends Omit<Config, 'id'>> {
  schema: { [K in keyof T]: ConfigSchema<T[K]> }
  onFilter?: (filter: Record<string, any>) => void
}

export function FilterBar<T extends Omit<Config, 'id'>>(props: FilterBarProps<T>) {
  const { schema, onFilter } = props
  const [filter, setFilter] = useState<Record<string, any>>()

  const handleFilter = (field: string, value: any) => {
    setFilter((prev) => {
      const nextValue = { ...prev, [field]: value } as any
      onFilter && onFilter(nextValue)
      return nextValue
    })
  }

  return (
    <div className="flex gap-2 justify-start sm:justify-end overflow-x-auto mb-2 p-2 sm:pb-2 bg-gray-100 rounded-sm shadow-md">
      {Object.keys(schema).map((field) => {
        const value = filter?.[field]
        const Component = schema[field as keyof T][field]
        return <Component value={value} onChange={(value) => handleFilter(field, value)} />
      })}

      <button className="h-8 flex items-center justify-center text-sm border-gray-300 border rounded-sm box-border px-3" type="button">
        <BackspaceIcon className="h-4 w-4 text-grxay-500" />
      </button>
    </div>
  )
}

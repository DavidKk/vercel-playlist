export interface Config {
  id: string
}

export interface ConfigSchemaFCProps<T> {
  value: T
  onChange: (value: T) => void
}

export type ConfigSchemaFC<T> = React.FC<ConfigSchemaFCProps<T>>

export interface ConfigSchema<T> {
  [key: string]: ConfigSchemaFC<T>
}

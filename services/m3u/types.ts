export interface M3uConfig {
  id: number
  name: string
  url: string
  enable?: boolean
}

export type M3uConfigCollection = M3uConfig[]

export function isM3uConfig(obj: any): obj is M3uConfig {
  return obj && typeof obj.id === 'number' && typeof obj.name === 'string' && typeof obj.url === 'string'
}

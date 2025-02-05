export interface Channel {
  id: number
  name: string
  logo?: string
  url?: string
  group?: string
}

export function isChannel(obj: any): obj is Channel {
  return obj && typeof obj.id === 'number' && typeof obj.name === 'string'
}

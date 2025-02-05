export interface IStreamCache {
  cachedChunks: Uint8Array[]
  isComplete: boolean
  timestamp: number
}

export interface Channel {
  id: number
  name: string
  logo: string
}

export interface EPGTV {
  channel: EPGTVChannel[]
  programme: EPGTVProgramme[]
}

export interface EPGTVChannel {
  $_id: string
  'display-name': EPGTVChannelDisplayName | string
  icon?: EPGTVIcon
  live?: string
  active?: string
  _originId?: string
}

export interface EPGTVChannelDisplayName {
  $_lang?: string
  '#text': string
}

export interface EPGTVProgramme {
  $_channel: string
  $_start: string
  $_stop: string
  title: EPGTVTitle
  icon?: EPGTVIcon
  credits?: string
  video?: string
  date?: string
}

export interface EPGTVTitle {
  $_lang?: string
  '#text': string
}

export interface EPGTVIcon {
  $_src: string
  $_height?: string
  $_width?: string
}

export function getChannelName(channel: EPGTVChannel) {
  const displayName = channel['display-name']
  if (typeof displayName === 'object') {
    return displayName['#text']
  }

  if (typeof displayName === 'string') {
    return displayName
  }

  return Object.prototype.toString.call(displayName)
}

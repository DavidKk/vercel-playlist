import { XMLBuilder, XMLParser } from 'fast-xml-parser'
import type { EPGTVChannel, EPGTVProgramme } from './types'

// Constants for XML structure
const XML_OPEN_TAG = '<?xml version="1.0" encoding="UTF-8"?><tv>'
const XML_CLOSE_TAG = '</tv>'
const CHANNEL_OPEN_TAG = '<channel'
const CHANNEL_CLOSE_TAG = '</channel>'
const PROGRAMME_OPEN_TAG = '<programme'
const PROGRAMME_CLOSE_TAG = '</programme>'

// Initialize XML parser and builder with options
const Parser = new XMLParser({
  /** Preserve XML attributes during parsing */
  ignoreAttributes: false,
  /** Prefix to distinguish attributes */
  attributeNamePrefix: '$_',
})

const Builder = new XMLBuilder({
  /** Preserve XML attributes during XML building */
  ignoreAttributes: false,
  /** Format output XML for readability */
  format: true,
  /** Prefix to distinguish attributes */
  attributeNamePrefix: '$_',
})

/** Options for configuring the EPG stream processing */
export interface PipeEPGStreamOptions extends ProcessEPGStreamOptions {
  /** Function to filter channels */
  filterChannels?: (channel: EPGTVChannel) => boolean
  /** Function to transform channel IDs */
  tranformOriginChannelId?: (channel: EPGTVChannel) => string
}

// Processes an EPG XML stream, filtering and transforming channels/programmes
export function pipeEPGStream(stream: ReadableStream, options?: PipeEPGStreamOptions) {
  const { filterChannels, tranformOriginChannelId, onClose, signal } = options || {}

  /** Buffer to store incoming XML chunks */
  let xmlBuffer = ''

  /** Map to track unique channel IDs */
  const channelIds = new Map<string, string>()

  /** Function to process XML stream chunks */
  const { start, pull } = processEpgStream(
    stream,
    (chunk, push: (content: string) => void) => {
      // Accumulate chunks and remove line breaks
      xmlBuffer += chunk.replaceAll('\n', '')

      // Extract <channel> elements and process them
      const channels = extractChannels(xmlBuffer)
      if (channels && channels.length) {
        const filteredChannels: EPGTVChannel[] = []
        for (const channel of channels) {
          if (filterChannels && !filterChannels(channel)) {
            // Skip filtered channels
            continue
          }

          const channelId = channel.$_id
          const originId = tranformOriginChannelId ? tranformOriginChannelId(channel) : channelId
          if (channelIds.has(originId)) {
            // Avoid duplicate IDs
            continue
          }

          filteredChannels.push({ ...channel, _originId: undefined })
          // Map original to transformed ID
          originId && channelIds.set(originId, channelId)
        }

        if (filteredChannels.length > 0) {
          const channelXML: string = Builder.build({ channel: filteredChannels })
          push(channelXML)
        }
      }

      // Extract and process <programme> elements
      const programmes = extractProgrammes(xmlBuffer)
      if (programmes && programmes.length) {
        const originIds = Array.from(channelIds.entries())

        const filteredProgrammes: EPGTVProgramme[] = []
        for (const programme of programmes) {
          const originId = programme.$_channel
          if (!originId) {
            continue
          }

          const target = originIds.find(([id]) => id === originId)
          if (!target) {
            continue
          }

          const [, channelId] = target
          // Replace channel ID with transformed ID
          programme.$_channel = channelId
          filteredProgrammes.push(programme)
        }

        if (filteredProgrammes.length > 0) {
          const programmeXML: string = Builder.build({ programme: filteredProgrammes })
          push(programmeXML)
        }
      }

      // Remove end of </channel> and </programme> tags from buffer
      const lastRelevantIndex = Math.max(xmlBuffer.lastIndexOf(CHANNEL_CLOSE_TAG), xmlBuffer.lastIndexOf(PROGRAMME_CLOSE_TAG))
      if (lastRelevantIndex !== -1) {
        const length = Math.max(CHANNEL_CLOSE_TAG.length, PROGRAMME_CLOSE_TAG.length)
        xmlBuffer = xmlBuffer.slice(lastRelevantIndex + length)
      }
    },
    { onClose, signal }
  )

  return new ReadableStream({ start, pull })
}

// Options for stream transformation
interface ProcessEPGStreamOptions {
  /** Callback for when the stream is closed */
  onClose?: () => void
  /** Abort signal to cancel the stream processing */
  signal?: AbortSignal
}

// Transforms an EPG XML stream, calling `handle` for each chunk
function processEpgStream(stream: ReadableStream, handle: (part: string, push: (content: string) => void) => void, options?: ProcessEPGStreamOptions) {
  const { onClose, signal } = options || {}

  const reader = stream.getReader()

  const start = async (controller: ReadableStreamDefaultController<Uint8Array>) => {
    const startBuffer = new TextEncoder().encode(XML_OPEN_TAG)
    controller.enqueue(startBuffer)
  }

  const pull = async (controller: ReadableStreamDefaultController<Uint8Array>) => {
    try {
      while (true) {
        if (signal?.aborted) {
          // eslint-disable-next-line no-console
          console.warn('Stream processing aborted.')
          break
        }

        const { done, value } = await reader.read()
        if (done) {
          break
        }

        const chunk = new TextDecoder().decode(value)
        handle(chunk, (content) => {
          if (typeof content !== 'string') {
            return
          }

          const buffer = new TextEncoder().encode(content)
          controller.enqueue(buffer)
        })
      }
    } catch (error) {
      if (signal?.aborted) {
        // eslint-disable-next-line no-console
        console.warn('Stream reading stopped due to client disconnect.')
      } else {
        const reason = error instanceof Error ? error?.message : Object.prototype.toString.call(error)
        // eslint-disable-next-line no-console
        console.error(`Error processing stream ${reason}`)
      }
    } finally {
      reader.releaseLock()
    }

    const endBuffer = new TextEncoder().encode(XML_CLOSE_TAG)
    controller.enqueue(endBuffer)
    controller.close()

    if (typeof onClose === 'function') {
      onClose()
    }
  }

  return { start, pull }
}

/** Extracts <programme> tags from XML content */
function extractProgrammes(content: string) {
  const lastProgrammeCloseIndex = content.lastIndexOf(PROGRAMME_CLOSE_TAG)
  if (lastProgrammeCloseIndex === -1) {
    return
  }

  const firstProgrammeOpenIndex = content.indexOf(PROGRAMME_OPEN_TAG)
  if (firstProgrammeOpenIndex === -1) {
    return
  }

  const completeProgrammeBlock = content.slice(firstProgrammeOpenIndex, lastProgrammeCloseIndex + PROGRAMME_CLOSE_TAG.length)
  if (!completeProgrammeBlock) {
    return
  }

  const programmeXML = extractTags(completeProgrammeBlock, PROGRAMME_OPEN_TAG, PROGRAMME_CLOSE_TAG)
  if (!programmeXML) {
    return
  }

  const parsedProgrammeData: { programme: EPGTVProgramme | EPGTVProgramme[] } = Parser.parse(programmeXML)
  let programmes = parsedProgrammeData?.programme || []
  if (!Array.isArray(programmes)) {
    programmes = [programmes]
  }

  return programmes
}

/** Extracts <channel> tags from XML content */
function extractChannels(content: string) {
  const lastChannelCloseIndex = content.lastIndexOf(CHANNEL_CLOSE_TAG)
  if (lastChannelCloseIndex === -1) {
    return
  }

  const firstChannelOpenIndex = content.indexOf(CHANNEL_OPEN_TAG)
  if (firstChannelOpenIndex === -1) {
    return
  }

  const completeChannelBlock = content.slice(firstChannelOpenIndex, lastChannelCloseIndex + CHANNEL_CLOSE_TAG.length)
  if (!completeChannelBlock) {
    return
  }

  const channelXML = extractTags(completeChannelBlock, CHANNEL_OPEN_TAG, CHANNEL_CLOSE_TAG)
  if (!channelXML) {
    return
  }

  const parsedChannelData: { channel: EPGTVChannel | EPGTVChannel[] } = Parser.parse(channelXML)
  let channels = parsedChannelData?.channel || []
  if (!Array.isArray(channels)) {
    channels = [channels]
  }

  return channels
}

/** Extracts XML tags and their content from a string */
function extractTags(content: string, openTag: string, closeTag: string) {
  const regex = new RegExp(`${openTag}.*?${closeTag}`, 'g')
  const matches = content.match(regex) || []
  return matches.join('')
}

import { pipeEPGStream } from '@/services/epg/process'

const EPG_CONTENT = `<?xml version="1.0" encoding="UTF-8"?>
<tv generator-info-name="Threadfin" source-info-name="Threadfin - 1.2.23">
  <programme channel="1030" start="20250107040000 +0800" stop="20250107044000 +0800">
    <title lang="zh">纪录中国故事</title>
    <icon height="" src="https://live.fanmingming.com/tv/广西卫视.png" width=""></icon>
    <credits></credits>
    <video></video>
    <date></date>
  </programme>
  <channel id="1030">
    <display-name>广西卫视</display-name>
    <icon src="https://live.fanmingming.com/tv/广西卫视.png"></icon>
    <live>false</live>
    <active>true</active>
  </channel>
  <programme channel="1030" start="20250107003000 +0800" stop="20250107013000 +0800">
      <title lang="zh">传奇剧场39集：密查(10)</title>
      <icon height="" src="https://live.fanmingming.com/tv/广西卫视.png" width=""></icon>
      <credits></credits>
      <video></video>
      <date></date>
  </programme>
  <programme channel="1030" start="20250107013000 +0800" stop="20250107020000 +0800">
    <title lang="zh">重播:遇见好书</title>
    <icon height="" src="https://live.fanmingming.com/tv/广西卫视.png" width=""></icon>
    <credits></credits>
    <video></video>
    <date></date>
  </programme>
  <channel id="1000">
    <display-name>[BAK]翡翠台</display-name>
    <icon src="https://s2.loli.net/2024/12/22/gWrIwCqpHTAtuXZ.png"></icon>
    <live>false</live>
    <active>true</active>
  </channel>
  <programme channel="1000" start="20250107000000 +0800" stop="20250107010000 +0800">
    <title lang="zh">宣傳易[粵]</title>
    <icon height="" src="https://s2.loli.net/2024/12/22/gWrIwCqpHTAtuXZ.png" width=""></icon>
    <credits></credits>
    <video></video>
    <date></date>
  </programme>
  <programme channel="1000" start="20250107010000 +0800" stop="20250107013000 +0800">
    <title lang="zh">東張西望[粵]</title>
    <icon height="" src="https://s2.loli.net/2024/12/22/gWrIwCqpHTAtuXZ.png" width=""></icon>
    <credits></credits>
    <video></video>
    <date></date>
  </programme>
</tv>
`

describe('pipeEPGStream', () => {
  describe('normal test', () => {
    it('should process EPG stream correctly and extract channels and programmes', async () => {
      const stream = stringToChunkedReadableStream(EPG_CONTENT, 4096)
      const reader = pipeEPGStream(stream)
      const readerOutput = []

      const readerStream = reader.getReader()
      while (true) {
        const { value, done } = await readerStream.read()
        if (done) break
        readerOutput.push(new TextDecoder().decode(value))
      }

      const xmlContent = readerOutput.join('')
      expect(xmlContent).toContain('<channel id="1030">')
      expect(xmlContent).toContain('<channel id="1000">')
      expect(xmlContent).toContain('<programme channel="1030" start="20250107003000 +0800" stop="20250107013000 +0800">')
      expect(xmlContent).toContain('<programme channel="1000" start="20250107000000 +0800" stop="20250107010000 +0800">')
    })

    it('should filter channels based on user-defined conditions', async () => {
      const stream = stringToChunkedReadableStream(EPG_CONTENT)
      const reader = pipeEPGStream(stream, {
        filterChannels: (channel) => channel.$_id === '1000',
      })

      const readerOutput = []
      const readerStream = reader.getReader()
      while (true) {
        const { value, done } = await readerStream.read()
        if (done) break
        readerOutput.push(new TextDecoder().decode(value))
      }

      const xmlContent = readerOutput.join('')
      expect(xmlContent).not.toContain('<channel id="1030">')
      expect(xmlContent).toContain('<channel id="1000">')
    })
  })

  describe('boundary test', () => {
    it('should handle empty stream gracefully', async () => {
      const stream = stringToChunkedReadableStream('', 4096)
      const reader = pipeEPGStream(stream)
      const readerOutput = []

      const readerStream = reader.getReader()
      while (true) {
        const { value, done } = await readerStream.read()
        if (done) break
        readerOutput.push(new TextDecoder().decode(value))
      }

      const xmlContent = readerOutput.join('')
      expect(xmlContent).toBe('<?xml version="1.0" encoding="UTF-8"?><tv></tv>')
    })

    it('should handle stream with invalid XML', async () => {
      const stream = stringToChunkedReadableStream('invalid XML', 4096)
      const reader = pipeEPGStream(stream)
      const readerOutput = []

      const readerStream = reader.getReader()
      while (true) {
        const { value, done } = await readerStream.read()
        if (done) break
        readerOutput.push(new TextDecoder().decode(value))
      }

      const xmlContent = readerOutput.join('')
      expect(xmlContent).toBe('<?xml version="1.0" encoding="UTF-8"?><tv></tv>')
    })

    it('should handle stream with missing channel elements', async () => {
      const stream = stringToChunkedReadableStream('<tv><programme></programme></tv>', 4096)
      const reader = pipeEPGStream(stream)
      const readerOutput = []

      const readerStream = reader.getReader()
      while (true) {
        const { value, done } = await readerStream.read()
        if (done) break
        readerOutput.push(new TextDecoder().decode(value))
      }

      const xmlContent = readerOutput.join('')
      expect(xmlContent).not.toContain('<channel>')
    })
  })
})

function stringToChunkedReadableStream(content: string, chunkSize = content.length) {
  let position = 0

  return new ReadableStream({
    start(controller) {
      function pushChunk() {
        if (position < content.length) {
          const chunk = content.slice(position, position + chunkSize)
          controller.enqueue(new TextEncoder().encode(chunk))
          position += chunkSize
          setTimeout(pushChunk, 100)
        } else {
          controller.close()
        }
      }

      pushChunk()
    },
  })
}

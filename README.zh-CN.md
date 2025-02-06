需要在对应 gist 上增加如下文件。`*.schema.json` 除外。

```channel.schema.json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "id": {
        "type": "integer",
        "description": "Unique identifier for the channel"
      },
      "name": {
        "type": "string",
        "description": "Name of the channel"
      },
      "url": {
        "type": "string",
        "description": "URL link of the channel",
        "format": "uri"
      },
      "logo": {
        "type": "string",
        "description": "URL of the channel's logo",
        "format": "uri"
      },
      "group": {
        "type": "string",
        "description": "Group the channel belongs to"
      }
    },
    "required": ["id", "name"],
    "additionalProperties": false
  }
}
```

```channel.json
[]
```

```m3u.schema.json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "description": "Name of the channel"
      },
      "url": {
        "type": "string",
        "description": "URL link to the channel's M3U playlist",
        "format": "uri"
      }
    },
    "required": ["name", "url"],
    "additionalProperties": false
  }
}
```

```m3u.json
[]
```

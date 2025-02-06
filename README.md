[![Build Status](https://github.com/DavidKk/vercel-web-scripts/actions/workflows/coverage.workflow.yml/badge.svg)](https://github.com/DavidKk/vercel-web-scripts/actions/workflows/coverage.workflow.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

# Vercel Playlist

Mainly used for managing and deploying custom IPTV playlists.

## Features

- **Channel Management**: Centrally manage IPTV channels, support online modification and instant synchronization.
- **M3U Configuration Management**: Automatically generate M3U playlist entries, support multiple configuration management.
- **EPG Auto Matching**: Automatically match the program guide, extract the program guide through the stream to avoid Vercel resource limitations.

## Security Notes

- Playlist content is stored in private GitHub Gist, but GitHub employees and anyone with account access can still view the content.
- **Do not store any sensitive information** (such as API keys, passwords, etc.), it is recommended to use it only for non-sensitive functional scripts.
- Ensure the Gist Token has minimal permissions (only need gist scope) and rotate the keys regularly.

## Deploy to Vercel

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FDavidKk%2Fvercel-web-scripts)

### Environment Variable Configuration

Refer to the [`.env.example`](./.env.example) file to set the required environment variables.

- `GIST_ID`: GitHub Gist Id
- `GIST_TOKEN`: GitHub Gist Token
- `ACCESS_USERNAME`: Admin Username
- `ACCESS_PASSWORD`: Admin Password
- `ACCESS_2FA_SECRET`: 2FA Secret, can generate TOKEN using [https://vercel-2fa.vercel.app](https://vercel-2fa.vercel.app)
- `JWT_SECRET`: JWT Secret
- `JWT_EXPIRES_IN`: JWT Token Expiration Time

## Quick Start

1. Create a **GitHub Gist** and generate a **GitHub Access Token** (with gist permission).
2. Set the corresponding environment variables in Vercel.
3. Once deployed, you can manage playlists through the generated configuration (recommended to use in non-public network environments).
4. Add the following files to the corresponding gist, excluding `*.schema.json`.

**channel.schema.json**

```json
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

**channel.json**

```json
[]
```

**m3u.schema.json**

```json
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

**m3u.json**

```json
[]
```

[![Build Status](https://github.com/DavidKk/vercel-web-scripts/actions/workflows/coverage.workflow.yml/badge.svg)](https://github.com/DavidKk/vercel-web-scripts/actions/workflows/coverage.workflow.yml) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![中文](https://img.shields.io/badge/%E6%96%87%E6%A1%A3-%E4%B8%AD%E6%96%87-green?style=flat-square&logo=docs)](https://github.com/DavidKk/vercel-playlist/blob/main/README.zh-CN.md) [![English](https://img.shields.io/badge/docs-English-green?style=flat-square&logo=docs)](https://github.com/DavidKk/vercel-playlist/blob/main/README.md)

# Vercel Playlist

主要用于管理和部署自定义的 IPTV 播放列表。

## 功能

- **频道管理**：集中管理 IPTV 频道，支持在线修改并即时同步。
- **M3U 配置管理**：自动生成 M3U 播放列表入口，支持多配置管理。
- **EPG自动匹配**：自动匹配节目表，通过流截取节目表避免 Vercel 资源限制。

## 安全注意事项

- 播放列表内容存储在私有 GitHub Gist 中，但 GitHub 员工和任何有账户访问权限的人仍然可以查看内容。
- **不要存储任何敏感信息**（如 API 密钥、密码等），建议仅用于非敏感功能脚本。
- 确保 Gist Token 具有最小权限（仅需要 gist 范围），并定期轮换密钥。

## 部署到 Vercel

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FDavidKk%2Fvercel-web-scripts)

### 环境变量配置

参考 [`.env.example`](./.env.example) 文件设置所需的环境变量。

- `GIST_ID`: GitHub Gist Id
- `GIST_TOKEN`: GitHub Gist Token
- `ACCESS_USERNAME`: 管理员用户名
- `ACCESS_PASSWORD`: 管理员密码
- `ACCESS_2FA_SECRET`: 2FA 密钥，可以使用 [https://vercel-2fa.vercel.app](https://vercel-2fa.vercel.app) 生成 TOKEN
- `JWT_SECRET`: JWT 密钥
- `JWT_EXPIRES_IN`: JWT Token 过期时间

## 快速开始

1. 创建一个 **GitHub Gist** 并生成一个 **GitHub 访问令牌**（具有 gist 权限）。
2. 在 Vercel 中设置相应的环境变量。
3. 部署后，您可以通过生成的配置管理播放列表（建议在非公共网络环境中使用）。
4. 在对应 gist 上增加如下文件。`*.schema.json` 除外。

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

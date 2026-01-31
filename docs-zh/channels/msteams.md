---
summary: 'Microsoft Teams bot support status, capabilities, and configuration'
read_when:
  - Working on MS Teams channel features
---
# Microsoft Teams（插件）

> “凡进入此地者，放弃一切希望。”


更新日期：2026-01-21

状态：支持文本和DM附件；频道/群组文件发送需要`sharePointSiteId` + Graph权限（参见[在群聊中发送文件](#sending-files-in-group-chats)）。投票通过自适应卡片发送。

## 插件要求
Microsoft Teams作为插件提供，不包含在核心安装中。

**重大变更（2026.1.15）：** MS Teams已从核心移出。如果您使用它，必须安装插件。

解释：这使核心安装更轻量，并允许MS Teams依赖项独立更新。

通过CLI（npm注册表）安装：
```bash
openclaw plugins install @openclaw/msteams
```

本地检出（从git仓库运行时）：
```bash
openclaw plugins install ./extensions/msteams
```

如果您在配置/入职期间选择Teams并检测到git检出，
OpenClaw将自动提供本地安装路径。

详情：[插件](/plugin)

## 快速设置（初学者）
1) 安装Microsoft Teams插件。
2) 创建一个**Azure机器人**（应用程序ID + 客户端密钥 + 租户ID）。
3) 使用这些凭据配置OpenClaw。
4) 通过公共URL或隧道公开`/api/messages`（默认端口3978）。
5) 安装Teams应用包并启动网关。

最小配置：
```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      appPassword: "<APP_PASSWORD>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" }
    }
  }
}
```
注意：默认情况下，群聊被阻止(`channels.msteams.groupPolicy: "allowlist"`)。要允许群组回复，设置`channels.msteams.groupAllowFrom`（或使用`groupPolicy: "open"`允许任何成员，但需提及）。

## 目标
- 通过Teams的私信、群聊或频道与OpenClaw对话。
- 保持路由确定性：回复始终返回到消息到达的频道。
- 默认采用安全的频道行为（除非另行配置，否则需要提及）。

## 配置写入
默认情况下，Microsoft Teams被允许写入由`/config set|unset`触发的配置更新（需要`commands.config: true`）。

禁用方法：
```json5
{
  channels: { msteams: { configWrites: false } }
}
```

## 访问控制（私信+群组）

**私信访问**
- 默认：`channels.msteams.dmPolicy = "pairing"`。未知发件人会被忽略，直到获得批准。
- `channels.msteams.allowFrom`接受AAD对象ID、UPN或显示名称。向导会在凭据允许的情况下通过Microsoft Graph将名称解析为ID。

**群组访问**
- 默认：`channels.msteams.groupPolicy = "allowlist"`（除非您添加`groupAllowFrom`，否则被阻止）。使用`channels.defaults.groupPolicy`在未设置时覆盖默认值。
- `channels.msteams.groupAllowFrom`控制哪些发件人在群聊/频道中可以触发（回退到`channels.msteams.allowFrom`）。
- 设置`groupPolicy: "open"`以允许任何成员（默认仍需提及）。
- 要允许**无频道**，设置`channels.msteams.groupPolicy: "disabled"`。

示例：
```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["user@org.com"]
    }
  }
}
```

**Teams + 频道白名单**
- 通过在`channels.msteams.teams`下列出团队和频道来限制群组/频道回复。
- 密钥可以是团队ID或名称；频道密钥可以是对话ID或名称。
- 当`groupPolicy="allowlist"`和团队白名单存在时，只有列出的团队/频道被接受（需提及）。
- 配置向导接受`Team/Channel`条目并为您存储。
- 在启动时，OpenClaw会将团队/频道和用户白名单名称解析为ID（在Graph权限允许的情况下），并记录映射；未解析的条目按原样保留。

示例：
```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      teams: {
        "My Team": {
          channels: {
            "General": { requireMention: true }
          }
        }
      }
    }
  }
}
```

## 工作原理
1. 安装Microsoft Teams插件。
2. 创建一个**Azure机器人**（应用程序ID + 密钥 + 租户ID）。
3. 构建一个引用该机器人并包含以下RSC权限的**Teams应用包**。
4. 将Teams应用上传/安装到团队中（或用于私信的个人范围）。
5. 在`msteams`中配置`~/.openclaw/openclaw.json`（或环境变量）并启动网关。
6. 网关默认在`/api/messages`上监听Bot Framework webhook流量。

## Azure机器人设置（先决条件）

在配置OpenClaw之前，您需要创建一个Azure机器人资源。

### 第一步：创建Azure机器人

1. 前往[创建Azure机器人](https://portal.azure.com/#create/Microsoft.AzureBot)
2. 填写**基本**选项卡：

   | 字段 | 值 |
   |-------|-------|
   | **机器人句柄** | 您的机器人名称，例如`openclaw-msteams`（必须唯一） |
   | **订阅** | 选择您的Azure订阅 |
   | **资源组** | 创建新资源组或使用现有资源组 |
   | **定价层** | **免费**适用于开发/测试 |
   | **应用类型** | **单租户**（推荐 - 见下方注释） |
   | **创建类型** | **创建新的Microsoft应用程序ID** |

> **弃用通知：** 自2025年7月31日之后，不再创建新的多租户机器人。请为新机器人使用**单租户**。

3. 单击**审核+创建** → **创建**（等待约1-2分钟）

### 第二步：获取凭据

1. 前往您的Azure机器人资源 → **配置**
2. 复制**Microsoft应用程序ID** → 这是您的`appId`
3. 单击**管理密码** → 转到应用程序注册
4. 在**证书与密钥**下 → **新建客户端密钥** → 复制**值** → 这是您的`appPassword`
5. 前往**概览** → 复制**目录（租户）ID** → 这是您的`tenantId`

### 第三步：配置消息端点

1. 在Azure机器人 → **配置**
2. 将**消息端点**设置为您的webhook URL：
   - 生产环境：`https://your-domain.com/api/messages`
   - 本地开发：使用隧道（参见下方[本地开发](#local-development-tunneling)）

### 第四步：启用Teams频道

1. 在Azure机器人 → **渠道**
2. 单击**Microsoft Teams** → 配置 → 保存
3. 接受服务条款

## 本地开发（隧道）
Teams无法访问`localhost`。使用隧道进行本地开发：

**选项A：ngrok**
```bash
ngrok http 3978
# Copy the https URL, e.g., https://abc123.ngrok.io
# Set messaging endpoint to: https://abc123.ngrok.io/api/messages
```

**选项B：Tailscale Funnel**
```bash
tailscale funnel 3978
# Use your Tailscale funnel URL as the messaging endpoint
```

## Teams开发者门户（替代方案）

您可以使用[Teams开发者门户](https://dev.teams.microsoft.com/apps)，而不是手动创建清单ZIP：

1. 单击**+ 新应用**
2. 填写基本信息（名称、描述、开发者信息）
3. 转到**应用功能** → **机器人**
4. 选择**手动输入机器人ID**并粘贴您的Azure机器人应用程序ID
5. 检查范围：**个人**、**团队**、**群聊**
6. 单击**分发** → **下载应用包**
7. 在Teams中：**应用** → **管理您的应用** → **上传自定义应用** → 选择ZIP

这通常比手动编辑JSON清单更容易。

## 测试机器人

**选项A：Azure Web Chat（首先验证webhook）**
1. 在Azure门户 → 您的Azure机器人资源 → **在Web Chat中测试**
2. 发送一条消息 - 您应该看到回复
3. 这确认您的webhook端点在Teams设置之前有效。

**选项B：Teams（安装应用后）**
1. 安装Teams应用（侧载或组织目录）
2. 在Teams中找到机器人并发送私信
3. 检查网关日志以查看传入活动。

## 设置（最小文本模式）
1. **安装Microsoft Teams插件**
   - 从npm：`openclaw plugins install @openclaw/msteams`
   - 从本地检出：`openclaw plugins install ./extensions/msteams`

2. **机器人注册**
   - 创建一个Azure机器人（见上文）并记下：
     - 应用程序ID
     - 客户密钥（应用密码）
     - 租户ID（单租户）

3. **Teams应用清单**
   - 包含一个`bot`条目，带有`botId = <App ID>`。
   - 范围：`personal`、`team`、`groupChat`。
   - `supportsFiles: true`（用于个人范围的文件处理）。
   - 添加RSC权限（见下文）。
   - 创建图标：`outline.png`（32x32）和`color.png`（192x192）。
   - 将所有三个文件一起压缩：`manifest.json`、`outline.png`、`color.png`。

4. **配置OpenClaw**
   ```json
   {
     "msteams": {
       "enabled": true,
       "appId": "<APP_ID>",
       "appPassword": "<APP_PASSWORD>",
       "tenantId": "<TENANT_ID>",
       "webhook": { "port": 3978, "path": "/api/messages" }
     }
   }
   ```

   您也可以使用环境变量代替配置键：
   - `MSTEAMS_APP_ID`
   - `MSTEAMS_APP_PASSWORD`
   - `MSTEAMS_TENANT_ID`

5. **机器人端点**
   - 将Azure机器人消息端点设置为：
     - `https://<host>:3978/api/messages`（或您选择的路径/端口）。

6. **运行网关**
   - 当插件安装并且`msteams`配置包含凭据时，Teams频道会自动启动。

## 历史背景
- `channels.msteams.historyLimit`控制多少最近的频道/群组消息被包装到提示中。
- 回退到`messages.groupChat.historyLimit`。设置`0`以禁用（默认50）。
- 私信历史可以通过`channels.msteams.dmHistoryLimit`限制（用户开启）。每用户的覆盖：`channels.msteams.dms["<user_id>"].historyLimit`。

## 当前Teams RSC权限（清单）
这些是我们Teams应用清单中的**现有特定于资源的权限**。它们仅适用于安装应用的团队/聊天中。

**对于频道（团队范围）：**
- `ChannelMessage.Read.Group`（应用程序） - 接收所有频道消息而无需@提及
- `ChannelMessage.Send.Group`（应用程序）
- `Member.Read.Group`（应用程序）
- `Owner.Read.Group`（应用程序）
- `ChannelSettings.Read.Group`（应用程序）
- `TeamMember.Read.Group`（应用程序）
- `TeamSettings.Read.Group`（应用程序）

**对于群聊：**
- `ChatMessage.Read.Chat`（应用程序） - 接收所有群聊消息而无需@提及

## 示例Teams清单（已编辑）
最小且有效的示例，包含所需字段。替换ID和URL。

```json
{
  "$schema": "https://developer.microsoft.com/en-us/json-schemas/teams/v1.23/MicrosoftTeams.schema.json",
  "manifestVersion": "1.23",
  "version": "1.0.0",
  "id": "00000000-0000-0000-0000-000000000000",
  "name": { "short": "OpenClaw" },
  "developer": {
    "name": "Your Org",
    "websiteUrl": "https://example.com",
    "privacyUrl": "https://example.com/privacy",
    "termsOfUseUrl": "https://example.com/terms"
  },
  "description": { "short": "OpenClaw in Teams", "full": "OpenClaw in Teams" },
  "icons": { "outline": "outline.png", "color": "color.png" },
  "accentColor": "#5B6DEF",
  "bots": [
    {
      "botId": "11111111-1111-1111-1111-111111111111",
      "scopes": ["personal", "team", "groupChat"],
      "isNotificationOnly": false,
      "supportsCalling": false,
      "supportsVideo": false,
      "supportsFiles": true
    }
  ],
  "webApplicationInfo": {
    "id": "11111111-1111-1111-1111-111111111111"
  },
  "authorization": {
    "permissions": {
      "resourceSpecific": [
        { "name": "ChannelMessage.Read.Group", "type": "Application" },
        { "name": "ChannelMessage.Send.Group", "type": "Application" },
        { "name": "Member.Read.Group", "type": "Application" },
        { "name": "Owner.Read.Group", "type": "Application" },
        { "name": "ChannelSettings.Read.Group", "type": "Application" },
        { "name": "TeamMember.Read.Group", "type": "Application" },
        { "name": "TeamSettings.Read.Group", "type": "Application" },
        { "name": "ChatMessage.Read.Chat", "type": "Application" }
      ]
    }
  }
}
```

### 清单注意事项（必填字段）
- `bots[].botId`必须与Azure机器人应用程序ID匹配。
- `webApplicationInfo.id`必须与Azure机器人应用程序ID匹配。
- `bots[].scopes`必须包括您计划使用的表面（`personal`、`team`、`groupChat`）。
- `bots[].supportsFiles: true`是个人范围内文件处理所必需的。
- 如果您想要频道流量，`authorization.permissions.resourceSpecific`必须包括频道读取/发送。

### 更新现有应用

要更新已安装的Teams应用（例如，添加RSC权限）：

1. 使用新设置更新您的`manifest.json`
2. **增加`version`字段**（例如，`1.0.0` → `1.1.0`）
3. **重新压缩**清单并附上图标（`manifest.json`、`outline.png`、`color.png`）
4. 上传新的zip：
   - **选项A（Teams管理中心）：** Teams管理中心 → Teams应用 → 管理应用 → 找到您的应用 → 上传新版本
   - **选项B（侧载）：** 在Teams → 应用 → 管理您的应用 → 上传自定义应用
5. **对于团队频道：** 为了使新权限生效，在每个团队中重新安装应用
6. **完全退出并重新启动Teams**（而不仅仅是关闭窗口）以清除缓存的应用元数据。

## 功能：仅RSC vs Graph

### 仅使用**Teams RSC**（已安装应用，无Graph API权限）
可行：
- 读取频道消息的**文本**内容。
- 发送频道消息的**文本**内容。
- 接收**个人（DM）**文件附件。

不可行：
- 频道/群组的**图像或文件内容**（负载仅包含HTML占位符）。
- 下载存储在SharePoint/OneDrive中的附件。
- 读取消息历史（超出实时webhook事件）。

### 使用**Teams RSC + Microsoft Graph应用程序权限**
新增：
- 下载托管内容（粘贴在消息中的图像）。
- 下载存储在SharePoint/OneDrive中的文件附件。
- 通过Graph读取频道/聊天消息的历史。

### RSC vs Graph API

| 功能 | RSC权限 | Graph API |
|------------|-----------------|-----------|
| **实时消息** | 是（通过webhook） | 否（仅轮询） |
| **历史消息** | 否 | 是（可查询历史） |
| **设置复杂度** | 只需应用清单 | 需要管理员同意 + 令牌流程 |
| **离线工作** | 否（必须运行） | 是（随时可查询） |

**底线：** RSC用于实时监听；Graph API用于历史访问。要在离线时补全错过的消息，您需要具有`ChannelMessage.Read.All`的Graph API（需要管理员同意）。

## 启用Graph的媒体+历史（频道所需）
如果您需要**频道**中的图像/文件，或者想要获取**消息历史**，必须启用Microsoft Graph权限并获得管理员同意。

1. 在Entra ID（Azure AD）**应用程序注册**中，添加Microsoft Graph**应用程序权限**：
   - `ChannelMessage.Read.All`（频道附件+历史）
   - `Chat.Read.All`或`ChatMessage.Read.All`（群聊）
2. 为租户**授予管理员同意**。
3. 提高Teams应用**清单版本**，重新上传，并在Teams中**重新安装应用**。
4. **完全退出并重新启动Teams**以清除缓存的应用元数据。

## 已知局限性

### Webhook超时
Teams通过HTTP webhook传递消息。如果处理时间过长（例如，LLM响应缓慢），您可能会看到：
- 网关超时
- Teams重试消息（导致重复）
- 回复丢失

OpenClaw通过快速响应并主动发送回复来处理这种情况，但非常慢的响应仍可能导致问题。

### 格式化
Teams的Markdown比Slack或Discord更有限：
- 基本格式可用：**粗体**、*斜体*、`code`、链接
- 复杂的Markdown（表格、嵌套列表）可能无法正确渲染
- 自适应卡片可用于投票和任意卡片发送（见下文）。

## 配置
关键设置（参见`/gateway/configuration`以了解共享频道模式）：

- `channels.msteams.enabled`：启用或禁用频道。
- `channels.msteams.appId`、`channels.msteams.appPassword`、`channels.msteams.tenantId`：机器人凭据。
- `channels.msteams.webhook.port`（默认`3978`）
- `channels.msteams.webhook.path`（默认`/api/messages`）
- `channels.msteams.dmPolicy`：`pairing | allowlist | open | disabled`（默认：配对）
- `channels.msteams.allowFrom`：私信白名单（AAD对象ID、UPN或显示名称）。向导会在设置期间在有Graph访问权限时将名称解析为ID。
- `channels.msteams.textChunkLimit`：出站文本块大小。
- `channels.msteams.chunkMode`：`length`（默认）或`newline`在长度分块前按空行（段落边界）分割。
- `channels.msteams.mediaAllowHosts`：入站附件主机白名单（默认为Microsoft/Teams域）。
- `channels.msteams.requireMention`：在频道/群组中需要@提及（默认为真）。
- `channels.msteams.replyStyle`：`thread | top-level`（参见[回复风格](#reply-style-threads-vs-posts)）。
- `channels.msteams.teams.<teamId>.replyStyle`：按团队覆盖。
- `channels.msteams.teams.<teamId>.requireMention`：按团队覆盖。
- `channels.msteams.teams.<teamId>.tools`：默认的按团队的每发送方工具政策覆盖（`allow`/`deny`/`alsoAllow`），当缺少频道覆盖时使用。
- `channels.msteams.teams.<teamId>.toolsBySender`：默认的按团队的每发送方工具政策覆盖（`"*"`通配符支持）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`：按频道覆盖。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`：按频道覆盖。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`：按频道的工具政策覆盖（`allow`/`deny`/`alsoAllow`）。
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`：按频道的每发送方工具政策覆盖（`"*"`通配符支持）。
- `channels.msteams.sharePointSiteId`：用于群聊/频道文件上传的SharePoint站点ID（参见[在群聊中发送文件](#sending-files-in-group-chats)）。

## 路由与会话
- 会话密钥遵循标准代理格式（参见[/概念/会话](/concepts/session)）：
  - 直接消息共享主会话(`agent:<agentId>:<mainKey>`)。
  - 频道/群组消息使用对话ID：
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## 回复风格：线程 vs 帖子

Teams最近在同一底层数据模型上引入了两种频道UI风格：

| 风格 | 描述 | 推荐的`replyStyle` |
|-------|-------------|--------------------------|
| **帖子**（经典） | 消息以卡片形式出现，下方有线程回复 | `thread`（默认） |
| **线程**（类似Slack） | 消息线性流动，更像Slack | `top-level` |

**问题：** Teams API并未公开频道使用哪种UI风格。如果您使用错误的`replyStyle`：
- `thread`在线程风格的频道中 → 回复会显得嵌套得很尴尬
- `top-level`在帖子风格的频道中 → 回复会显示为单独的顶层帖子，而不是在线程中

**解决方案：** 根据频道的设置，为每个频道配置`replyStyle`：

```json
{
  "msteams": {
    "replyStyle": "thread",
    "teams": {
      "19:abc...@thread.tacv2": {
        "channels": {
          "19:xyz...@thread.tacv2": {
            "replyStyle": "top-level"
          }
        }
      }
    }
  }
}
```

## 附件与图片

**当前限制：**
- **私信：** 图片和文件附件可通过Teams机器人文件API实现。
- **频道/群组：** 附件存储在M365存储中（SharePoint/OneDrive）。Webhook负载仅包含HTML占位符，不包含实际的文件字节。**需要Graph权限**才能下载频道附件。

如果没有Graph权限，带有图片的频道消息将被视为纯文本（机器人无法访问图片内容）。
默认情况下，OpenClaw只从Microsoft/Teams主机名下载媒体。使用`channels.msteams.mediaAllowHosts`进行覆盖（使用`["*"]`允许任何主机）。

## 在群聊中发送文件

机器人可以使用FileConsentCard流程在私信中发送文件（内置）。然而，**在群聊/频道中发送文件**需要额外的设置：

| 上下文 | 文件如何发送 | 需要的设置 |
|---------|-------------------|--------------|
| **私信** | FileConsentCard → 用户接受 → 机器人上传 | 开箱即用 |
| **群聊/频道** | 上传到SharePoint → 分享链接 | 需要`sharePointSiteId` + Graph权限 |
| **任何上下文中的图片** | Base64编码的内联 | 开箱即用 |

### 为什么群聊需要SharePoint

机器人没有个人OneDrive驱动器（`/me/drive` Graph API端点对应用程序身份无效）。要在群聊/频道中发送文件，机器人会上传到**SharePoint站点**并创建共享链接。

### 设置

1. 在Entra ID（Azure AD）→ 应用程序注册中**添加Graph API权限**：
   - `Sites.ReadWrite.All`（应用程序） - 将文件上传到SharePoint
   - `Chat.Read.All`（应用程序） - 可选，启用按用户共享链接

2. **授予管理员同意**针对该租户。

3. **获取您的SharePoint站点ID：**
   ```bash
   # Via Graph Explorer or curl with a valid token:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Example: for a site at "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # Response includes: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **配置OpenClaw：**
   ```json5
   {
     channels: {
       msteams: {
         // ... other config ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2"
       }
     }
   }
   ```

### 共享行为

| 权限 | 共享行为 |
|------------|------------------|
| 仅`Sites.ReadWrite.All` | 组织范围内的共享链接（组织中的任何人都可以访问） |
| `Sites.ReadWrite.All` + `Chat.Read.All` | 按用户共享链接（只有聊天成员可以访问） |

按用户共享更安全，因为只有聊天参与者可以访问文件。如果缺少`Chat.Read.All`权限，机器人会回退到组织范围内的共享。

### 回退行为

| 场景 | 结果 |
|----------|--------|
| 群聊 + 文件 + 配置了`sharePointSiteId` | 上传到SharePoint，发送共享链接 |
| 群聊 + 文件 + 没有`sharePointSiteId` | 尝试OneDrive上传（可能失败），仅发送文本 |
| 个人聊天 + 文件 | FileConsentCard流程（无需SharePoint即可使用） |
| 任何上下文 + 图片 | Base64编码的内联（无需SharePoint即可使用） |

### 文件存储位置

上传的文件存储在配置的SharePoint站点默认文档库中的`/OpenClawShared/`文件夹中。

## 投票（自适应卡片）
OpenClaw以自适应卡片的形式发送Teams投票（没有原生的Teams投票API）。

- CLI：`openclaw message poll --channel msteams --target conversation:<id> ...`
- 投票由网关在`~/.openclaw/msteams-polls.json`中记录。
- 网关必须保持在线才能记录投票。
- 投票目前不会自动发布结果摘要（如有需要，请检查存储文件）。

## 自适应卡片（任意）
使用`message`工具或CLI，将任何自适应卡片JSON发送给Teams用户或对话。

`card`参数接受自适应卡片JSON对象。当`card`提供时，消息文本是可选的。

**代理工具：**
```json
{
  "action": "send",
  "channel": "msteams",
  "target": "user:<id>",
  "card": {
    "type": "AdaptiveCard",
    "version": "1.5",
    "body": [{"type": "TextBlock", "text": "Hello!"}]
  }
}
```

**CLI：**
```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --card '{"type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"Hello!"}]}'
```

有关卡片模式和示例，请参见[自适应卡片文档](https://adaptivecards.io/)。有关目标格式的详细信息，请参见[目标格式](#target-formats)。

## 目标格式

MSTeams目标使用前缀来区分用户和对话：

| 目标类型 | 格式 | 示例 |
|-------------|--------|---------|
| 用户（按ID） | `user:<aad-object-id>` | `user:40a1a0ed-4ff2-4164-a219-55518990c197` |
| 用户（按名称） | `user:<display-name>` | `user:John Smith`（需要Graph API） |
| 群组/频道 | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2` |
| 群组/频道（原始） | `<conversation-id>` | `19:abc123...@thread.tacv2`（如果包含`@thread`） |

**CLI示例：**
```bash
# Send to a user by ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Send to a user by display name (triggers Graph API lookup)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# Send to a group chat or channel
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Send an Adaptive Card to a conversation
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --card '{"type":"AdaptiveCard","version":"1.5","body":[{"type":"TextBlock","text":"Hello"}]}'
```

**代理工具示例：**
```json
{
  "action": "send",
  "channel": "msteams",
  "target": "user:John Smith",
  "message": "Hello!"
}
```

```json
{
  "action": "send",
  "channel": "msteams",
  "target": "conversation:19:abc...@thread.tacv2",
  "card": {"type": "AdaptiveCard", "version": "1.5", "body": [{"type": "TextBlock", "text": "Hello"}]}
}
```

注意：如果没有`user:`前缀，名称默认解析为群组/团队。在按显示名称定位人员时，务必使用`user:`。

## 主动消息
- 主动消息只有在用户互动**之后**才有可能，因为我们那时会存储对话引用。
- 有关`/gateway/configuration`和白名单门控，请参见`dmPolicy`。

## 团队和频道ID（常见陷阱）

Teams URL中的`groupId`查询参数**不是**用于配置的团队ID。应从URL路径中提取ID：

**团队URL：**
```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team ID (URL-decode this)
```

**频道URL：**
```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (URL-decode this)
```

**用于配置：**
- 团队ID = `/team/`之后的路径段（URL解码后，例如`19:Bk4j...@thread.tacv2`）
- 频道ID = `/channel/`之后的路径段（URL解码后）
- **忽略**`groupId`查询参数

## 私人频道

机器人在私人频道中的支持有限：

| 功能 | 标准频道 | 私人频道 |
|---------|-------------------|------------------|
| 机器人安装 | 是 | 有限 |
| 实时消息（webhook） | 是 | 可能不起作用 |
| RSC权限 | 是 | 行为可能不同 |
| @提及 | 是 | 如果机器人可访问 |
| Graph API历史 | 是 | 是（有权限） |

**如果私人频道不起作用的解决办法：**
1. 对于机器人交互，使用标准频道
2. 使用私信 - 用户始终可以直接与机器人联系
3. 使用Graph API进行历史访问（需要`ChannelMessage.Read.All`）

## 故障排除

### 常见问题

- **频道中不显示图片：** 缺少Graph权限或管理员同意。重新安装Teams应用并完全退出/重新打开Teams。
- **频道中没有回复：** 默认需要提及；设置`channels.msteams.requireMention=false`或按团队/频道配置。
- **版本不匹配（Teams仍显示旧清单）：** 删除并重新添加应用，并完全退出Teams以刷新。
- **来自webhook的401未经授权：** 在没有Azure JWT的情况下手动测试时是预期的 - 表示端点可访问，但身份验证失败。使用Azure Web Chat进行正确测试。

### 清单上传错误

- **“图标文件不能为空”：** 清单引用的图标文件为0字节。创建有效的PNG图标（32x32用于`outline.png`，192x192用于`color.png`）。
- **“webApplicationInfo.Id已被使用”：** 应用仍在另一个团队/聊天中安装。先找到并卸载它，或等待5-10分钟以完成传播。
- **上传时出现“出了点问题”：** 改用https://admin.teams.microsoft.com上传，打开浏览器DevTools（F12）→ 网络标签，查看响应体以获取实际错误。
- **侧载失败：** 尝试“将应用上传到您组织的应用目录”，而不是“上传自定义应用” - 这通常可以绕过侧载限制。

### RSC权限不起作用

1. 确认`webApplicationInfo.id`与您的机器人应用程序ID完全匹配
2. 重新上传应用并在团队/聊天中重新安装
3. 检查您的组织管理员是否阻止了RSC权限
4. 确认您使用的是正确的范围：`ChannelMessage.Read.Group`用于团队，`ChatMessage.Read.Chat`用于群聊

## 参考资料
- [创建Azure机器人](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - Azure机器人设置指南
- [Teams开发者门户](https://dev.teams.microsoft.com/apps) - 创建/管理Teams应用
- [Teams应用清单模式](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [使用RSC接收频道消息](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC权限参考](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams机器人文件处理](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4)（频道/群组需要Graph）
- [主动消息](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)

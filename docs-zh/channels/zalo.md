---
summary: 'Zalo bot support status, capabilities, and configuration'
read_when:
  - Working on Zalo features or webhooks
---
# Zalo（Bot API）

状态：实验性。目前仅支持私信；根据Zalo文档，群组功能即将推出。

## 需要插件
Zalo以插件形式提供，不随核心安装包一起打包。
- 通过 CLI 安装：`openclaw plugins install @openclaw/zalo`
- 或在引导过程中选择 **Zalo** 并确认安装提示
- 详情：[插件](/plugin)

## 快速设置（初学者）
1) 安装 Zalo 插件：
   - 从源码检出：`openclaw plugins install ./extensions/zalo`
   - 从 npm 安装（如果已发布）：`openclaw plugins install @openclaw/zalo`
   - 或在引导过程中选择 **Zalo** 并确认安装提示
2) 设置令牌：
   - 环境变量：`ZALO_BOT_TOKEN=...`
   - 或配置文件：`channels.zalo.botToken: "..."`。
3) 重启网关（或完成引导）。
4) 默认使用配对方式获取私信访问权限；首次联系时请批准配对代码。

最小配置：
```json5
{
  channels: {
    zalo: {
      enabled: true,
      botToken: "12345689:abc-xyz",
      dmPolicy: "pairing"
    }
  }
}
```

## 功能简介
Zalo 是一款专注于越南的即时通讯应用；其 Bot API 允许网关运行一个用于一对一对话的机器人。
它非常适合需要确定性路由回 Zalo 的支持或通知场景。
- 网关拥有一个 Zalo Bot API 渠道。
- 确定性路由：回复会返回到 Zalo；模型不会自行选择渠道。
- 私信共享代理的主要会话。
- 群组功能尚未支持（Zalo 文档说明“即将推出”）。

## 设置（快速路径）

### 1) 创建机器人令牌（Zalo Bot 平台）
1) 访问 **https://bot.zaloplatforms.com** 并登录。
2) 创建一个新的机器人并配置其设置。
3) 复制机器人令牌（格式：`12345689:abc-xyz`）。

### 2) 配置令牌（环境变量或配置文件）
示例：

```json5
{
  channels: {
    zalo: {
      enabled: true,
      botToken: "12345689:abc-xyz",
      dmPolicy: "pairing"
    }
  }
}
```

环境变量选项：`ZALO_BOT_TOKEN=...`（仅适用于默认账户）。

多账户支持：使用 `channels.zalo.accounts`，配合每个账户的令牌，并可选 `name`。

3) 重启网关。当解析到令牌（环境变量或配置文件）时，Zalo 就会启动。
4) 私信访问默认采用配对模式。当机器人首次被联系时，请批准代码。

## 工作原理（行为）
- 入站消息会被规范化为共享通道信封，并包含媒体占位符。
- 回复始终路由回同一个 Zalo 聊天。
- 默认使用长轮询；可通过 `channels.zalo.webhookUrl` 启用 Webhook 模式。

## 限制
- 出站文本按 2000 字符分块发送（Zalo API 限制）。
- 媒体下载/上传数量上限为 `channels.zalo.mediaMaxMb`（默认 5）。
- 由于 2000 字符限制使流式传输效用降低，默认会阻止流式传输。

## 访问控制（私信）

### 私信访问
- 默认：`channels.zalo.dmPolicy = "pairing"`。未知发件人会收到配对代码；消息在批准前会被忽略（代码 1 小时后失效）。
- 可通过以下方式批准：
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- 配对是默认的令牌交换方式。详情：[配对](/start/pairing)
- `channels.zalo.allowFrom` 接受数字用户 ID（无法进行用户名查找）。

## 长轮询 vs Webhook
- 默认：长轮询（无需公开 URL）。
- Webhook 模式：设置 `channels.zalo.webhookUrl` 和 `channels.zalo.webhookSecret`。
  - Webhook 密钥必须为 8–256 个字符。
  - Webhook URL 必须使用 HTTPS。
  - Zalo 使用 `X-Bot-Api-Secret-Token` 头部发送事件以进行验证。
  - 网关 HTTP 在 `channels.zalo.webhookPath` 处处理 Webhook 请求（默认为 Webhook URL 路径）。

**注意：** 根据 Zalo API 文档，getUpdates（轮询）和 Webhook 互斥。

## 支持的消息类型
- **文本消息**：完全支持，按 2000 字符分块。
- **图片消息**：下载并处理入站图片；通过 `sendPhoto` 发送图片。
- **贴纸**：记录但未完全处理（无代理响应）。
- **不支持的类型**：记录（例如来自受保护用户的消息）。

## 功能概览
| 功能 | 状态 |
|---------|--------|
| 私信 | ✅ 支持 |
| 群组 | ❌ 即将推出（根据 Zalo 文档） |
| 媒体（图片） | ✅ 支持 |
| 反馈 | ❌ 不支持 |
| 线程 | ❌ 不支持 |
| 投票 | ❌ 不支持 |
| 原生命令 | ❌ 不支持 |
| 流式传输 | ⚠️ 被阻止（2000 字符限制） |

## 投递目标（CLI/cron）
- 使用聊天 ID 作为目标。
- 示例：`openclaw message send --channel zalo --target 123456789 --message "hi"`。

## 故障排除

**机器人无响应：**
- 检查令牌是否有效：`openclaw channels status --probe`
- 验证发件人是否已批准（配对或 allowFrom）
- 检查网关日志：`openclaw logs --follow`

**Webhook 未接收事件：**
- 确保 Webhook URL 使用 HTTPS
- 验证密钥长度为 8–256 个字符
- 确认网关 HTTP 端点可在配置的路径上访问
- 检查 getUpdates 轮询是否正在运行（两者互斥）

## 配置参考（Zalo）
完整配置：[配置](/gateway/configuration)

提供商选项：
- `channels.zalo.enabled`：启用或禁用频道启动。
- `channels.zalo.botToken`：来自 Zalo Bot 平台的机器人令牌。
- `channels.zalo.tokenFile`：从文件路径读取令牌。
- `channels.zalo.dmPolicy`：`pairing | allowlist | open | disabled`（默认：配对）。
- `channels.zalo.allowFrom`：私信白名单（用户 IDs）。`open` 需要 `"*"`。向导会要求输入数字 ID。
- `channels.zalo.mediaMaxMb`：入站/出站媒体数量上限（MB，默认 5）。
- `channels.zalo.webhookUrl`：启用 Webhook 模式（需 HTTPS）。
- `channels.zalo.webhookSecret`：Webhook 密钥（8–256 个字符）。
- `channels.zalo.webhookPath`：网关 HTTP 服务器上的 Webhook 路径。
- `channels.zalo.proxy`：API 请求的代理 URL。

多账户选项：
- `channels.zalo.accounts.<id>.botToken`：每个账户的令牌。
- `channels.zalo.accounts.<id>.tokenFile`：每个账户的令牌文件。
- `channels.zalo.accounts.<id>.name`：显示名称。
- `channels.zalo.accounts.<id>.enabled`：启用或禁用账户。
- `channels.zalo.accounts.<id>.dmPolicy`：每个账户的私信政策。
- `channels.zalo.accounts.<id>.allowFrom`：每个账户的白名单。
- `channels.zalo.accounts.<id>.webhookUrl`：每个账户的 Webhook URL。
- `channels.zalo.accounts.<id>.webhookSecret`：每个账户的 Webhook 密钥。
- `channels.zalo.accounts.<id>.webhookPath`：每个账户的 Webhook 路径。
- `channels.zalo.accounts.<id>.proxy`：每个账户的代理 URL。

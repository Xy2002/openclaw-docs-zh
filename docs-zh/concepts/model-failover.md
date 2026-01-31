---
summary: How OpenClaw rotates auth profiles and falls back across models
read_when:
  - 'Diagnosing auth profile rotation, cooldowns, or model fallback behavior'
  - Updating failover rules for auth profiles or models
---
# 模型故障转移

OpenClaw 分两个阶段处理故障：
1) 在当前提供商内部进行 **身份验证配置文件轮换**。
2) 回退到 `agents.defaults.model.fallbacks` 中的下一个模型。

本文档解释了运行时规则及其背后的数据。

## 身份验证存储（密钥 + OAuth）

OpenClaw 同时使用 **身份验证配置文件** 来管理 API 密钥和 OAuth 令牌。
- 秘密存储在 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` 中（旧版：`~/.openclaw/agent/auth-profiles.json`）。
- 配置 `auth.profiles` / `auth.order` 仅包含 **元数据和路由信息**，不包含任何秘密。
- 仅用于导入的旧版 OAuth 文件：`~/.openclaw/credentials/oauth.json`（首次使用时会导入到 `auth-profiles.json` 中）。

更多详细信息：[/concepts/oauth](/concepts/oauth)

凭据类型：
- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }`（部分提供商还支持 `projectId`/`enterpriseUrl`）

## 配置文件 ID

OAuth 登录会创建独立的配置文件，以便多个账户可以共存。
- 默认：当没有电子邮件可用时为 `provider:default`。
- 带电子邮件的 OAuth：`provider:<email>`（例如 `google-antigravity:user@gmail.com`）。

配置文件存储在 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` 下的 `profiles` 中。

## 轮换顺序

当一个提供商有多个配置文件时，OpenClaw 按照以下顺序选择配置文件：
1) **显式配置**：如果已设置，则使用 `auth.order[provider]`。
2) **已配置的配置文件**：按提供商筛选出的 `auth.profiles`。
3) **存储的配置文件**：该提供商在 `auth-profiles.json` 中的条目。

如果没有显式配置顺序，OpenClaw 会使用循环轮换顺序：
- **主要键**：配置文件类型（**OAuth 优先于 API 密钥**）。
- **次要键**：按 `usageStats.lastUsed` 排序（同一类型中按最旧的优先）。
- **冷却期/禁用的配置文件**会被移至最后，并按即将到期的时间排序。

### 会话粘性（缓存友好）

OpenClaw **为每个会话固定选定的身份验证配置文件**，以保持提供商缓存的热度。
它 **不会** 在每次请求时轮换。固定的配置文件会一直重复使用，直到：
- 会话重置（`/new` / `/reset`）
- 整理操作完成（整理次数递增）
- 配置文件处于冷却期或被禁用

通过 `/model …@<profileId>` 手动选择可为该会话设置 **用户覆盖**，且在新会话开始之前不会自动轮换。

由会话路由器自动固定的配置文件被视为一种 **偏好**：它们会首先被尝试，但如果遇到速率限制或超时，OpenClaw 可能会切换到其他配置文件。用户固定的配置文件则始终锁定在该配置文件上；如果该配置文件失败且已配置模型回退，OpenClaw 将转到下一个模型，而不是切换配置文件。

### 为什么 OAuth 有时看起来“丢失”

如果你为同一个提供商同时拥有 OAuth 配置文件和 API 密钥配置文件，除非固定，否则循环轮换可能会在不同消息之间切换这两个配置文件。要强制使用单个配置文件：
- 使用 `auth.order[provider] = ["provider:profileId"]` 进行固定，或
- 通过 `/model …` 使用每会话覆盖，并指定配置文件覆盖（如果您的 UI/聊天界面支持）。

## 冷却期

当某个配置文件因身份验证或速率限制错误（或看似速率限制的超时）而失败时，OpenClaw 会将其标记为冷却状态，并切换到下一个配置文件。格式或无效请求错误（例如 Cloud Code Assist 工具调用 ID 验证失败）被视为可触发故障转移的情况，并适用相同的冷却期。

冷却期采用指数退避机制：
- 1 分钟
- 5 分钟
- 25 分钟
- 1 小时（上限）

状态存储在 `auth-profiles.json` 下的 `usageStats` 中：

```json
{
  "usageStats": {
    "provider:profile": {
      "lastUsed": 1736160000000,
      "cooldownUntil": 1736160600000,
      "errorCount": 2
    }
  }
}
```

## 计费禁用

计费或信用失败（例如“积分不足”或“信用余额过低”）被视为可触发故障转移的情况，但通常不是暂时性的。与短暂的冷却期不同，OpenClaw 会将该配置文件标记为 **禁用**（并采用更长的退避时间），然后切换到下一个配置文件或提供商。

状态存储在 `auth-profiles.json` 中：

```json
{
  "usageStats": {
    "provider:profile": {
      "disabledUntil": 1736178000000,
      "disabledReason": "billing"
    }
  }
}
```

默认设置：
- 计费退避从 **5 小时** 开始，每次计费失败后翻倍，上限为 **24 小时**。
- 如果该配置文件在 **24 小时** 内未再次失败，退避计数器将重置（可配置）。

## 模型回退

如果某个提供商的所有配置文件都失败，OpenClaw 会转到 `agents.defaults.model.fallbacks` 中的下一个模型。这适用于身份验证失败、速率限制以及耗尽配置文件轮换的超时情况（其他错误不会触发回退）。

当运行以模型覆盖（通过挂钩或 CLI）开始时，即使尝试了所有已配置的回退，回退最终仍会终止于 `agents.defaults.model.primary`。

## 相关配置

有关以下内容，请参阅 [网关配置](/gateway/configuration)：
- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` 路由

有关更广泛的模型选择和回退概述，请参阅 [模型](/concepts/models)。

---
summary: 'OAuth in OpenClaw: token exchange, storage, and multi-account patterns'
read_when:
  - You want to understand OpenClaw OAuth end-to-end
  - You hit token invalidation / logout issues
  - You want setup-token or OAuth auth flows
  - You want multiple accounts or profile routing
---
# OAuth

OpenClaw 通过 OAuth 支持“订阅身份验证”，适用于提供此功能的提供商（尤其是 **OpenAI Codex (ChatGPT OAuth)**）。对于 Anthropic 订阅，请使用 **setup-token** 流程。本页面将介绍：

- OAuth **令牌交换**的工作原理（PKCE）
- 令牌的 **存储位置**（以及原因）
- 如何处理 **多个账户**（配置文件 + 每会话覆盖）

OpenClaw 还支持自带 OAuth 或 API 密钥流程的 **提供商插件**。可通过以下方式运行这些插件：

```bash
openclaw models auth login --provider <id>
```

## 令牌接收器（为何存在）

OAuth 提供商通常会在登录或刷新流程中生成一个 **新的刷新令牌**。某些提供商（或 OAuth 客户端）在为同一用户/应用颁发新刷新令牌时，可能会使旧的刷新令牌失效。

实际表现：
- 您通过 OpenClaw 和 Claude Code/Codex CLI 同时登录 → 其中一个随后会随机“登出”

为减少这种情况，OpenClaw 将 `auth-profiles.json` 视为 **令牌接收器**：
- 运行时从 **单一位置**读取凭据
- 我们可以保存多个配置文件，并以确定性方式路由它们

## 存储（令牌的存放位置）

凭据按 **代理**存储：

- 身份验证配置文件（OAuth + API 密钥）：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 运行时缓存（自动管理；请勿手动编辑）：`~/.openclaw/agents/<agentId>/agent/auth.json`

旧版仅用于导入的文件（仍受支持，但不再是主要存储）：
- `~/.openclaw/credentials/oauth.json`（首次使用时导入到 `auth-profiles.json` 中）

上述所有内容也遵循 `$OPENCLAW_STATE_DIR`（状态目录覆盖）。完整参考：[/gateway/configuration](/gateway/configuration#auth-storage-oauth--api-keys)

## Anthropic setup-token（订阅身份验证）

在任意机器上运行 `claude setup-token`，然后将其粘贴到 OpenClaw 中：

```bash
openclaw models auth setup-token --provider anthropic
```

如果您在其他地方生成了该令牌，请手动粘贴：

```bash
openclaw models auth paste-token --provider anthropic
```

验证：

```bash
openclaw models status
```

## OAuth 交换（登录工作原理）

OpenClaw 的交互式登录流程由 `@mariozechner/pi-ai` 实现，并与向导和命令集成。

### Anthropic（Claude Pro/Max）setup-token

流程步骤：

1) 运行 `claude setup-token`
2) 将令牌粘贴到 OpenClaw
3) 存储为令牌身份验证配置文件（无刷新）

向导路径为 `openclaw onboard` → 身份验证选项 `setup-token`（Anthropic）。

### OpenAI Codex（ChatGPT OAuth）

流程步骤（PKCE）：

1) 生成 PKCE 验证器/质询 + 随机 `state`
2) 打开 `https://auth.openai.com/oauth/authorize?...`
3) 尝试捕获 `http://127.0.0.1:1455/auth/callback` 上的回调
4) 如果无法绑定回调（或您处于远程/无头模式），则粘贴重定向 URL/代码
5) 在 `https://auth.openai.com/oauth/token` 处进行交换
6) 从访问令牌中提取 `accountId`，并存储 `{ access, refresh, expires, accountId }`

向导路径为 `openclaw onboard` → 身份验证选项 `openai-codex`。

## 刷新与过期

配置文件存储一个 `expires` 时间戳。

在运行时：
- 如果 `expires` 在未来 → 使用存储的访问令牌
- 如果已过期 → 在文件锁保护下刷新，并覆盖存储的凭据

刷新流程是自动的；通常无需手动管理令牌。

## 多个账户（配置文件）+ 路由

两种模式：

### 1) 推荐：分离代理

如果您希望“个人”和“工作”之间永不交互，请使用隔离的代理（独立会话 + 凭据 + 工作区）：

```bash
openclaw agents add work
openclaw agents add personal
```

然后为每个代理配置身份验证（通过向导），并将聊天路由到正确的代理。

### 2) 高级：单个代理中的多个配置文件

`auth-profiles.json` 支持同一提供商下的多个配置文件 ID。

选择使用的配置文件：
- 通过配置排序全局指定（`auth.order`）
- 通过 `/model ...@<profileId>` 指定每会话使用的配置文件

示例（会话覆盖）：
- `/model Opus@anthropic:work`

查看现有配置文件 ID 的方法：
- `openclaw channels list --json`（显示 `auth[]`）

相关文档：
- [/concepts/model-failover](/concepts/model-failover)（轮换 + 冷却规则）
- [/tools/slash-commands](/tools/slash-commands)（命令界面）

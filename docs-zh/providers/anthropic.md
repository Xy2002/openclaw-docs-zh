---
summary: Use Anthropic Claude via API keys or setup-token in OpenClaw
read_when:
  - You want to use Anthropic models in OpenClaw
  - You want setup-token instead of API keys
---
# Anthropic（Claude）

Anthropic 构建了 **Claude** 模型系列，并通过 API 提供访问权限。
在 OpenClaw 中，你可以使用 API 密钥或 **设置令牌** 进行身份验证。

## 选项 A：Anthropic API 密钥

**最适合：** 标准 API 访问和按用量计费。
在 Anthropic 控制台中创建你的 API 密钥。

### CLI 设置

```bash
openclaw onboard
# choose: Anthropic API key

# or non-interactive
openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
```

### 配置片段

```json5
{
  env: { ANTHROPIC_API_KEY: "sk-ant-..." },
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-5" } } }
}
```

## 提示缓存（Anthropic API）

OpenClaw 不会覆盖 Anthropic 的默认缓存 TTL，除非你显式设置它。
这仅适用于 **API**；订阅身份验证不遵循 TTL 设置。

要为每个模型设置 TTL，请在模型的 `params` 中使用 `cacheControlTtl`：

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-5": {
          params: { cacheControlTtl: "5m" } // or "1h"
        }
      }
    }
  }
}
```

OpenClaw 包含用于 Anthropic API 请求的 `extended-cache-ttl-2025-04-11` 测试版标志；如果你覆盖提供商标头，请保留此标志（参见 [/gateway/configuration](/gateway/configuration)）。

## 选项 B：Claude 设置令牌

**最适合：** 使用你的 Claude 订阅。

### 获取设置令牌的位置

设置令牌由 **Claude Code CLI** 创建，而非 Anthropic 控制台。你可以在 **任何机器** 上运行此命令：

```bash
claude setup-token
```

将令牌粘贴到 OpenClaw 中（向导：**Anthropic 令牌（粘贴设置令牌）**），或在网关主机上运行：

```bash
openclaw models auth setup-token --provider anthropic
```

如果你在另一台机器上生成了令牌，请粘贴：

```bash
openclaw models auth paste-token --provider anthropic
```

### CLI 设置

```bash
# Paste a setup-token during onboarding
openclaw onboard --auth-choice setup-token
```

### 配置片段

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-5" } } }
}
```

## 注意事项

- 使用 `claude setup-token` 生成设置令牌并粘贴，或在网关主机上运行 `openclaw models auth setup-token`。
- 如果在使用 Claude 订阅时看到“OAuth 令牌刷新失败……”，请使用设置令牌重新进行身份验证。参见 [/gateway/troubleshooting#oauth-token-refresh-failed-anthropic-claude-subscription](/gateway/troubleshooting#oauth-token-refresh-failed-anthropic-claude-subscription)。
- 身份验证详情及复用规则请参见 [/concepts/oauth](/concepts/oauth)。

## 故障排除

**401 错误 / 令牌突然失效**
- Claude 订阅的身份验证可能会过期或被撤销。请重新运行 `claude setup-token` 并将其粘贴到 **网关主机**。
- 如果 Claude CLI 登录信息保存在另一台机器上，请在网关主机上使用 `openclaw models auth paste-token --provider anthropic`。

**未找到 provider "anthropic" 的 API 密钥**
- 身份验证是 **按代理** 进行的。新代理不会继承主代理的密钥。
- 为该代理重新运行入职流程，或在网关主机上粘贴设置令牌或 API 密钥，然后使用 `openclaw models status` 进行验证。

**未找到 profile `anthropic:default` 的凭据**
- 运行 `openclaw models status` 以查看当前激活的身份验证配置文件。
- 重新运行入职流程，或为该配置文件粘贴设置令牌或 API 密钥。

**无可用的身份验证配置文件（所有配置文件都在冷却中或不可用）**
- 使用 `openclaw models status --json` 查看 `auth.unusableProfiles`。
- 添加另一个 Anthropic 配置文件，或等待冷却期结束。

更多内容请参见 [/gateway/troubleshooting](/gateway/troubleshooting) 和 [/help/faq](/help/faq)。

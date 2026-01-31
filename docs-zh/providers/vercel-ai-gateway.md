---
title: Vercel AI Gateway
summary: Vercel AI Gateway setup (auth + model selection)
read_when:
  - You want to use Vercel AI Gateway with OpenClaw
  - You need the API key env var or CLI auth choice
---
# Vercel AI 网关


[Vercel AI 网关](https://vercel.com/ai-gateway) 提供统一的 API，可通过单个端点访问数百种模型。

- 提供商: `vercel-ai-gateway`
- 认证: `AI_GATEWAY_API_KEY`
- 兼容 API: Anthropic Messages

## 快速入门

1) 设置 API 密钥（推荐：为网关存储密钥）：

```bash
openclaw onboard --auth-choice ai-gateway-api-key
```

2) 设置默认模型：

```json5
{
  agents: {
    defaults: {
      model: { primary: "vercel-ai-gateway/anthropic/claude-opus-4.5" }
    }
  }
}
```

## 非交互式示例

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## 环境说明

如果网关以守护进程（launchd/systemd）形式运行，请确保 `AI_GATEWAY_API_KEY`
对该进程可用（例如，在 `~/.openclaw/.env` 中或通过 `env.shellEnv`）。

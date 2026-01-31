---
summary: Use Claude Max/Pro subscription as an OpenAI-compatible API endpoint
read_when:
  - You want to use Claude Max subscription with OpenAI-compatible tools
  - You want a local API server that wraps Claude Code CLI
  - You want to save money by using subscription instead of API keys
---
# Claude Max API代理

**claude-max-api-proxy** 是一款社区工具，可将您的 Claude Max/Pro 订阅暴露为与 OpenAI 兼容的 API 端点。这样一来，您就可以在任何支持 OpenAI API 格式的工具中使用您的订阅。

## 为何使用此工具？

| 方法 | 成本 | 适用场景 |
|----------|------|----------|
| Anthropic API | 按令牌计费（Opus 的输入约为每百万令牌 15 美元，输出约为每百万令牌 75 美元） | 生产级应用、高用量场景 |
| Claude Max 订阅 | 固定费用每月 200 美元 | 个人使用、开发、无限使用 |

如果您拥有 Claude Max 订阅并希望将其与 OpenAI 兼容的工具一起使用，此代理可以为您节省大量成本。

## 工作原理

```
Your App → claude-max-api-proxy → Claude Code CLI → Anthropic (via subscription)
     (OpenAI format)              (converts format)      (uses your login)
```

代理的工作流程如下：
1. 在 `http://localhost:3456/v1/chat/completions` 接受 OpenAI 格式的请求
2. 将这些请求转换为 Claude Code CLI 命令
3. 以 OpenAI 格式返回响应（支持流式传输）

## 安装

```bash
# Requires Node.js 20+ and Claude Code CLI
npm install -g claude-max-api-proxy

# Verify Claude CLI is authenticated
claude --version
```

## 使用方法

### 启动服务器

```bash
claude-max-api
# Server runs at http://localhost:3456
```

### 测试

```bash
# Health check
curl http://localhost:3456/health

# List models
curl http://localhost:3456/v1/models

# Chat completion
curl http://localhost:3456/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-opus-4",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### 与 OpenClaw 配合使用

您可以将 OpenClaw 指向该代理，将其用作自定义的 OpenAI 兼容端点：

```json5
{
  env: {
    OPENAI_API_KEY: "not-needed",
    OPENAI_BASE_URL: "http://localhost:3456/v1"
  },
  agents: {
    defaults: {
      model: { primary: "openai/claude-opus-4" }
    }
  }
}
```

## 可用模型

| 模型 ID | 映射到 |
|----------|---------|
| `claude-opus-4` | Claude Opus 4 |
| `claude-sonnet-4` | Claude Sonnet 4 |
| `claude-haiku-4` | Claude Haiku 4 |

## 在 macOS 上自动启动

创建一个 LaunchAgent，以便自动运行代理：

```bash
cat > ~/Library/LaunchAgents/com.claude-max-api.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.claude-max-api</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/node</string>
    <string>/usr/local/lib/node_modules/claude-max-api-proxy/dist/server/standalone.js</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/usr/local/bin:/opt/homebrew/bin:~/.local/bin:/usr/bin:/bin</string>
  </dict>
</dict>
</plist>
EOF

launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.claude-max-api.plist
```

## 链接

- **npm:** https://www.npmjs.com/package/claude-max-api-proxy
- **GitHub:** https://github.com/atalovesyou/claude-max-api-proxy
- **问题追踪:** https://github.com/atalovesyou/claude-max-api-proxy/issues

## 注意事项

- 这是一款 **社区工具**，未得到 Anthropic 或 OpenClaw 的官方支持
- 需要已激活的 Claude Max/Pro 订阅，并且已通过 Claude Code CLI 身份验证
- 代理在本地运行，不会将数据发送到任何第三方服务器
- 完全支持流式响应

## 相关内容

- [Anthropic 提供商](/providers/anthropic) - OpenClaw 与 Claude setup-token 或 API 密钥的原生集成
- [OpenAI 提供商](/providers/openai) - 适用于 OpenAI/Codex 订阅

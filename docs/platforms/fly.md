---
title: Fly.io
description: Deploy OpenClaw on Fly.io
---
# Fly.io 部署

**目标：** 在 [Fly.io](https://fly.io) 机器上运行 OpenClaw 网关，并提供持久化存储、自动 HTTPS 支持以及 Discord/频道访问权限。

## 您需要准备的内容

- 已安装 [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/)
- Fly.io 账户（免费层级即可）
- 模型认证：Anthropic API 密钥（或其他提供商密钥）
- 频道凭据：Discord 机器人令牌、Telegram 令牌等

## 初学者快速路径

1. 克隆仓库 → 自定义 `fly.toml`
2. 创建应用 + 卷 → 设置密钥
3. 使用 `fly deploy` 部署
4. SSH 登录以创建配置，或使用控制 UI

## 1) 创建 Fly 应用

```bash
# Clone the repo
git clone https://github.com/openclaw/openclaw.git
cd openclaw

# Create a new Fly app (pick your own name)
fly apps create my-openclaw

# Create a persistent volume (1GB is usually enough)
fly volumes create openclaw_data --size 1 --region iad
```

**提示：** 选择离您较近的区域。常见选项：`lhr`（伦敦）、`iad`（弗吉尼亚）、`sjc`（圣何塞）。

## 2) 配置 fly.toml

编辑 `fly.toml`，使其与您的应用名称和需求匹配。

**安全提示：** 默认配置会暴露一个公共 URL。如需无公共 IP 的加固部署，请参阅 [私有部署](#private-deployment-hardened)，或使用 `fly.private.toml`。

```toml
app = "my-openclaw"  # Your app name
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"
  OPENCLAW_PREFER_PNPM = "1"
  OPENCLAW_STATE_DIR = "/data"
  NODE_OPTIONS = "--max-old-space-size=1536"

[processes]
  app = "node dist/index.mjs gateway --allow-unconfigured --port 3000 --bind lan"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1
  processes = ["app"]

[[vm]]
  size = "shared-cpu-2x"
  memory = "2048mb"

[mounts]
  source = "openclaw_data"
  destination = "/data"
```

**关键设置：**

| 设置 | 用途 |
|---------|-----|
| `--bind lan` | 绑定到 `0.0.0.0`，以便 Fly 的代理可以访问网关 |
| `--allow-unconfigured` | 在没有配置文件的情况下启动（稍后您将创建配置文件） |
| `internal_port = 3000` | 必须与 `--port 3000`（或 `OPENCLAW_GATEWAY_PORT`）匹配，以进行 Fly 健康检查 |
| `memory = "2048mb"` | 512MB 太小；建议使用 2GB |
| `OPENCLAW_STATE_DIR = "/data"` | 在卷上持久化状态 |

## 3) 设置密钥

```bash
# Required: Gateway token (for non-loopback binding)
fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

# Model provider API keys
fly secrets set ANTHROPIC_API_KEY=sk-ant-...

# Optional: Other providers
fly secrets set OPENAI_API_KEY=sk-...
fly secrets set GOOGLE_API_KEY=...

# Channel tokens
fly secrets set DISCORD_BOT_TOKEN=MTQ...
```

**注意事项：**
- 非环回绑定（`--bind lan`）出于安全考虑需要 `OPENCLAW_GATEWAY_TOKEN`。
- 请将这些令牌视为密码。
- 对于所有 API 密钥和令牌，**优先使用环境变量而非配置文件**。这样可将密钥保存在 `openclaw.json` 之外，避免意外暴露或记录。

## 4) 部署

```bash
fly deploy
```

首次部署会构建 Docker 镜像（约 2–3 分钟）。后续部署速度更快。

部署完成后，请验证：
```bash
fly status
fly logs
```

您应看到：
```
[gateway] listening on ws://0.0.0.0:3000 (PID xxx)
[discord] logged in to discord as xxx
```

## 5) 创建配置文件

通过 SSH 登录到机器以创建正确的配置：

```bash
fly ssh console
```

创建配置目录和文件：
```bash
mkdir -p /data
cat > /data/openclaw.json << 'EOF'
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-opus-4-5",
        "fallbacks": ["anthropic/claude-sonnet-4-5", "openai/gpt-4o"]
      },
      "maxConcurrent": 4
    },
    "list": [
      {
        "id": "main",
        "default": true
      }
    ]
  },
  "auth": {
    "profiles": {
      "anthropic:default": { "mode": "token", "provider": "anthropic" },
      "openai:default": { "mode": "token", "provider": "openai" }
    }
  },
  "bindings": [
    {
      "agentId": "main",
      "match": { "channel": "discord" }
    }
  ],
  "channels": {
    "discord": {
      "enabled": true,
      "groupPolicy": "allowlist",
      "guilds": {
        "YOUR_GUILD_ID": {
          "channels": { "general": { "allow": true } },
          "requireMention": false
        }
      }
    }
  },
  "gateway": {
    "mode": "local",
    "bind": "auto"
  },
  "meta": {
    "lastTouchedVersion": "2026.1.29"
  }
}
EOF
```

**注意：** 使用 `OPENCLAW_STATE_DIR=/data` 时，配置路径为 `/data/openclaw.json`。

**注意：** Discord 令牌可来自以下任一来源：
- 环境变量：`DISCORD_BOT_TOKEN`（推荐用于保密）
- 配置文件：`channels.discord.token`

如果使用环境变量，则无需将令牌添加到配置中。网关会自动读取 `DISCORD_BOT_TOKEN`。

重启以生效：
```bash
exit
fly machine restart <machine-id>
```

## 6) 访问网关

### 控制 UI

在浏览器中打开：
```bash
fly open
```

或访问 `https://my-openclaw.fly.dev/`

粘贴您的网关令牌（来自 `OPENCLAW_GATEWAY_TOKEN`），以进行身份验证。

### 日志

```bash
fly logs              # Live logs
fly logs --no-tail    # Recent logs
```

### SSH 控制台

```bash
fly ssh console
```

## 故障排除

### “应用未监听预期地址”

网关绑定到 `127.0.0.1`，而不是 `0.0.0.0`。

**修复：** 将 `--bind lan` 添加到您在 `fly.toml` 中的进程命令中。

### 健康检查失败 / 连接被拒绝

Fly 无法通过配置的端口访问网关。

**修复：** 确保 `internal_port` 与网关端口匹配（设置 `--port 3000` 或 `OPENCLAW_GATEWAY_PORT=3000`）。

### OOM / 内存问题

容器不断重启或被杀死。迹象：`SIGABRT`、`v8::internal::Runtime_AllocateInYoungGeneration`，或无声重启。

**修复：** 在 `fly.toml` 中增加内存：
```toml
[[vm]]
  memory = "2048mb"
```

或更新现有机器：
```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**注意：** 512MB 太小。1GB 可能适用，但在负载较高或日志记录较多时仍可能出现 OOM。**建议使用 2GB。**

### 网关锁定问题

网关因“已在运行”的错误而拒绝启动。

这种情况发生在容器重启后，但 PID 锁定文件仍保留在卷上。

**修复：** 删除锁定文件：
```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

锁定文件位于 `/data/gateway.*.lock`（不在子目录中）。

### 配置未被读取

如果您使用 `--allow-unconfigured`，网关会创建一个最小配置。您在 `/data/openclaw.json` 中的自定义配置应在重启时被读取。

验证配置是否存在：
```bash
fly ssh console --command "cat /data/openclaw.json"
```

### 通过 SSH 编写配置

`fly ssh console -C` 命令不支持 shell 重定向。要编写配置文件：

```bash
# Use echo + tee (pipe from local to remote)
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# Or use sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**注意：** 如果文件已存在，`fly sftp` 可能会失败。请先删除：
```bash
fly ssh console --command "rm /data/openclaw.json"
```

### 状态未持久化

如果在重启后丢失凭据或会话，说明状态目录正在写入容器文件系统。

**修复：** 确保在 `fly.toml` 中设置了 `OPENCLAW_STATE_DIR=/data`，并重新部署。

## 更新

```bash
# Pull latest changes
git pull

# Redeploy
fly deploy

# Check health
fly status
fly logs
```

### 更新机器命令

如果您需要在不进行完整重新部署的情况下更改启动命令：

```bash
# Get machine ID
fly machines list

# Update command
fly machine update <machine-id> --command "node dist/index.mjs gateway --port 3000 --bind lan" -y

# Or with memory increase
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.mjs gateway --port 3000 --bind lan" -y
```

**注意：** 在 `fly deploy` 之后，机器命令可能会重置为 `fly.toml` 中的内容。如果您进行了手动更改，请在部署后重新应用。

## 私有部署（加固）

默认情况下，Fly 会分配公共 IP，使您的网关可通过 `https://your-app.fly.dev` 访问。这很方便，但也意味着您的部署可被互联网扫描器（Shodan、Censys 等）发现。

对于**无公开暴露**的加固部署，请使用私有模板。

### 何时使用私有部署

- 您仅进行**出站**调用/消息（无入站 webhook）
- 您使用 **ngrok 或 Tailscale** 隧道处理任何 webhook 回调
- 您通过 **SSH、代理或 WireGuard** 而不是浏览器访问网关
- 您希望部署**对互联网扫描器隐藏**

### 设置

使用 `fly.private.toml` 代替标准配置：

```bash
# Deploy with private config
fly deploy -c fly.private.toml
```

或转换现有部署：

```bash
# List current IPs
fly ips list -a my-openclaw

# Release public IPs
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# Switch to private config so future deploys don't re-allocate public IPs
# (remove [http_service] or deploy with the private template)
fly deploy -c fly.private.toml

# Allocate private-only IPv6
fly ips allocate-v6 --private -a my-openclaw
```

此后，`fly ips list` 应仅显示 `private` 类型的 IP：
```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### 访问私有部署

由于没有公共 URL，可使用以下方法之一：

**选项 1：本地代理（最简单）**
```bash
# Forward local port 3000 to the app
fly proxy 3000:3000 -a my-openclaw

# Then open http://localhost:3000 in browser
```

**选项 2：WireGuard VPN**
```bash
# Create WireGuard config (one-time)
fly wireguard create

# Import to WireGuard client, then access via internal IPv6
# Example: http://[fdaa:x:x:x:x::x]:3000
```

**选项 3：仅限 SSH**
```bash
fly ssh console -a my-openclaw
```

### 私有部署中的 Webhook

如果您需要在无公开暴露的情况下实现 webhook 回调（Twilio、Telnyx 等）：

1. **ngrok 隧道** - 在容器内或作为旁路容器运行 ngrok
2. **Tailscale Funnel** - 通过 Tailscale 暴露特定路径
3. **仅出站** - 某些提供商（如 Twilio）在没有 webhook 的情况下也能很好地处理出站调用

带有 ngrok 的语音呼叫配置示例：
```json
{
  "plugins": {
    "entries": {
      "voice-call": {
        "enabled": true,
        "config": {
          "provider": "twilio",
          "tunnel": { "provider": "ngrok" }
        }
      }
    }
  }
}
```

ngrok 隧道在容器内运行，提供一个公共 webhook URL，而不会暴露 Fly 应用本身。

### 安全优势

| 方面 | 公共 | 私有 |
|--------|--------|---------|
| 互联网扫描器 | 可发现 | 隐藏 |
| 直接攻击 | 可能 | 被阻止 |
| 控制 UI 访问 | 浏览器 | 代理/VPN |
| Webhook 交付 | 直接 | 通过隧道 |

## 注意事项

- Fly.io 使用 **x86 架构**（非 ARM）
- Dockerfile 兼容两种架构
- 对于 WhatsApp/Telegram 上线，请使用 `fly ssh console`
- 持久化数据存储在卷上的 `/data`
- Signal 需要 Java + signal-cli；请使用自定义镜像，并将内存保持在 2GB 以上。

## 成本

使用推荐配置（`shared-cpu-2x`, 2GB RAM）：
- 根据使用情况，每月约 $10–15
- 免费层级包含一定额度

有关详细信息，请参阅 [Fly.io 定价](https://fly.io/docs/about/pricing/)。

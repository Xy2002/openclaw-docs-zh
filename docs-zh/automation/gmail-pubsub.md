---
summary: Gmail Pub/Sub push wired into OpenClaw webhooks via gogcli
read_when:
  - Wiring Gmail inbox triggers to OpenClaw
  - Setting up Pub/Sub push for agent wake
---
# Gmail Pub/Sub -> OpenClaw

目标：Gmail 监视 -> Pub/Sub 推送 -> `gog gmail watch serve` -> OpenClaw 网页挂钩。

## 先决条件

- 已安装并登录 `gcloud`（参见 [安装指南](https://docs.cloud.google.com/sdk/docs/install-sdk))。
- 已安装并为 Gmail 帐户授权 `gog` (gogcli)（参见 [gogcli.sh](https://gogcli.sh/))。
- 已启用 OpenClaw 挂钩（参见 [Webhooks](/automation/webhook))。
- 已登录 `tailscale`（参见 [tailscale.com](https://tailscale.com/))。我们支持的设置使用 Tailscale Funnel 作为公共 HTTPS 端点。
  其他隧道服务也可以使用，但需要自行配置且不受支持，需手动连接。
  目前我们仅支持 Tailscale。

示例挂钩配置（启用 Gmail 预设映射）：

```json5
{
  hooks: {
    enabled: true,
    token: "OPENCLAW_HOOK_TOKEN",
    path: "/hooks",
    presets: ["gmail"]
  }
}
```

要将 Gmail 摘要传递到聊天界面，可通过覆盖预设映射来设置 `deliver` + 可选的 `channel`/`to`：

```json5
{
  hooks: {
    enabled: true,
    token: "OPENCLAW_HOOK_TOKEN",
    presets: ["gmail"],
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate:
          "New email from {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}\n{{messages[0].body}}",
        model: "openai/gpt-5.2-mini",
        deliver: true,
        channel: "last"
        // to: "+15551234567"
      }
    ]
  }
}
```

如果您希望使用固定频道，请设置 `channel` + `to`。否则，`channel: "last"` 将使用上次的交付路由（回退到 WhatsApp）。

要为 Gmail 运行强制使用更便宜的模型，请在映射中设置 `model`（`provider/model` 或别名）。如果您强制启用 `agents.defaults.models`，请将其包含在映射中。

要为 Gmail 挂钩专门设置默认模型和思维层级，请在您的配置中添加 `hooks.gmail.model` / `hooks.gmail.thinking`：

```json5
{
  hooks: {
    gmail: {
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off"
    }
  }
}
```

注意事项：
- 映射中的每挂钩 `model`/`thinking` 仍会覆盖这些默认值。
- 回退顺序：`hooks.gmail.model` → `agents.defaults.model.fallbacks` → 主模型（认证/速率限制/超时）。
- 如果设置了 `agents.defaults.models`，Gmail 模型必须在白名单中。
- 默认情况下，Gmail 挂钩内容会被外部内容安全边界包裹。要禁用（有风险），请设置 `hooks.gmail.allowUnsafeExternalContent: true`。

要进一步自定义负载处理，可在 `hooks.transformsDir` 下添加 `hooks.mappings` 或 JS/TS 转换模块（参见 [Webhooks](/automation/webhook))。

## 向导（推荐）

使用 OpenClaw 助手将所有内容串联起来（通过 brew 在 macOS 上安装依赖项）：

```bash
openclaw webhooks gmail setup \
  --account openclaw@gmail.com
```

默认设置：
- 使用 Tailscale Funnel 作为公共推送端点。
- 为 `openclaw webhooks gmail run` 写入 `hooks.gmail` 配置。
- 启用 Gmail 挂钩预设（`hooks.presets: ["gmail"]`）。

路径说明：当 `tailscale.mode` 启用时，OpenClaw 会自动将 `hooks.gmail.serve.path` 设置为 `/`，并将公共路径保持在 `hooks.gmail.tailscale.path`（默认 `/gmail-pubsub`），因为 Tailscale 在代理之前会剥离设置路径前缀。
如果需要后端接收带前缀的路径，请将 `hooks.gmail.tailscale.target`（或 `--tailscale-target`）设置为类似 `http://127.0.0.1:8788/gmail-pubsub` 的完整 URL，并匹配 `hooks.gmail.serve.path`。

想要自定义端点？使用 `--push-endpoint <url>` 或 `--tailscale off`。

平台说明：在 macOS 上，向导会通过 Homebrew 安装 `gcloud`、`gogcli` 和 `tailscale`；在 Linux 上则需先手动安装。

网关自动启动（推荐）：
- 当设置 `hooks.enabled=true` 和 `hooks.gmail.account` 时，Gateway 会在启动时启动 `gog gmail watch serve` 并自动续订监视。
- 设置 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 可选择退出（如果您自己运行守护进程，则很有用）。
- 请勿同时运行手动守护进程，否则会触发 `listen tcp 127.0.0.1:8788: bind: address already in use`。

手动守护进程（启动 `gog gmail watch serve` + 自动续订）：

```bash
openclaw webhooks gmail run
```

## 一次性设置

1) 选择 **拥有 OAuth 客户端** 的 GCP 项目，该客户端由 `gog` 使用。

```bash
gcloud auth login
gcloud config set project <project-id>
```

注意：Gmail 监视要求 Pub/Sub 主题与 OAuth 客户端位于同一项目中。

2) 启用 API：

```bash
gcloud services enable gmail.googleapis.com pubsub.googleapis.com
```

3) 创建主题：

```bash
gcloud pubsub topics create gog-gmail-watch
```

4) 允许 Gmail 推送发布：

```bash
gcloud pubsub topics add-iam-policy-binding gog-gmail-watch \
  --member=serviceAccount:gmail-api-push@system.gserviceaccount.com \
  --role=roles/pubsub.publisher
```

## 开始监视

```bash
gog gmail watch start \
  --account openclaw@gmail.com \
  --label INBOX \
  --topic projects/<project-id>/topics/gog-gmail-watch
```

保存输出中的 `history_id`（用于调试）。

## 运行推送处理器

本地示例（共享令牌认证）：

```bash
gog gmail watch serve \
  --account openclaw@gmail.com \
  --bind 127.0.0.1 \
  --port 8788 \
  --path /gmail-pubsub \
  --token <shared> \
  --hook-url http://127.0.0.1:18789/hooks/gmail \
  --hook-token OPENCLAW_HOOK_TOKEN \
  --include-body \
  --max-bytes 20000
```

注意事项：
- `--token` 保护推送端点（`x-gog-token` 或 `?token=`）。
- `--hook-url` 指向 OpenClaw 的 `/hooks/gmail`（映射；隔离运行 + 摘要发送至主流程）。
- `--include-body` 和 `--max-bytes` 控制发送给 OpenClaw 的正文片段。

推荐：`openclaw webhooks gmail run` 包装了相同的流程，并自动续订监视。

## 公开处理器（高级，不支持）

如果您需要非 Tailscale 隧道，请手动连接并使用推送订阅中的公共 URL（不支持，无防护措施）：

```bash
cloudflared tunnel --url http://127.0.0.1:8788 --no-autoupdate
```

使用生成的 URL 作为推送端点：

```bash
gcloud pubsub subscriptions create gog-gmail-watch-push \
  --topic gog-gmail-watch \
  --push-endpoint "https://<public-url>/gmail-pubsub?token=<shared>"
```

生产环境：使用稳定的 HTTPS 端点并配置 Pub/Sub OIDC JWT，然后运行：

```bash
gog gmail watch serve --verify-oidc --oidc-email <svc@...>
```

## 测试

向受监视的收件箱发送消息：

```bash
gog gmail send \
  --account openclaw@gmail.com \
  --to openclaw@gmail.com \
  --subject "watch test" \
  --body "ping"
```

检查监视状态和历史记录：

```bash
gog gmail watch status --account openclaw@gmail.com
gog gmail history --account openclaw@gmail.com --since <historyId>
```

## 故障排除

- `Invalid topicName`：项目不匹配（主题不在 OAuth 客户端项目中）。
- `User not authorized`：主题缺少 `roles/pubsub.publisher`。
- 空消息：Gmail 推送仅提供 `historyId`；可通过 `gog gmail history` 获取。

## 清理

```bash
gog gmail watch stop --account openclaw@gmail.com
gcloud pubsub subscriptions delete gog-gmail-watch-push
gcloud pubsub topics delete gog-gmail-watch
```

---
summary: 'Runbook for the Gateway service, lifecycle, and operations'
read_when:
  - Running or debugging the gateway process
---
# 网关服务运行手册

最后更新日期：2025-12-09

## 服务简介
- 始终运行的进程，负责维护与 Baileys/Telegram 的单一连接，并管理控制/事件平面。
- 替代旧版 `gateway` 命令。CLI 入口点：`openclaw gateway`。
- 服务将持续运行直至被停止；在发生严重错误时以非零退出码终止，以便监督系统自动重启。

## 本地运行方法
```bash
openclaw gateway --port 18789
# for full debug/trace logs in stdio:
openclaw gateway --port 18789 --verbose
# if the port is busy, terminate listeners then start:
openclaw gateway --force
# dev loop (auto-reload on TS changes):
pnpm gateway:watch
```
- 配置热重载会监视 `~/.openclaw/openclaw.json`（或 `OPENCLAW_CONFIG_PATH`）。
  - 默认模式：`gateway.reload.mode="hybrid"`（安全应用热更改，关键问题时重启）。
  - 必要时通过 **SIGUSR1** 触发进程内重启来实现热重载。
  - 可通过 `gateway.reload.mode="off"` 禁用热重载。
- WebSocket 控制平面绑定到 `127.0.0.1:<port>`（默认 18789）。
- 同一端口还提供 HTTP 服务（控制 UI、钩子、A2UI），实现单端口多路复用。
  - OpenAI Chat Completions（HTTP）：[`/v1/chat/completions`](/gateway/openai-http-api)。
  - OpenResponses（HTTP）：[`/v1/responses`](/gateway/openresponses-http-api)。
  - Tools Invoke（HTTP）：[`/tools/invoke`](/gateway/tools-invoke-http-api)。
- 默认在 `canvasHost.port`（默认 `18793`）启动 Canvas 文件服务器，从 `~/.openclaw/workspace/canvas` 提供 `http://<gateway-host>:18793/__openclaw__/canvas/`。可通过 `canvasHost.enabled=false` 或 `OPENCLAW_SKIP_CANVAS_HOST=1` 禁用。
- 日志输出到标准输出；使用 launchd/systemd 保持服务运行并轮转日志。
- 传递 `--verbose` 可将调试日志（握手、请求/响应、事件）从日志文件镜像到标准输出，便于故障排除。
- `--force` 使用 `lsof` 查找选定端口上的监听进程，发送 SIGTERM，记录已终止的进程，然后启动网关（若缺少 `lsof`，则快速失败）。
- 如果在 supervisor（launchd/systemd/mac 应用子进程模式）下运行，停止或重启通常会发送 **SIGTERM**；较旧版本可能会将此作为 `pnpm` `ELIFECYCLE` 退出码 **143**（SIGTERM）报告，这表示正常关闭，而非崩溃。
- **SIGUSR1** 在授权时触发进程内重启（网关工具/配置应用/更新，或启用 `commands.restart` 进行手动重启）。
- 默认需要网关身份验证：设置 `gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）或 `gateway.auth.password`。客户端必须发送 `connect.params.auth.token/password`，除非使用 Tailscale Serve 身份。
- 向导现在默认生成令牌，即使在环回模式下也是如此。
- 端口优先级：`--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > 默认 `18789`。

## 远程访问
- 推荐使用 Tailscale/VPN；否则可使用 SSH 隧道：
  ```bash
  ssh -N -L 18789:127.0.0.1:18789 user@host
  ```
- 客户端随后通过隧道连接到 `ws://127.0.0.1:18789`。
- 如果配置了令牌，客户端即使通过隧道也必须在 `connect.params.auth.token` 中包含该令牌。

## 同一主机上的多个网关

通常无需多个网关：一个网关即可为多个消息通道和代理提供服务。仅在需要冗余或严格隔离（如救援机器人）时才使用多个网关。

如果隔离状态和配置并使用唯一端口，则支持多网关部署。完整指南：[多网关](/gateway/multiple-gateways)。

服务名称具有配置文件感知：
- macOS：`bot.molt.<profile>`（旧版 `com.openclaw.*` 可能仍存在）
- Linux：`openclaw-gateway-<profile>.service`
- Windows：`OpenClaw Gateway (<profile>)`

安装元数据嵌入在服务配置中：
- `OPENCLAW_SERVICE_MARKER=openclaw`
- `OPENCLAW_SERVICE_KIND=gateway`
- `OPENCLAW_SERVICE_VERSION=<version>`

救援机器人模式：保留第二个网关，为其分配独立的配置文件、状态目录、工作区和基础端口间隔。完整指南：[救援机器人指南](/gateway/multiple-gateways#rescue-bot-guide)。

### 开发者配置文件 (`--dev`)

快速路径：运行完全隔离的开发实例（配置/状态/工作区），而不影响主设置。

```bash
openclaw --dev setup
openclaw --dev gateway --allow-unconfigured
# then target the dev instance:
openclaw --dev status
openclaw --dev health
```

默认值（可通过环境变量/标志/配置覆盖）：
- `OPENCLAW_STATE_DIR=~/.openclaw-dev`
- `OPENCLAW_CONFIG_PATH=~/.openclaw-dev/openclaw.json`
- `OPENCLAW_GATEWAY_PORT=19001`（网关 WS + HTTP）
- 浏览器控制服务端口 = `19003`（派生：`gateway.port+2`，仅限环回）
- `canvasHost.port=19005`（派生：`gateway.port+4`）
- 当您在 `--dev` 下运行 `setup`/`onboard` 时，`agents.defaults.workspace` 默认变为 `~/.openclaw/workspace-dev`。

派生端口规则：
- 基础端口 = `gateway.port`（或 `OPENCLAW_GATEWAY_PORT` / `--port`）
- 浏览器控制服务端口 = 基础端口 + 2（仅限环回）
- `canvasHost.port = base + 4`（或 `OPENCLAW_CANVAS_HOST_PORT` / 配置覆盖）
- 浏览器配置文件 CDP 端口从 `browser.controlPort + 9 .. + 108` 自动分配（按配置文件持久化）。

每个实例的检查清单：
- 唯一的 `gateway.port`
- 唯一的 `OPENCLAW_CONFIG_PATH`
- 唯一的 `OPENCLAW_STATE_DIR`
- 唯一的 `agents.defaults.workspace`
- 独立的 WhatsApp 号码（如果使用 WA）

按配置文件安装服务：
```bash
openclaw --profile main gateway install
openclaw --profile rescue gateway install
```

示例：
```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json OPENCLAW_STATE_DIR=~/.openclaw-a openclaw gateway --port 19001
OPENCLAW_CONFIG_PATH=~/.openclaw/b.json OPENCLAW_STATE_DIR=~/.openclaw-b openclaw gateway --port 19002
```

## 协议（操作员视角）
- 完整文档：[网关协议](/gateway/protocol) 和 [桥接协议（旧版）](/gateway/bridge-protocol)。
- 客户端必须发送的第一个帧： `req {type:"req", id, method:"connect", params:{minProtocol,maxProtocol,client:{id,displayName?,version,platform,deviceFamily?,modelIdentifier?,mode,instanceId?}, caps, auth?, locale?, userAgent? } }`。
- 网关回复 `res {type:"res", id, ok:true, payload:hello-ok }`（或带有错误的 `ok:false`，然后关闭连接）。
- 握手完成后：
  - 请求：`{type:"req", id, method, params}` → `{type:"res", id, ok, payload|error}`
  - 事件：`{type:"event", event, payload, seq?, stateVersion?}`
- 结构化 Presence 条目：`{host, ip, version, platform?, deviceFamily?, modelIdentifier?, mode, lastInputSeconds?, ts, reason?, tags?[], instanceId? }`（对于 WS 客户端，`instanceId` 来自 `connect.client.instanceId`）。
- `agent` 响应分为两个阶段：首先 `res` 确认 `{runId,status:"accepted"}`，然后在运行结束后发送最终的 `res` `{runId,status:"ok"|"error",summary}`；流式输出以 `event:"agent"` 形式到达。

## 方法（初始集合）
- `health` — 完整健康快照（与 `openclaw health --json` 形状相同）。
- `status` — 简短摘要。
- `system-presence` — 当前 Presence 列表。
- `system-event` — 发布一条 Presence/系统备注（结构化）。
- `send` — 通过活动通道发送消息。
- `agent` — 运行代理回合（在同一连接上流式传输事件）。
- `node.list` — 列出配对及当前连接的节点（包括 `caps`、`deviceFamily`、`modelIdentifier`、`paired`、`connected` 以及公布的 `commands`）。
- `node.describe` — 描述一个节点（能力及支持的 `node.invoke` 命令；适用于配对节点和当前连接的未配对节点）。
- `node.invoke` — 在节点上执行命令（例如 `canvas.*`、`camera.*`）。
- `node.pair.*` — 配对生命周期（`request`、`list`、`approve`、`reject`、`verify`）。

另请参阅：[Presence](/concepts/presence)，了解如何生成和去重 Presence，以及为何稳定的 `client.instanceId` 至关重要。

## 事件
- `agent` — 从代理运行中流式传输工具/输出事件（带序列标记）。
- `presence` — Presence 更新（带 stateVersion 的增量）推送给所有连接的客户端。
- `tick` — 定期保活/空操作，用于确认存活状态。
- `shutdown` — 网关即将退出；有效载荷包括 `reason` 和可选的 `restartExpectedMs`。客户端应重新连接。

## WebChat 集成
- WebChat 是原生 SwiftUI UI，直接与网关 WebSocket 通信，获取历史记录、发送、中止和事件。
- 远程使用通过相同的 SSH/Tailscale 隧道；如果配置了网关令牌，客户端会在 `connect` 时包含该令牌。
- macOS 应用通过单个 WS 连接（共享连接）；它从初始快照中填充 Presence，并监听 `presence` 事件以更新 UI。

## 类型检查与验证
- 服务器使用 AJV 根据协议定义生成的 JSON Schema 验证每个传入帧。
- 客户端（TS/Swift）消费生成的类型（TS 直接；Swift 通过仓库的生成器）。
- 协议定义是事实的来源；可通过以下命令重新生成模式/模型：
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`

## 连接快照
- `hello-ok` 包含一个 `snapshot`，其中包含 `presence`、`health`、`stateVersion` 和 `uptimeMs`，以及 `policy {maxPayload,maxBufferedBytes,tickIntervalMs}`，使客户端无需额外请求即可立即渲染。
- `health`/`system-presence` 仍然可用于手动刷新，但在连接时并非必需。

## 错误代码（res.error 形状）
- 错误使用 `{ code, message, details?, retryable?, retryAfterMs? }`。
- 标准错误代码：
  - `NOT_LINKED` — WhatsApp 未认证。
  - `AGENT_TIMEOUT` — 代理未在配置的截止时间内响应。
  - `INVALID_REQUEST` — 模式/参数验证失败。
  - `UNAVAILABLE` — 网关正在关闭或依赖项不可用。

## 保活行为
- `tick` 事件（或 WS ping/pong）定期发出，使客户端即使在没有流量时也能知道网关仍然存活。
- 发送/代理确认仍然是单独的响应；不要为了发送而过度加载心跳。

## 回放/间隙
- 事件不会被回放。客户端检测到序列间隙后应刷新（`health` + `system-presence`）后再继续。WebChat 和 macOS 客户端现在会在出现间隙时自动刷新。

## 监督（macOS 示例）
- 使用 launchd 保持服务运行：
  - Program：指向 `openclaw` 的路径
  - Arguments：`gateway`
  - KeepAlive：true
  - StandardOut/Err：文件路径或 `syslog`
- 失败时，launchd 会重启；严重的配置错误应持续退出，以便操作员注意到。
- LaunchAgents 是按用户划分的，需要登录会话；对于无头设置，使用自定义 LaunchDaemon（未随附）。
  - `openclaw gateway install` 写入 `~/Library/LaunchAgents/bot.molt.gateway.plist`
    （或 `bot.molt.<profile>.plist`；旧版 `com.openclaw.*` 已清理）。
  - `openclaw doctor` 审计 LaunchAgent 配置并可将其更新为当前默认值。

## 网关服务管理（CLI）

使用网关 CLI 进行安装/启动/停止/重启/状态查询：

```bash
openclaw gateway status
openclaw gateway install
openclaw gateway stop
openclaw gateway restart
openclaw logs --follow
```

注意事项：
- `gateway status` 默认使用服务解析的端口/配置探测网关 RPC（可用 `--url` 覆盖）。
- `gateway status --deep` 添加系统级扫描（LaunchDaemons/系统单元）。
- `gateway status --no-probe` 跳过 RPC 探测（在网络中断时有用）。
- `gateway status --json` 对脚本稳定。
- `gateway status` 分别报告 **supervisor runtime**（launchd/systemd 是否运行）和 **RPC 可达性**（WS 连接 + 状态 RPC）。
- `gateway status` 打印配置路径 + 探测目标，以避免“localhost vs LAN 绑定”混淆和配置文件不匹配。
- `gateway status` 在服务看似运行但端口关闭时包含最后一行网关错误信息。
- `logs` 通过 RPC 尾随网关文件日志（无需手动 `tail`/`grep`）。
- 如果检测到其他类似网关的服务，CLI 会发出警告，除非它们是 OpenClaw 配置文件服务。
  我们仍然建议大多数设置采用 **每台机器一个网关**；对于冗余或救援机器人，请使用隔离的配置文件/端口。详情请参见 [多网关](/gateway/multiple-gateways)。
  - 清理：`openclaw gateway uninstall`（当前服务）和 `openclaw doctor`（旧版迁移）。
- `gateway install` 在已安装时为无操作；使用 `openclaw gateway install --force` 重新安装（配置/环境/路径变更）。

捆绑的 macOS 应用：
- OpenClaw.app 可捆绑基于 Node 的网关中继，并安装名为 `bot.molt.gateway`（或 `bot.molt.<profile>`；旧版 `com.openclaw.*` 标签仍可干净卸载）的用户级 LaunchAgent。
- 要干净地停止它，使用 `openclaw gateway stop`（或 `launchctl bootout gui/$UID/bot.molt.gateway`）。
- 要重启，使用 `openclaw gateway restart`（或 `launchctl kickstart -k gui/$UID/bot.molt.gateway`）。
  - `launchctl` 仅在安装了 LaunchAgent 时有效；否则需先使用 `openclaw gateway install`。
  - 运行命名配置文件时，用 `bot.molt.<profile>` 替换标签。

## 监督（systemd 用户单元）
OpenClaw 默认在 Linux/WSL2 上安装 **systemd 用户服务**。我们建议在单用户机器上使用用户服务（环境更简单，按用户配置）。对于多用户或始终在线的服务器，使用 **system 服务**（无需 linger，共享监督）。

`openclaw gateway install` 编写用户单元。`openclaw doctor` 审计单元并可将其更新为当前推荐的默认值。

创建 `~/.config/systemd/user/openclaw-gateway[-<profile>].service`：
```
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
Environment=OPENCLAW_GATEWAY_TOKEN=
WorkingDirectory=/home/youruser

[Install]
WantedBy=default.target
```
启用 linger（使用户服务在注销/空闲时仍能存活）：
```
sudo loginctl enable-linger youruser
```
首次启动时在 Linux/WSL2 上运行此操作（可能提示输入 sudo；写入 `/var/lib/systemd/linger`）。
然后启用服务：
```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

**替代方案（system 服务）** - 对于始终在线或多用户的服务器，您可以安装 systemd **system** 单位，而不是用户单位（无需 linger）。
创建 `/etc/systemd/system/openclaw-gateway[-<profile>].service`（复制上述单元，
切换 `WantedBy=multi-user.target`，设置 `User=` + `WorkingDirectory=`），然后：
```
sudo systemctl daemon-reload
sudo systemctl enable --now openclaw-gateway[-<profile>].service
```

## Windows（WSL2）

Windows 安装应使用 **WSL2**，遵循上述 Linux systemd 部分。

## 操作检查
- 存活性：打开 WS 并发送 `req:connect` → 预期收到带有 `payload.type="hello-ok"` 的 `res`（附带快照）。
- 准备性：调用 `health` → 预期收到 `ok: true`，且 `linkChannel` 中显示关联的通道（如适用）。
- 调试：订阅 `tick` 和 `presence` 事件；确保 `status` 显示关联/认证时间；Presence 条目显示网关主机和连接的客户端。

## 安全保障
- 默认假设每台主机只有一个网关；如果运行多个配置文件，需隔离端口/状态并针对正确的实例。
- 不会回退到直接的 Baileys 连接；如果网关宕机，发送将快速失败。
- 不连接的第一帧或格式错误的 JSON 将被拒绝并关闭套接字。
- 优雅关闭：在关闭前发出 `shutdown` 事件；客户端必须处理关闭并重新连接。

## CLI 辅助工具
- `openclaw gateway health|status` — 通过网关 WS 请求健康/状态。
- `openclaw message send --target <num> --message "hi" [--media ...]` — 通过网关发送消息（对 WhatsApp 是幂等的）。
- `openclaw agent --message "hi" --to <num>` — 运行代理回合（默认等待最终结果）。
- `openclaw gateway call <method> --params '{"k":"v"}'` — 用于调试的原始方法调用器。
- `openclaw gateway stop|restart` — 停止/重启受监督的网关服务（launchd/systemd）。
- 网关辅助子命令假定 `--url` 上已有运行中的网关；它们不再自动启动网关。

## 迁移指导
- 停用 `openclaw gateway` 和旧版 TCP 控制端口。
- 更新客户端，使其使用 WS 协议进行强制连接，并采用结构化的 Presence。

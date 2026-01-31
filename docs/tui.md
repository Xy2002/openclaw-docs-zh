---
summary: 'Terminal UI (TUI): connect to the Gateway from any machine'
read_when:
  - You want a beginner-friendly walkthrough of the TUI
  - 'You need the complete list of TUI features, commands, and shortcuts'
---
# TUI（终端用户界面）

## 快速入门
1) 启动网关。
```bash
openclaw gateway
```
2) 打开 TUI。
```bash
openclaw tui
```
3) 输入消息并按 Enter 键。

远程网关：
```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```
如果您的网关使用密码认证，请使用 `--password`。

## 您看到的内容
- 页眉：连接 URL、当前代理、当前会话。
- 聊天记录：用户消息、助手回复、系统通知、工具卡片。
- 状态行：连接/运行状态（连接中、运行中、流式传输中、空闲、错误）。
- 页脚：连接状态 + 代理 + 会话 + 模型 + 思考/详细推理/推理 + token 计数 + 投递。
- 输入：带有自动补全功能的文本编辑器。

## 心智模型：代理 + 会话
- 代理是唯一的 slug（例如 `main`、`research`）。网关会公开代理列表。
- 会话属于当前代理。
- 会话密钥存储为 `agent:<agentId>:<sessionKey>`。
  - 如果您输入 `/session main`，TUI 会将其扩展为 `agent:<currentAgent>:main`。
  - 如果您输入 `/session agent:other:main`，您将显式切换到该代理会话。
- 会话范围：
  - `per-sender`（默认）：每个代理可以有多个会话。
  - `global`：TUI 始终使用 `global` 会话（选择器可能为空）。
- 当前代理和会话始终显示在页脚中。

## 发送 + 投递
- 消息被发送到网关；默认情况下不向提供商投递。
- 打开投递功能：
  - `/deliver on`
  - 或通过设置面板
  - 或从 `openclaw tui --deliver` 开始

## 选择器 + 叠加层
- 模型选择器：列出可用模型并设置会话覆盖。
- 代理选择器：选择不同的代理。
- 会话选择器：仅显示当前代理的会话。
- 设置：切换投递、工具输出展开以及思考可见性。

## 键盘快捷键
- Enter：发送消息
- Esc：中止当前运行
- Ctrl+C：清除输入（按两次退出）
- Ctrl+D：退出
- Ctrl+L：模型选择器
- Ctrl+G：代理选择器
- Ctrl+P：会话选择器
- Ctrl+O：切换工具输出展开
- Ctrl+T：切换思考可见性（重新加载历史）

## 斜杠命令
核心命令：
- `/help`
- `/status`
- `/agent <id>`（或 `/agents`）
- `/session <key>`（或 `/sessions`）
- `/model <provider/model>`（或 `/models`）

会话控制命令：
- `/think <off|minimal|low|medium|high>`
- `/verbose <on|full|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full>`
- `/elevated <on|off|ask|full>`（别名： `/elev`）
- `/activation <mention|always>`
- `/deliver <on|off>`

会话生命周期命令：
- `/new` 或 `/reset`（重置会话）
- `/abort`（中止当前运行）
- `/settings`
- `/exit`

其他网关斜杠命令（例如 `/context`）会被转发到网关，并作为系统输出显示。请参阅 [斜杠命令](/tools/slash-commands)。

## 本地 shell 命令
- 在一行前加上 `!`，即可在 TUI 主机上运行本地 shell 命令。
- TUI 每个会话会提示一次以允许本地执行；拒绝则在该会话中保持 `!` 禁用。
- 命令在 TUI 工作目录中的一个全新、非交互式 shell 中运行（没有持久的 `cd`/环境）。
- 单独的 `!` 会被当作普通消息发送；前导空格不会触发本地执行。

## 工具输出
- 工具调用以卡片形式显示，包含参数和结果。
- Ctrl+O 可在折叠和展开视图之间切换。
- 在工具运行期间，部分更新会实时流式传输到同一张卡片中。

## 历史 + 流式传输
- 连接时，TUI 会加载最新的历史记录（默认 200 条消息）。
- 流式响应会在最终确定之前原地更新。
- TUI 还会监听代理工具事件，以生成更丰富的工具卡片。

## 连接详情
- TUI 以 `mode: "tui"` 的身份向网关注册。
- 重新连接时会显示一条系统消息；事件间隙会在日志中显示。

## 选项
- `--url <url>`：网关 WebSocket URL（默认为配置或 `ws://127.0.0.1:<port>`）
- `--token <token>`：网关令牌（如需要）
- `--password <password>`：网关密码（如需要）
- `--session <key>`：会话密钥（默认： `main`，或当作用域为全局时为 `global`）
- `--deliver`：是否将助手回复投递到提供商（默认关闭）
- `--thinking <level>`：覆盖发送时的思考级别
- `--timeout-ms <ms>`：代理超时时间（以毫秒为单位；默认为 `agents.defaults.timeoutSeconds`）

## 故障排除

发送消息后无输出：
- 在 TUI 中运行 `/status`，确认网关已连接且处于空闲或忙碌状态。
- 检查网关日志： `openclaw logs --follow`。
- 确认代理可以运行： `openclaw status` 和 `openclaw models status`。
- 如果您期望在聊天频道中收到消息，请启用投递功能（`/deliver on` 或 `--deliver`）。
- `--history-limit <n>`：要加载的历史条目数（默认 200）

## 故障排除
- `disconnected`：确保网关正在运行，并且您的 `--url/--token/--password` 正确。
- 选择器中没有代理：检查 `openclaw agents list` 和您的路由配置。
- 会话选择器为空：您可能处于全局作用域，或者尚未创建任何会话。

---
summary: 'Exec tool usage, stdin modes, and TTY support'
read_when:
  - Using or modifying the exec tool
  - Debugging stdin or TTY behavior
---
# Exec 工具

在工作区中运行 shell 命令。通过 `process` 支持前台和后台执行。
如果 `process` 被禁止，`exec` 将同步运行，并忽略 `yieldMs`/`background`。
后台会话按代理划分作用域；`process` 只能看到来自同一代理的会话。

## 参数

- `command`（必填）
- `workdir`（默认为当前工作目录）
- `env`（键值覆盖）
- `yieldMs`（默认 10000）：延迟后自动转为后台
- `background`（布尔值）：立即转为后台
- `timeout`（秒，默认 1800）：到期后终止
- `pty`（布尔值）：在可用时在伪终端中运行（仅限 TTY 的 CLI、编码代理、终端 UI）
- `host`（`sandbox | gateway | node`）：执行位置
- `security`（`deny | allowlist | full`）：针对 `gateway`/`node` 的强制模式
- `ask`（`off | on-miss | always`）：针对 `gateway`/`node` 的审批提示
- `node`（字符串）：用于 `host=node` 的节点 ID/名称
- `elevated`（布尔值）：请求提升模式（网关主机）；只有当提升解析为 `full` 时，才会强制启用 `security=full`

注意事项：
- `host` 默认为 `sandbox`。
- 当沙箱关闭时，`elevated` 会被忽略（exec 已在主机上运行）。
- `gateway`/`node` 审批由 `~/.openclaw/exec-approvals.json` 控制。
- `node` 需要配对节点（配套应用或无头节点主机）。
- 如果有多个节点可用，设置 `exec.node` 或 `tools.exec.node` 来选择一个。
- 在非 Windows 主机上，如果设置了 `SHELL`，exec 将使用它；如果 `SHELL` 是 `fish`，则优先使用 `bash`（或 `sh`）
  来自 `PATH`，以避免与 fish 不兼容的脚本，如果两者都不存在，则回退到 `SHELL`。
- 重要提示：沙箱 **默认关闭**。如果沙箱关闭，`host=sandbox` 将直接在
  网关主机上运行（无需容器），并且 **不需要审批**。若需审批，请使用
  `host=gateway` 运行，并配置 exec 审批（或启用沙箱）。

## 配置

- `tools.exec.notifyOnExit`（默认：真）：当为真时，后台 exec 会话会在退出时排队系统事件并请求心跳。
- `tools.exec.approvalRunningNoticeMs`（默认：10000）：当受审批限制的 exec 运行时间超过此值时，发出一条“正在运行”的通知（0 表示禁用）。
- `tools.exec.host`（默认：`sandbox`）
- `tools.exec.security`（默认：沙箱为 `deny`，网关 + 节点未设置时为 `allowlist`）
- `tools.exec.ask`（默认：`on-miss`）
- `tools.exec.node`（默认：未设置）
- `tools.exec.pathPrepend`：用于在 exec 运行时添加到 `PATH` 的目录列表。
- `tools.exec.safeBins`：无需显式白名单条目即可运行的仅 stdin 安全二进制文件。

示例：
```json5
{
  tools: {
    exec: {
      pathPrepend: ["~/bin", "/opt/oss/bin"]
    }
  }
}
```

### PATH 处理

- `host=gateway`：将您的登录 shell `PATH` 合并到 exec 环境中（除非 exec 调用已设置 `env.PATH`）。守护进程本身仍以最小化的 `PATH` 运行：
  - macOS：`/opt/homebrew/bin`、`/usr/local/bin`、`/usr/bin`、`/bin`
  - Linux：`/usr/local/bin`、`/usr/bin`、`/bin`
- `host=sandbox`：在容器内运行 `sh -lc`（登录 shell），因此 `/etc/profile` 可能会重置 `PATH`。
  OpenClaw 通过内部环境变量在加载配置文件后预先添加 `env.PATH`（无需 shell 插值）；
  `tools.exec.pathPrepend` 也适用于此处。
- `host=node`：只有您传递的环境变量覆盖会被发送到节点。`tools.exec.pathPrepend` 仅在 exec 调用已设置 `env.PATH` 时适用。无头节点主机仅在接受 `PATH` 时才接受，前提是它在节点主机 PATH 中添加内容（不替换）。macOS 节点完全忽略 `PATH` 覆盖。

按代理的节点绑定（在配置中使用代理列表索引）：

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

控制界面：Nodes 选项卡包含一个小的“Exec 节点绑定”面板，用于相同的设置。

## 会话覆盖（`/exec`）

使用 `/exec` 设置 `host`、`security`、`ask` 和 `node` 的 **每会话** 默认值。
发送 `/exec` 且不带参数可显示当前值。

示例：
```
/exec host=gateway security=allowlist ask=on-miss node=mac-1
```

## 授权模型

`/exec` 仅对 **授权发件人** 有效（渠道白名单/配对加上 `commands.useAccessGroups`）。
它仅更新 **会话状态**，不会写入配置。要彻底禁用 exec，可通过工具策略（`tools.deny: ["exec"]` 或按代理）予以拒绝。主机审批仍然适用，除非您明确设置
`security=full` 和 `ask=off`。

## Exec 审批（配套应用 / 节点主机）

在沙箱模式下，代理可以在 `exec` 在网关或节点主机上运行前要求逐次审批。
有关政策、白名单和 UI 流程，请参阅 [Exec 审批](/tools/exec-approvals)。

当需要审批时，exec 工具会立即返回
`status: "approval-pending"` 和一个审批 ID。一旦获得批准（或被拒绝/超时），
Gateway 会发出系统事件（`Exec finished` / `Exec denied`）。如果命令在 `tools.exec.approvalRunningNoticeMs` 后仍在运行，
则会发出一条 `Exec running` 通知。

## 白名单 + 安全二进制文件

白名单强制执行仅匹配 **解析后的二进制路径**（不匹配基本名称）。当
`security=allowlist` 时，shell 命令仅在每个管道段都列入白名单或为安全二进制文件时才会自动允许。在白名单模式下，链式调用（`;`、`&&`、`||`）和重定向将被拒绝。

## 示例

前台：
```json
{"tool":"exec","command":"ls -la"}
```

后台 + 轮询：
```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

发送按键（tmux 风格）：
```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

提交（仅发送 CR）：
```json
{"tool":"process","action":"submit","sessionId":"<id>"}
```

粘贴（默认括起来）：
```json
{"tool":"process","action":"paste","sessionId":"<id>","text":"line1\nline2\n"}
```

## apply_patch（实验性）

`apply_patch` 是 `exec` 的一个子工具，用于结构化多文件编辑。
请显式启用：

```json5
{
  tools: {
    exec: {
      applyPatch: { enabled: true, allowModels: ["gpt-5.2"] }
    }
  }
}
```

注意事项：
- 仅适用于 OpenAI/OpenAI Codex 模型。
- 工具策略仍然适用；`allow: ["exec"]` 会隐式允许 `apply_patch`。
- 配置位于 `tools.exec.applyPatch` 下。

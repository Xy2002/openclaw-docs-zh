---
title: Sandbox vs Tool Policy vs Elevated
summary: >-
  Why a tool is blocked: sandbox runtime, tool allow/deny policy, and elevated
  exec gates
read_when: >-
  You hit 'sandbox jail' or see a tool/elevated refusal and want the exact
  config key to change.
status: active
---
# 沙盒、工具策略与提升

OpenClaw 提供了三项相关但不同的控制机制：

1. **沙盒**（`agents.defaults.sandbox.*` / `agents.list[].sandbox.*`）决定**工具在何处运行**（Docker 容器或主机）。
2. **工具策略**（`tools.*`、`tools.sandbox.tools.*`、`agents.list[].tools.*`）决定**哪些工具可用或被允许**。
3. **提升**（`tools.elevated.*`、`agents.list[].tools.elevated.*`）是一个仅用于执行的“逃生舱口”，在你处于沙盒环境中时，允许你在主机上运行。

## 快速调试

使用检查器查看 OpenClaw *实际*执行的操作：

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

它会输出：
- 实际生效的沙盒模式、作用域和工作区访问权限
- 会话当前是否处于沙盒中（主会话 vs 非主会话）
- 实际生效的沙盒工具允许/禁止规则（以及该规则来自代理、全局还是默认设置）
- 提升门控及其修复密钥路径

## 沙盒：工具运行的位置

沙盒由 `agents.defaults.sandbox.mode` 控制：
- `"off"`：所有内容都在主机上运行。
- `"non-main"`：只有非主会话会被沙盒化（这通常是群组或频道中的常见“意外”）。
- `"all"`：所有内容都被沙盒化。

完整矩阵（作用域、工作区挂载、镜像）请参见 [沙盒化](/gateway/sandboxing)。

### 绑定挂载（安全快速检查）

- `docker.binds` 会*穿透*沙盒文件系统：无论你挂载什么，在容器内都将以你设定的模式可见（`:ro` 或 `:rw`）。
- 如果省略模式，默认为读写；对于源代码或机密数据，建议使用 `:ro`。
- `scope: "shared"` 会忽略代理特定的绑定设置，仅应用全局绑定。
- 绑定 `/var/run/docker.sock` 实际上将主机控制权交给了沙盒环境；请谨慎使用此选项。
- 工作区访问权限（`workspaceAccess: "ro"`/`"rw"`）与绑定模式无关。

## 工具策略：哪些工具存在或可调用

有两个层次起作用：
- **工具配置文件**：`tools.profile` 和 `agents.list[].tools.profile`（基础白名单）
- **提供商工具配置文件**：`tools.byProvider[provider].profile` 和 `agents.list[].tools.byProvider[provider].profile`
- **全局/代理工具策略**：`tools.allow`/`tools.deny` 和 `agents.list[].tools.allow`/`agents.list[].tools.deny`
- **提供商工具策略**：`tools.byProvider[provider].allow/deny` 和 `agents.list[].tools.byProvider[provider].allow/deny`
- **沙盒工具策略**（仅在沙盒环境中适用）：`tools.sandbox.tools.allow`/`tools.sandbox.tools.deny` 和 `agents.list[].tools.sandbox.tools.*`

经验法则：
- `deny` 始终优先。
- 如果 `allow` 不为空，则其他所有规则均被视为已阻止。
- 工具策略是硬性限制：`/exec` 无法覆盖已被拒绝的 `exec` 工具。
- `/exec` 仅更改授权发送者的会话默认设置，并不授予工具访问权限。
提供商工具密钥接受 `provider`（如 `google-antigravity`）或 `provider/model`（如 `openai/gpt-5.2`）。

### 工具组（快捷方式）

全局、代理和沙盒工具策略支持 `group:*` 条目，这些条目会展开为多个工具：

```json5
{
  tools: {
    sandbox: {
      tools: {
        allow: ["group:runtime", "group:fs", "group:sessions", "group:memory"]
      }
    }
  }
}
```

可用的工具组包括：
- `group:runtime`：`exec`、`bash`、`process`
- `group:fs`：`read`、`write`、`edit`、`apply_patch`
- `group:sessions`：`sessions_list`、`sessions_history`、`sessions_send`、`sessions_spawn`、`session_status`
- `group:memory`：`memory_search`、`memory_get`
- `group:ui`：`browser`、`canvas`
- `group:automation`：`cron`、`gateway`
- `group:messaging`：`message`
- `group:nodes`：`nodes`
- `group:openclaw`：所有内置 OpenClaw 工具（不包括提供商插件）

## 提升：仅用于执行的“在主机上运行”

提升**并不**赋予额外的工具；它只影响 `exec`。
- 如果你处于沙盒中，`/elevated on`（或配合 `exec` 使用 `elevated: true`）将在主机上运行（仍可能受批准流程约束）。
- 使用 `/elevated full` 可跳过会话的执行批准。
- 如果你已经直接运行，提升实际上不起作用（但仍受门控限制）。
- 提升**不**按技能范围划分，且**不会**覆盖工具的允许或禁止规则。
- `/exec` 与提升是独立的。它仅调整授权发送者的每会话执行默认设置。

门控：
- 启用：`tools.elevated.enabled`（以及可选的 `agents.list[].tools.elevated.enabled`）
- 发送者白名单：`tools.elevated.allowFrom.<provider>`（以及可选的 `agents.list[].tools.elevated.allowFrom.<provider>`）

更多信息请参见 [提升模式](/tools/elevated)。

## 常见“沙盒牢笼”修复方法

### “工具 X 被沙盒工具策略阻止”

修复密钥（任选其一）：
- 禁用沙盒：`agents.defaults.sandbox.mode=off`（或代理特定的 `agents.list[].sandbox.mode=off`）
- 在沙盒中允许该工具：
  - 从 `tools.sandbox.tools.deny` 中移除该工具（或代理特定的 `agents.list[].tools.sandbox.tools.deny`）
  - 或将其添加到 `tools.sandbox.tools.allow`（或代理特定的允许列表）

### “我以为这是主会话，为什么它被沙盒化？”

在 `"non-main"` 模式下，群组或频道密钥**并非**主会话密钥。请使用主会话密钥（由 `sandbox explain` 显示）或切换模式至 `"off"`。

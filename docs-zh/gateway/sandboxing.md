---
summary: 'How OpenClaw sandboxing works: modes, scopes, workspace access, and images'
title: Sandboxing
read_when: >-
  You want a dedicated explanation of sandboxing or need to tune
  agents.defaults.sandbox.
status: active
---
# 沙箱机制

OpenClaw 可以在 **Docker 容器中运行工具**，从而缩小潜在的破坏范围。此功能是 **可选的**，由配置控制（`agents.defaults.sandbox` 或 `agents.list[].sandbox`）。如果未启用沙箱，工具将直接在宿主机上运行。网关始终运行在宿主机上；当沙箱功能启用时，工具执行将在隔离的沙箱环境中进行。

虽然这并非完美的安全边界，但在模型做出不当行为时，它能显著限制对文件系统和进程的访问权限。

## 哪些内容会被沙箱化
- 工具执行（`exec`、`read`、`write`、`edit`、`apply_patch`、`process` 等）。
- 可选的沙箱浏览器（`agents.defaults.sandbox.browser`）。
  - 默认情况下，当浏览器工具需要时，沙箱浏览器会自动启动（确保 CDP 可达）。可通过 `agents.defaults.sandbox.browser.autoStart` 和 `agents.defaults.sandbox.browser.autoStartTimeoutMs` 进行配置。
  - `agents.defaults.sandbox.browser.allowHostControl` 允许沙箱会话显式指向宿主机浏览器。
  - 可选的白名单通过 `target: "custom"` 进行管控：`allowedControlUrls`、`allowedControlHosts`、`allowedControlPorts`。

未被沙箱化的：
- 网关进程本身。
- 显式允许在宿主机上运行的任何工具（例如 `tools.elevated`）。
  - **提升权限的执行会在宿主机上运行，并绕过沙箱保护。**
  - 如果沙箱未启用，`tools.elevated` 不会影响执行方式（因为工具本就运行在宿主机上）。请参阅 [提升模式](/tools/elevated)。

## 模式
`agents.defaults.sandbox.mode` 控制 **何时** 使用沙箱：
- `"off"`：不使用沙箱。
- `"non-main"`：仅对 **非主会话** 使用沙箱（如果您希望普通聊天在宿主机上进行，则为默认设置）。
- `"all"`：所有会话都在沙箱中运行。

注意：`"non-main"` 基于 `session.mainKey`（默认为 `"main"`），而非代理 ID。群组或频道会话使用各自的密钥，因此被视为非主会话，并将被沙箱化。

## 范围
`agents.defaults.sandbox.scope` 控制 **创建多少个容器**：
- `"session"`（默认）：每个会话一个容器。
- `"agent"`：每个代理一个容器。
- `"shared"`：所有沙箱会话共享一个容器。

## 工作区访问
`agents.defaults.sandbox.workspaceAccess` 控制 **沙箱可以看到什么**：
- `"none"`（默认）：工具看到位于 `~/.openclaw/sandboxes` 下的沙箱工作区。
- `"ro"`：以只读方式挂载代理工作区至 `/agent`（禁用 `write`/`edit`/`apply_patch`）。
- `"rw"`：以读写方式挂载代理工作区至 `/workspace`。

传入的媒体会被复制到活动的沙箱工作区（`media/inbound/*`）。技能说明：`read` 工具位于沙箱根目录下。借助 `workspaceAccess: "none"`，OpenClaw 会将符合条件的技能镜像到沙箱工作区（`.../skills`），以便这些技能可以被读取。通过 `"rw"`，工作区中的技能可以通过 `/workspace/skills` 被读取。

## 自定义绑定挂载
`agents.defaults.sandbox.docker.binds` 将额外的宿主机目录挂载到容器中。
格式：`host:container:mode`（例如，`"/home/user/source:/source:rw"`）。

全局和每代理的绑定会 **合并**，而不是替换。在 `scope: "shared"` 下，每代理的绑定会被忽略。

示例（只读源 + Docker 套接字）：

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          binds: [
            "/home/user/source:/source:ro",
            "/var/run/docker.sock:/var/run/docker.sock"
          ]
        }
      }
    },
    list: [
      {
        id: "build",
        sandbox: {
          docker: {
            binds: ["/mnt/cache:/cache:rw"]
          }
        }
      }
    ]
  }
}
```

安全注意事项：
- 绑定绕过了沙箱文件系统：它们会以您设置的模式暴露宿主机路径（`:ro` 或 `:rw`）。
- 敏感挂载（如 `docker.sock`、秘密、SSH 密钥）除非绝对必要，否则应避免使用 `:ro`。
- 如果您只需要对工作区的只读访问权限，可结合 `workspaceAccess: "ro"` 使用；绑定模式保持独立。
- 请参阅 [沙箱 vs 工具策略 vs 提升权限](/gateway/sandbox-vs-tool-policy-vs-elevated)，了解绑定如何与工具策略和提升权限执行相互作用。

## 镜像与设置
默认镜像：`openclaw-sandbox:bookworm-slim`

只需构建一次：
```bash
scripts/sandbox-setup.sh
```

注意：默认镜像 **不包含 Node**。如果某个技能需要 Node（或其他运行时），您可以构建自定义镜像，或通过 `sandbox.docker.setupCommand` 进行安装（需要网络出口、可写根目录以及 root 用户）。

沙箱浏览器镜像：
```bash
scripts/sandbox-browser-setup.sh
```

默认情况下，沙箱容器 **无网络连接**。可通过 `agents.defaults.sandbox.docker.network` 进行覆盖。

Docker 的安装以及容器化的网关可在此处找到：
[Docker](/install/docker)

## setupCommand（一次性容器设置）
`setupCommand` 在沙箱容器创建后 **仅运行一次**（不是每次运行时都执行）。它通过 `sh -lc` 在容器内执行。

路径：
- 全局：`agents.defaults.sandbox.docker.setupCommand`
- 每代理：`agents.list[].sandbox.docker.setupCommand`


常见陷阱：
- 默认的 `docker.network` 是 `"none"`（无出口），因此包安装会失败。
- `readOnlyRoot: true` 会阻止写操作；请设置 `readOnlyRoot: false` 或构建自定义镜像。
- `user` 必须以 root 身份运行才能安装包（请勿省略 `user` 或设置 `user: "0:0"`）。
- 沙箱执行 **不会继承** 宿主机的 `process.env`。对于技能 API 密钥，请使用 `agents.defaults.sandbox.docker.env`（或自定义镜像）。

## 工具策略与逃生舱口
在应用沙箱规则之前，工具允许/拒绝策略仍然适用。如果某项工具在全球或针对特定代理被拒绝，沙箱机制无法将其重新启用。

`tools.elevated` 是一个显式的逃生舱口，可在宿主机上运行 `exec`。
`/exec` 指令仅适用于授权发送者，并在会话级别持续生效；要彻底禁用，应使用工具策略中的拒绝指令（请参阅 [沙箱 vs 工具策略 vs 提升权限](/gateway/sandbox-vs-tool-policy-vs-elevated))。

调试：
- 使用 `openclaw sandbox explain` 来检查有效的沙箱模式、工具策略以及修复配置键。
- 请参阅 [沙箱 vs 工具策略 vs 提升权限](/gateway/sandbox-vs-tool-policy-vs-elevated)，以理解“为什么这项被阻止？”的心理模型。务必保持严格的锁定状态。

## 多代理覆盖
每个代理都可以覆盖沙箱和工具设置：
`agents.list[].sandbox` 和 `agents.list[].tools`（以及 `agents.list[].tools.sandbox.tools` 用于沙箱工具策略）。
有关优先级的详细信息，请参阅 [多代理沙箱与工具](/multi-agent-sandbox-tools)。

## 最小启用示例
```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none"
      }
    }
  }
}
```

## 相关文档
- [沙箱配置](/gateway/configuration#agentsdefaults-sandbox)
- [多代理沙箱与工具](/multi-agent-sandbox-tools)
- [安全](/gateway/security)

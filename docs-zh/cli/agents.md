---
summary: CLI reference for `openclaw agents` (list/add/delete/set identity)
read_when:
  - You want multiple isolated agents (workspaces + routing + auth)
---
# `openclaw agents`

管理隔离代理（工作区 + 身份验证 + 路由）。

相关：
- 多代理路由：[多代理路由](/concepts/multi-agent)
- 代理工作区：[代理工作区](/concepts/agent-workspace)

## 示例

```bash
openclaw agents list
openclaw agents add work --workspace ~/.openclaw/workspace-work
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
openclaw agents set-identity --agent main --avatar avatars/openclaw.png
openclaw agents delete work
```

## 身份文件

每个代理工作区可在工作区根目录下包含一个 `IDENTITY.md`：
- 示例路径：`~/.openclaw/workspace/IDENTITY.md`
- `set-identity --from-identity` 从工作区根目录（或显式指定的 `--identity-file`）读取身份信息

头像路径会相对于工作区根目录进行解析。

## 设置身份

`set-identity` 将字段写入 `agents.list[].identity`：
- `name`
- `theme`
- `emoji`
- `avatar`（工作区相对路径、http(s) URL 或数据 URI）

从 `IDENTITY.md` 加载：

```bash
openclaw agents set-identity --workspace ~/.openclaw/workspace --from-identity
```

显式覆盖字段：

```bash
openclaw agents set-identity --agent main --name "OpenClaw" --emoji "🦞" --avatar avatars/openclaw.png
```

配置示例：

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "OpenClaw",
          theme: "space lobster",
          emoji: "🦞",
          avatar: "avatars/openclaw.png"
        }
      }
    ]
  }
}
```

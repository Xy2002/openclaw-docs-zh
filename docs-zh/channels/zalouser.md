---
summary: >-
  Zalo personal account support via zca-cli (QR login), capabilities, and
  configuration
read_when:
  - Setting up Zalo Personal for OpenClaw
  - Debugging Zalo Personal login or message flow
---
# Zalo 个人版（非官方）

状态：实验性。此集成通过 `zca-cli` 自动化一个 **个人 Zalo 账号**。

> **警告：** 这是一个非官方集成，可能导致账号被暂停或封禁。请自行承担使用风险。

## 需要插件
Zalo 个人版以插件形式提供，不包含在核心安装中。
- 通过 CLI 安装：`openclaw plugins install @openclaw/zalouser`
- 或从源代码检出安装：`openclaw plugins install ./extensions/zalouser`
- 详情：[插件](/plugin)

## 先决条件：zca-cli
网关机器必须在 `PATH` 中提供 `zca` 二进制文件。

- 验证：`zca --version`
- 如果缺失，请安装 zca-cli（参见 `extensions/zalouser/README.md` 或上游 zca-cli 文档）。

## 快速设置（初学者）
1) 安装插件（见上文）。
2) 登录（二维码，在网关机器上）：
   - `openclaw channels login --channel zalouser`
   - 使用 Zalo 移动应用扫描终端中的二维码。
3) 启用渠道：

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing"
    }
  }
}
```

4) 重启网关（或完成初始设置）。
5) 私信访问默认为配对；首次联系时，请批准配对码。

## 功能简介
- 使用 `zca listen` 接收入站消息。
- 使用 `zca msg ...` 发送回复（文本/媒体/链接）。
- 专为无法使用 Zalo Bot API 的“个人账号”用例设计。

## 命名
渠道 ID 为 `zalouser`，以明确表示此集成自动化的是一个 **个人 Zalo 用户账号**（非官方）。我们保留 `zalo` 用于未来可能的官方 Zalo API 集成。

## 查找 ID（目录）
使用目录 CLI 发现对等节点/群组及其 ID：

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## 限制
- 出站文本会被分块，每块约 2000 个字符（受 Zalo 客户端限制）。
- 流式传输默认被阻止。

## 访问控制（私信）
`channels.zalouser.dmPolicy` 支持：`pairing | allowlist | open | disabled`（默认：`pairing`）。
`channels.zalouser.allowFrom` 接受用户 ID 或名称。向导会在可用时通过 `zca friend find` 将名称解析为 ID。

批准方式：
- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## 群组访问（可选）
- 默认：`channels.zalouser.groupPolicy = "open"`（允许群组）。未设置时，使用 `channels.defaults.groupPolicy` 覆盖默认设置。
- 通过以下方式限制为白名单：
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups`（键为群组 ID 或名称）
- 阻止所有群组： `channels.zalouser.groupPolicy = "disabled"`。
- 配置向导可以提示输入群组白名单。
- 在启动时，OpenClaw 会将白名单中的群组/用户名称解析为 ID，并记录映射关系；未解析的条目将按原样保留。

示例：
```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "123456789": { allow: true },
        "Work Chat": { allow: true }
      }
    }
  }
}
```

## 多账号
账号映射到 zca 配置文件。示例：

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      defaultAccount: "default",
      accounts: {
        work: { enabled: true, profile: "work" }
      }
    }
  }
}
```

## 故障排除

**未找到 `zca`：**
- 安装 zca-cli，并确保它位于网关进程的 `PATH` 中。

**登录不稳定：**
- `openclaw channels status --probe`
- 重新登录：`openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

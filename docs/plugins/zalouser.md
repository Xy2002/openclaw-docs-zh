---
summary: >-
  Zalo Personal plugin: QR login + messaging via zca-cli (plugin install +
  channel config + CLI + tool)
read_when:
  - You want Zalo Personal (unofficial) support in OpenClaw
  - You are configuring or developing the zalouser plugin
---
# Zalo Personal（插件）

通过插件为 OpenClaw 提供 Zalo Personal 支持，使用 `zca-cli` 自动化普通 Zalo 用户账户。

> **警告：** 非官方自动化可能导致账户被暂停或封禁。请自担风险使用。

## 命名
频道 ID 为 `zalouser`，以明确表示此插件用于自动化 **个人 Zalo 用户账户**（非官方）。我们保留 `zalo` 以备未来可能的官方 Zalo API 集成。

## 运行位置
此插件在 **网关进程内部** 运行。

如果您使用远程网关，请在 **运行网关的机器** 上安装并配置该插件，然后重启网关。

## 安装

### 方案 A：从 npm 安装

```bash
openclaw plugins install @openclaw/zalouser
```

之后重启网关。

### 方案 B：从本地文件夹安装（开发环境）

```bash
openclaw plugins install ./extensions/zalouser
cd ./extensions/zalouser && pnpm install
```

之后重启网关。

## 先决条件：zca-cli
网关所在机器必须在 `PATH` 上安装 `zca`：

```bash
zca --version
```

## 配置
频道配置位于 `channels.zalouser` 下（而非 `plugins.entries.*`）：

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

## CLI

```bash
openclaw channels login --channel zalouser
openclaw channels logout --channel zalouser
openclaw channels status --probe
openclaw message send --channel zalouser --target <threadId> --message "Hello from OpenClaw"
openclaw directory peers list --channel zalouser --query "name"
```

## 代理工具
工具名称：`zalouser`

操作：`send`、`image`、`link`、`friends`、`groups`、`me`、`status`

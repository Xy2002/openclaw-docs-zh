---
summary: macOS Skills settings UI and gateway-backed status
read_when:
  - Updating the macOS Skills settings UI
  - Changing skills gating or install behavior
---
# 技能（macOS）

macOS 应用通过网关展示 OpenClaw 技能；它不会在本地解析技能。

## 数据源
- `skills.status`（网关）返回所有技能，以及它们的资格状态和缺失的要求（包括针对捆绑技能的白名单限制）。
- 要求是从每个 `SKILL.md` 中的 `metadata.openclaw.requires` 派生而来的。

## 安装操作
- `metadata.openclaw.install` 定义了安装选项（brew/node/go/uv）。
- 应用调用 `skills.install` 在网关主机上运行安装程序。
- 当提供多个安装程序时，网关仅显示一个首选安装程序：如果有 brew，则使用 brew；否则使用来自 `skills.install` 的 node 管理器；默认使用 npm。

## 环境变量/API 密钥
- 应用将密钥存储在 `~/.openclaw/openclaw.json` 下的 `skills.entries.<skillKey>` 中。
- `skills.update` 会修补 `enabled`、`apiKey` 和 `env`。

## 远程模式
- 安装和配置更新在网关主机上进行（而不是在本地 Mac 上）。

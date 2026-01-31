---
summary: 'Bun workflow (experimental): installs and gotchas vs pnpm'
read_when:
  - You want the fastest local dev loop (bun + watch)
  - You hit Bun install/patch/lifecycle script issues
---
# Bun（实验性）

目标：在不偏离 pnpm 工作流的前提下，使用 **Bun** 运行此仓库（可选，但不推荐用于 WhatsApp/Telegram）。

⚠️ **不推荐用于网关运行时**（WhatsApp/Telegram 存在 bug）。生产环境请使用 Node。

## 状态

- Bun 是一个可选的本地运行时，可用于直接运行 TypeScript（`bun run …`、`bun --watch …`）。
- `pnpm` 仍是构建的默认选项，并且完全受支持（部分文档工具仍在使用它）。
- Bun 无法使用 `pnpm-lock.yaml`，并将忽略该配置。

## 安装

默认安装：

```sh
bun install
```

注意：`bun.lock`/`bun.lockb` 已被 .gitignore 忽略，因此无论选择哪种方式都不会导致代码库频繁变动。若你希望 *完全不写入 lockfile*：

```sh
bun install --no-save
```

## 构建与测试（Bun）

```sh
bun run build
bun run vitest run
```

## Bun 生命周期脚本（默认被阻止）

Bun 可能会阻止依赖项的生命周期脚本，除非显式信任它们（`bun pm untrusted` / `bun pm trust`）。对于本仓库，以下通常被阻止的脚本并非必需：

- `@whiskeysockets/baileys` `preinstall`：检查 Node 主版本是否 ≥ 20（我们使用 Node 22+）。
- `protobufjs` `postinstall`：发出关于不兼容版本方案的警告（无构建产物）。

如果你遇到需要这些脚本的真实运行时问题，请显式信任它们：

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## 注意事项

- 某些脚本仍硬编码了 pnpm（例如 `docs:build`、`ui:*`、`protocol:check`）。目前，请通过 pnpm 运行这些脚本。

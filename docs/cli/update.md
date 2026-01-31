---
summary: >-
  CLI reference for `openclaw update` (safe-ish source update + gateway
  auto-restart)
read_when:
  - You want to update a source checkout safely
  - You need to understand `--update` shorthand behavior
---
# `openclaw update`

安全更新 OpenClaw，并在稳定/测试/开发通道之间切换。

如果您通过 **npm/pnpm** 安装（全局安装，无 Git 元数据），更新将通过包管理器流程进行，详情请参见 [更新](/install/updating)。

## 使用方法

```bash
openclaw update
openclaw update status
openclaw update wizard
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag beta
openclaw update --no-restart
openclaw update --json
openclaw --update
```

## 选项

- `--no-restart`: 在成功更新后跳过重启 Gateway 服务。
- __ INLINE_CODE_4__: 设置更新通道（Git + npm；持久化在配置中）。
- `--tag <dist-tag|version>`: 仅针对本次更新覆盖 npm dist-tag 或版本。
- `--json`: 输出机器可读的 `UpdateRunResult` JSON。
- `--timeout <seconds>`: 每个步骤的超时时间（默认为 1200 秒）。

注意：降级需要确认，因为旧版本可能会破坏配置。

## `update status`

显示当前活动的更新通道以及 Git 标签/分支/SHA（用于源码检出），并显示是否有可用更新。

```bash
openclaw update status
openclaw update status --json
openclaw update status --timeout 10
```

选项：
- `--json`: 输出机器可读的状态 JSON。
- `--timeout <seconds>`: 检查的超时时间（默认为 3 秒）。

## `update wizard`

交互式流程，用于选择更新通道，并确认是否在更新后重启 Gateway（默认为重启）。如果您在没有 Git 检出的情况下选择 `dev`，系统会提示您创建一个检出。

## 功能说明

当您显式切换通道时（`--channel ...`），OpenClaw 还会确保安装方式与之匹配：

- `dev` → 确保使用 Git 检出（默认：`~/openclaw`，可通过 `OPENCLAW_GIT_DIR` 覆盖），更新检出代码，并从该检出中安装全局 CLI。
- `stable`/`beta` → 使用匹配的 dist-tag 从 npm 安装。

## Git 检出流程

通道：
- `stable`: 检出最新的非测试版标签，然后执行构建和检查。
- `beta`: 检出最新的 `-beta` 标签，然后执行构建和检查。
- `dev`: 检出 `main`，然后执行获取和变基操作。

高级流程：
1. 要求工作树干净（无未提交的更改）。
2. 切换到选定的通道（标签或分支）。
3. 获取上游代码（仅限开发通道）。
4. 仅限开发通道：在临时工作树中执行预检查的 lint 和 TypeScript 构建；如果最新提交失败，则回溯最多 10 个提交，以找到最近的干净构建。
5. 基于选定的提交进行变基（仅限开发通道）。
6. 安装依赖项（优先使用 pnpm，备用 npm）。
7. 执行构建，并构建 Control UI。
8. 运行 `openclaw doctor` 作为最后的“安全更新”检查。
9. 将插件同步到当前活动通道（开发通道使用捆绑扩展；稳定/测试通道使用 npm 插件），并更新通过 npm 安装的插件。

## `--update` 简写

`openclaw --update` 会被重写为 `openclaw update`（适用于 shell 和启动脚本）。

## 参见

- `openclaw doctor`（在 Git 检出上优先运行更新）
- [开发通道](/install/development-channels)
- [更新](/install/updating)
- [CLI 参考](/cli)

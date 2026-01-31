---
summary: 'Stable, beta, and dev channels: semantics, switching, and tagging'
read_when:
  - You want to switch between stable/beta/dev
  - You are tagging or publishing prereleases
---
# 开发渠道

最后更新：2026-01-21

OpenClaw 提供三个更新渠道：

- **stable**：npm dist-tag `latest`。
- **beta**：npm dist-tag `beta`（正在测试的构建）。
- **dev**：指向 `main`（git）的最新提交。npm dist-tag：`dev`（发布时）。

我们先将构建推送到 **beta**，对其进行测试，然后将经过验证的构建 **提升到 `latest`**，
而无需更改版本号——npm 安装以 dist-tag 为准。

## 切换渠道

Git 检出：

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

- `stable`/`beta` 检出最新的匹配标签（通常与当前标签相同）。
- `dev` 切换到 `main` 并基于上游进行变基。

npm/pnpm 全局安装：

```bash
openclaw update --channel stable
openclaw update --channel beta
openclaw update --channel dev
```

这会通过相应的 npm dist-tag 更新（`latest`、`beta`、`dev`）。

当你 **显式** 使用 `--channel` 切换渠道时，OpenClaw 还会同步安装方式：

- `dev` 确保使用 git 检出（默认为 `~/openclaw`，可通过 `OPENCLAW_GIT_DIR` 覆盖），
  更新检出代码，并从该检出中安装全局 CLI。
- `stable`/`beta` 使用匹配的 dist-tag 从 npm 安装。

提示：如果你想同时使用 stable 和 dev，请保留两个克隆副本，并将网关指向 stable 版本。

## 插件与渠道

当你使用 `openclaw update` 切换渠道时，OpenClaw 还会同步插件源：

- `dev` 优先使用来自 git 检出的捆绑插件。
- `stable` 和 `beta` 恢复通过 npm 安装的插件包。

## 标签的最佳实践

- 为希望 git 检出落地的版本打上标签（`vYYYY.M.D` 或 `vYYYY.M.D-<patch>`）。
- 保持标签不可变：切勿移动或重复使用标签。
- npm dist-tag 仍然是 npm 安装的事实来源：
  - `latest` → stable
  - `beta` → 候选构建
  - `dev` → 主快照（可选）

## macOS 应用的可用性

Beta 和 dev 构建可能 **不** 包含 macOS 应用版本。这是可以接受的：

- git 标签和 npm dist-tag 仍然可以发布。
- 在发布说明或变更日志中注明“此 beta 版无 macOS 构建”。

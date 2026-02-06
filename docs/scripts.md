---
summary: 'Repository scripts: purpose, scope, and safety notes'
read_when:
  - Running scripts from the repo
  - Adding or changing scripts under ./scripts
---
# 脚本

`scripts/` 目录包含用于本地工作流和运维任务的辅助脚本。
当某项任务明显与脚本相关时，请使用这些脚本；否则请优先使用 CLI。

## 规范

- 除非在文档或发布检查清单中特别说明，否则脚本为**可选**。
- 如果存在 CLI 接口，请优先使用 CLI（例如，身份验证监控使用 `openclaw models status --check`）。
- 假设脚本是特定于主机的；在新机器上运行脚本之前，请先仔细阅读脚本内容。

__HEADING_0__Git钩子

- `scripts/setup-git-hooks.js`：在 Git 仓库中为 `core.hooksPath` 提供尽力而为的设置。
- `scripts/format-staged.js`：用于暂存的 `src/` 和 `test/` 文件的 pre-commit 格式化工具。

## 身份验证监控脚本

身份验证监控脚本在此处记录：
[/automation/auth-monitoring](/automation/auth-monitoring)

## 添加脚本时

- 保持脚本专注并附有文档。
- 在相关文档中添加简短条目（如果文档缺失，则创建新文档）。

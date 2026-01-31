---
summary: How to run tests locally (vitest) and when to use force/coverage modes
read_when:
  - Running or fixing tests
---
# 测试

- 完整测试套件（测试用例、实时测试、Docker）：[测试](/testing)

- `pnpm test:force`：终止任何仍在运行并占用默认控制端口的网关进程，然后使用隔离的网关端口运行完整的 Vitest 测试套件，以避免服务器测试与正在运行的实例发生冲突。如果之前的网关运行导致端口 18789 被占用，请使用此命令。
- `pnpm test:coverage`：使用 V8 覆盖率运行 Vitest。全局阈值为 70% 的行/分支/函数/语句覆盖率。覆盖率不包括集成密集型入口点（CLI 配置、网关/Telegram 桥接、Webchat 静态服务器），以确保目标专注于可单元测试的逻辑。
- `pnpm test:e2e`：运行网关端到端冒烟测试（多实例 WS/HTTP/node 配对）。
- `pnpm test:live`：运行提供商实时测试（minimax/zai）。需要 API 密钥以及 `LIVE=1`（或特定于提供商的 `*_LIVE_TEST=1`）才能取消跳过。

## 模型延迟基准测试（本地密钥）

脚本：[`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

用法：
- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- 可选环境变量：`MINIMAX_API_KEY`、`MINIMAX_BASE_URL`、`MINIMAX_MODEL`、`ANTHROPIC_API_KEY`
- 默认提示：“请用一个词回复：ok。不要添加标点符号或额外文本。”

最近一次运行（2025-12-31，20 次运行）：
- minimax 中位数 1279 毫秒（最小值 1114，最大值 2431）
- opus 中位数 2454 毫秒（最小值 1224，最大值 3170）

## 上手流程端到端测试（Docker）

Docker 是可选的；仅在需要容器化的上手流程冒烟测试时才使用。

在干净的 Linux 容器中执行完整冷启动流程：

```bash
scripts/e2e/onboard-docker.sh
```

此脚本通过伪终端驱动交互式向导，验证配置/工作区/会话文件，然后启动网关并运行 `openclaw health`。

## QR 导入冒烟测试（Docker）

确保 `qrcode-terminal` 在 Docker 中的 Node 22+ 环境下能够正常加载：

```bash
pnpm test:docker:qr
```

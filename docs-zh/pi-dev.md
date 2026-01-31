# Pi 开发工作流

本指南总结了在 OpenClaw 中进行 pi 集成开发时的合理工作流。

## 类型检查与 lint 检查

- 类型检查与构建：`pnpm build`
- Lint 检查：`pnpm lint`
- 格式检查：`pnpm format`
- 在推送前运行完整 gate：`pnpm lint && pnpm build && pnpm test`

## 运行 Pi 测试

使用专为 pi 集成测试集设计的脚本：

```bash
scripts/pi/run-tests.sh
```

要包含模拟真实提供商行为的实时测试：

```bash
scripts/pi/run-tests.sh --live
```

该脚本通过以下 glob 模式运行所有与 pi 相关的单元测试：

- `src/agents/pi-*.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-tool-definition-adapter.test.ts`
- `src/agents/pi-extensions/*.test.ts`

## 手动测试

推荐流程如下：

- 以开发模式运行网关：
  - `pnpm gateway:dev`
- 直接触发代理：
  - `pnpm openclaw agent --message "Hello" --thinking low`
- 使用 TUI 进行交互式调试：
  - `pnpm tui`

对于工具调用行为，提示用户执行 `read` 或 `exec` 操作，以便查看工具流式传输和有效载荷处理。

## 清除状态重置

状态存储在 OpenClaw 的状态目录下。默认目录为 `~/.openclaw`。如果设置了 `OPENCLAW_STATE_DIR`，则使用该目录。

要重置所有内容：

- `openclaw.json` 用于配置
- `credentials/` 用于身份验证配置文件和令牌
- `agents/<agentId>/sessions/` 用于代理会话历史记录
- `agents/<agentId>/sessions.json` 用于会话索引
- `sessions/` 如果存在旧版路径
- `workspace/` 如果你希望获得一个空白工作区

如果你只想重置会话，删除该代理的 `agents/<agentId>/sessions/` 和 `agents/<agentId>/sessions.json`。如果你不想重新进行身份验证，请保留 `credentials/`。

## 参考资料

- https://docs.openclaw.ai/testing
- https://docs.openclaw.ai/start/getting-started
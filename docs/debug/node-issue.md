---
summary: Node + tsx "__name is not a function" crash notes and workarounds
read_when:
  - Debugging Node-only dev scripts or watch mode failures
  - Investigating tsx/esbuild loader crashes in OpenClaw
---
# 在 Node + tsx 中因“__name 不是函数”而导致的崩溃

## 摘要
当通过 Node 运行 OpenClaw 时，使用 `tsx` 导致启动失败，错误信息如下：

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

此问题始于将开发脚本从 Bun 切换到 `tsx`（提交 `2871657e`，日期为 2026-01-06）之后。在使用 Bun 时，相同的运行时路径可以正常工作。

## 环境
- Node：v25.x（已在 v25.3.0 上观察到）
- tsx：4.21.0
- 操作系统：macOS（在其他支持 Node 25 的平台上也可能复现）

## 可复现示例（仅限 Node）
```bash
# in repo root
node --version
pnpm install
node --import tsx src/entry.ts status
```

## 仓库中的最小复现
```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## Node 版本测试
- Node 25.3.0：失败
- Node 22.22.0（通过 Homebrew 安装的 `node@22`）：失败
- Node 24：尚未在此环境中安装，有待验证

## 备注/假设
- `tsx` 使用 esbuild 将 TS/ESM 转换为其他格式。esbuild 的 `keepNames` 会发出一个 `__name` 帮助函数，并用 `__name(...)` 包裹函数定义。
- 崩溃表明 `__name` 在运行时存在，但不是函数，这暗示在 Node 25 的加载器路径中，该模块的帮助函数缺失或被覆盖。
- 类似的 `__name` 帮助函数问题已在其他使用 esbuild 的项目中报告，通常是因为帮助函数缺失或被重写。

## 回归历史
- `2871657e`（2026-01-06）：脚本从 Bun 切换到 tsx，使 Bun 成为可选依赖。
- 在此之前（Bun 路径），`openclaw status` 和 `gateway:watch` 工作正常。

## 临时解决方案
- 在开发脚本中继续使用 Bun（当前的临时回滚方案）。
- 使用 Node + tsc watch 编译代码，然后运行编译后的输出：
  ```bash
  pnpm exec tsc --watch --preserveWatchOutput
  node --watch openclaw.mjs status
  ```
- 经本地验证， `pnpm exec tsc -p tsconfig.json` + `node openclaw.mjs status` 在 Node 25 上可行。
- 如果可能，禁用 TS 加载器中的 esbuild keepNames 选项（这会阻止插入 `__name` 帮助函数）；目前 tsx 尚未公开此选项。
- 使用 Node LTS（22/24）配合 `tsx` 测试，以确定问题是否仅限于 Node 25。

## 参考资料
- https://opennext.js.org/cloudflare/howtos/keep_names
- https://esbuild.github.io/api/#keep-names
- https://github.com/evanw/esbuild/issues/1031

## 后续步骤
- 在 Node 22/24 上复现问题，以确认问题是否仅出现在 Node 25 中。
- 如果已知存在回归问题，可尝试 nightly 版本的 `tsx`，或锁定到较早版本进行测试。
- 如果问题在 Node LTS 上也能复现，则应向上游提交包含 `__name` 堆栈跟踪的最小复现。

---
summary: >-
  Harden cron.add input handling, align schemas, and improve cron UI/agent
  tooling
owner: openclaw
status: complete
last_updated: '2026-01-05'
---
# 为 Cron 添加加固与模式对齐

## 背景
最近的网关日志显示，多次出现 `cron.add` 失败，且失败原因均为参数无效（缺少 `sessionTarget`、`wakeMode`、`payload`，以及 `schedule` 格式错误）。这表明至少有一个客户端（很可能是代理工具调用路径）正在发送包装或部分指定的任务负载。此外，TypeScript 中的 Cron 提供商枚举、网关模式、CLI 标志和 UI 表单类型之间存在偏差，而且 UI 在 `cron.status` 上也存在不匹配——UI 预期的是 `jobCount`，而网关返回的是 `jobs`。

## 目标
- 通过规范化常见包装负载并推断缺失的 `kind` 字段，停止 `cron.add` INVALID_REQUEST 滥发。
- 在网关模式、Cron 类型、CLI 文档和 UI 表单之间对齐 Cron 提供商列表。
- 明确代理 Cron 工具的模式，以确保 LLM 生成正确的任务负载。
- 修复 Control UI 中 Cron 状态作业计数的显示问题。
- 添加测试以覆盖规范化和工具行为。

## 非目标
- 更改 Cron 调度语义或作业执行行为。
- 添加新的计划类型或改进 Cron 表达式解析。
- 对 Cron 的 UI/UX 进行全面重构，仅限于必要的字段修复。

## 发现（当前差距）
- 网关中的 `CronPayloadSchema` 排除了 `signal` 和 `imessage`，而 TypeScript 类型中包含它们。
- Control UI 的 CronStatus 预期 `jobCount`，但网关返回的是 `jobs`。
- 代理 Cron 工具模式允许任意 `job` 对象，从而导致格式错误的输入。
- 网关严格验证 `cron.add`，且不进行任何规范化，因此包装负载会失败。

## 变更内容

- `cron.add` 和 `cron.update` 现在可规范化常见包装形状，并在安全的情况下推断缺失的 `kind` 字段。
- 代理 Cron 工具模式现已与网关模式保持一致，从而减少无效负载。
- 提供商枚举已在网关、CLI、UI 和 macOS 选择器之间实现对齐。
- Control UI 使用网关的 `jobs` 计数字段来显示状态。

## 当前行为

- **规范化：** 包装的 `data`/`job` 负载会被解包；在安全的情况下，会推断出 `schedule.kind` 和 `payload.kind`。
- **默认值：** 如果缺少 `wakeMode` 和 `sessionTarget`，则应用安全的默认值。
- **提供商：** Discord/Slack/Signal/iMessage 现在在 CLI/UI 中一致显示。

有关规范化后的形状和示例，请参阅 [Cron 作业](/automation/cron-jobs)。

## 验证

- 监控网关日志，确认 `cron.add` INVALID_REQUEST 错误有所减少。
- 刷新后，确认 Control UI 中的 Cron 状态显示正确的作业计数。

## 可选后续行动

- 手动进行 Control UI 功能测试：为每个提供程序添加一个 Cron 作业，并验证状态作业计数。

## 待解决问题
- 是否应允许 `cron.add` 接受来自客户端的显式 `state`（目前模式不允许）？
- 我们是否应允许 `webchat` 作为显式交付提供商（目前在交付解析中被过滤掉）？

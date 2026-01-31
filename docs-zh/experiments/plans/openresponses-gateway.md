---
summary: >-
  Plan: Add OpenResponses /v1/responses endpoint and deprecate chat completions
  cleanly
owner: openclaw
status: draft
last_updated: '2026-01-19'
---
# OpenResponses 网关集成计划

## 背景

OpenClaw 网关目前在 `/v1/chat/completions` 上公开了一个与 OpenAI 兼容的最小 Chat Completions 端点（参见 [OpenAI Chat Completions](/gateway/openai-http-api))。

Open Responses 是一种基于 OpenAI Responses API 的开放推理标准。它专为代理工作流设计，采用基于项的输入以及语义流式事件。OpenResponses 规范定义的是 `/v1/responses`，而非 `/v1/chat/completions`。

## 目标

- 添加一个符合 OpenResponses 语义的 `/v1/responses` 端点。
- 保留 Chat Completions 作为易于禁用并最终移除的兼容层。
- 使用隔离且可重用的模式来标准化验证和解析。

## 非目标

- 第一阶段不追求 OpenResponses 功能的完全对等性（如图像、文件、托管工具）。
- 不替换内部代理执行逻辑或工具编排。
- 在第一阶段内不改变现有的 `/v1/chat/completions` 行为。

## 研究摘要

资料来源：OpenResponses OpenAPI、OpenResponses 规范网站以及 Hugging Face 博客文章。

提取的关键要点：

- `POST /v1/responses` 接受 `CreateResponseBody` 字段，例如 `model`、`input`（字符串或 `ItemParam[]`）、`instructions`、`tools`、`tool_choice`、`stream`、`max_output_tokens` 和 `max_tool_calls`。
- `ItemParam` 是一种区分联合类型，包括：
  - 带有角色 `system`、`developer`、`user`、`assistant` 的 `message` 项
  - `function_call` 和 `function_call_output`
  - `reasoning`
  - `item_reference`
- 成功响应返回一个包含 `ResponseResource` 的 `object: "response"`、`status` 和 `output` 项。
- 流式传输使用语义事件，例如：
  - `response.created`、`response.in_progress`、`response.completed`、`response.failed`
  - `response.output_item.added`、`response.output_item.done`
  - `response.content_part.added`、`response.content_part.done`
  - `response.output_text.delta`、`response.output_text.done`
- 规范要求：
  - `Content-Type: text/event-stream`
  - `event:` 必须与 JSON 中的 `type` 字段匹配
  - 终端事件必须是字面量 `[DONE]`
- 推理项可能暴露 `content`、`encrypted_content` 和 `summary`。
- HF 示例在请求中包含 `OpenResponses-Version: latest`（可选标头）。

## 拟议架构

- 添加仅包含 Zod 模式的 `src/gateway/open-responses.schema.ts`（不含网关导入）。
- 添加用于 `/v1/responses` 的 `src/gateway/openresponses-http.ts`（或 `open-responses-http.ts`）。
- 保持 `src/gateway/openai-http.ts` 完整，作为旧版兼容适配器。
- 添加配置 `gateway.http.endpoints.responses.enabled`（默认 `false`）。
- 保持 `gateway.http.endpoints.chatCompletions.enabled` 独立；允许两个端点分别切换。
- 当启用 Chat Completions 时发出启动警告，以表明其为遗留状态。

## Chat Completions 的弃用路径

- 保持严格的模块边界：响应和 Chat Completions 之间不共享模式类型。
- 通过配置使 Chat Completions 成为可选功能，以便无需更改代码即可禁用。
- 一旦 `/v1/responses` 稳定，更新文档以将 Chat Completions 标记为遗留功能。
- 未来可选步骤：将 Chat Completions 请求映射到 Responses 处理程序，以简化移除路径。

## 第一阶段支持子集

- 接受 `input` 作为字符串或 `ItemParam[]`，带有消息角色和 `function_call_output`。
- 将系统和开发者消息提取到 `extraSystemPrompt`。
- 使用最新的 `user` 或 `function_call_output` 作为代理运行的当前消息。
- 使用 `invalid_request_error` 拒绝不受支持的内容部分（图像/文件）。
- 返回一条助手消息，其中包含 `output_text` 内容。
- 在完成令牌核算之前，返回 `usage`，其值设为零。

## 验证策略（无 SDK）

- 为以下支持子集实现 Zod 模式：
  - `CreateResponseBody`
  - `ItemParam` 加上消息内容部分联合
  - `ResponseResource`
  - 网关使用的流式事件形状
- 将模式保留在单个隔离模块中，以避免漂移并支持未来的代码生成。

## 流式实现（第一阶段）

- SSE 行同时包含 `event:` 和 `data:`。
- 必需序列（最低可行）：
  - `response.created`
  - `response.output_item.added`
  - `response.content_part.added`
  - `response.output_text.delta`（根据需要重复）
  - `response.output_text.done`
  - `response.content_part.done`
  - `response.completed`
  - `[DONE]`

## 测试与验证计划

- 为 `/v1/responses` 添加端到端覆盖：
  - 需要身份验证
  - 非流式响应形状
  - 流式事件顺序及 `[DONE]`
  - 使用标头进行会话路由及 `user`
- 保持 `src/gateway/openai-http.e2e.test.ts` 不变。
- 手动测试：使用 curl 访问 `/v1/responses`，提供 `stream: true`，并验证事件顺序和终端 `[DONE]`。

## 文档更新（后续）

- 添加一个新的文档页面，介绍 `/v1/responses` 的用法和示例。
- 更新 `/gateway/openai-http-api`，添加关于其为遗留功能的说明，并指向 `/v1/responses`。

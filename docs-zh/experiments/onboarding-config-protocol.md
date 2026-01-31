---
summary: RPC protocol notes for onboarding wizard and config schema
read_when: Changing onboarding wizard steps or config schema endpoints
---
# 入门与配置协议

目的：在 CLI、macOS 应用和 Web UI 之间共享入门与配置界面。

## 组件
- 向导引擎（共享会话 + 提示 + 入门状态）。
- CLI 入门使用与 UI 客户端相同的向导流程。
- 网关 RPC 暴露向导 + 配置模式端点。
- macOS 入门使用向导步骤模型。
- Web UI 根据 JSON Schema 和 UI 提示渲染配置表单。

## 网关 RPC
- `wizard.start` 参数：`{ mode?: "local"|"remote", workspace?: string }`
- `wizard.next` 参数：`{ sessionId, answer?: { stepId, value? } }`
- `wizard.cancel` 参数：`{ sessionId }`
- `wizard.status` 参数：`{ sessionId }`
- `config.schema` 参数：`{}`

响应（形状）
- 向导：`{ sessionId, done, step?, status?, error? }`
- 配置模式：`{ schema, uiHints, version, generatedAt }`

## UI 提示
- `uiHints` 按路径键入；可选元数据（标签/帮助/分组/顺序/高级/敏感/占位符）。
- 敏感字段显示为密码输入框；不提供遮蔽层。
- 不支持的模式节点回退到原始 JSON 编辑器。

## 备注
- 本文档是跟踪入门与配置协议重构的唯一位置。

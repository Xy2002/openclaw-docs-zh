---
summary: JSON-only LLM tasks for workflows (optional plugin tool)
read_when:
  - You want a JSON-only LLM step inside workflows
  - You need schema-validated LLM output for automation
---
# LLM任务

`llm-task` 是一种**可选插件工具**，可运行仅限 JSON 的 LLM 任务，并返回结构化输出（可选择根据 JSON Schema 进行验证）。

这对于像 Lobster 这样的工作流引擎非常理想：您只需添加一个 LLM 步骤，而无需为每个工作流编写自定义 OpenClaw 代码。

## 启用插件

1) 启用插件：

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  }
}
```

2) 将该工具加入白名单（它已使用 `optional: true` 注册）：

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

## 配置（可选）

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai-codex",
          "defaultModel": "gpt-5.2",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai-codex/gpt-5.2"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels` 是一个由 `provider/model` 字符串组成的白名单。如果设置了此列表，则任何不在白名单中的请求都将被拒绝。

## 工具参数

- `prompt`（字符串，必填）
- `input`（任意类型，可选）
- `schema`（对象，可选 JSON Schema）
- `provider`（字符串，可选）
- `model`（字符串，可选）
- `authProfileId`（字符串，可选）
- `temperature`（数字，可选）
- `maxTokens`（数字，可选）
- `timeoutMs`（数字，可选）

## 输出

返回包含解析后 JSON 的 `details.json`，并在提供时根据 `schema` 进行验证。

## 示例：Lobster 工作流步骤

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "input": {
    "subject": "Hello",
    "body": "Can you help?"
  },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

## 安全注意事项

- 该工具**仅处理 JSON**，并指示模型仅输出 JSON（无代码块，无注释）。
- 在本次运行中，不会向模型暴露任何工具。
- 除非您使用 `schema` 进行验证，否则应将输出视为不可信。
- 在执行任何具有副作用的操作（发送、发布、执行）之前，请先进行批准。

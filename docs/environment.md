---
summary: Where OpenClaw loads environment variables and the precedence order
read_when:
  - 'You need to know which env vars are loaded, and in what order'
  - You are debugging missing API keys in the Gateway
  - You are documenting provider auth or deployment environments
---
# 环境变量

OpenClaw 会从多个来源提取环境变量。规则是 **绝不覆盖现有值**。

## 优先级（从高到低）

1) **进程环境**（网关进程从父 Shell 或守护进程继承的环境）。
2) **当前工作目录中的 .env 文件**（dotenv 的默认行为；不会覆盖）。
3) **位于全局目录中的 .env 文件**（又称环境配置文件；不会覆盖）。
4) **配置文件中 environment 块中的环境变量**（仅在缺失时应用）。
5) **可选的登录 Shell 导入**（.bashrc 或 .zshrc），仅在缺少预期键时应用。

如果配置文件完全缺失，步骤 4 将被跳过；但如果已启用，则仍会运行 Shell 导入。

## 配置中的 environment 块

设置内联环境变量有两种等效方式（两者均不会覆盖）：

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-..."
    }
  }
}
```

## Shell 环境导入

OpenClaw 会运行您的登录 Shell，并仅导入 **缺失** 的预期键：

```json5
{
  env: {
    shellEnv: {
      enabled: true,
      timeoutMs: 15000
    }
  }
}
```

环境变量等效项：
- .bashrc
- .zshrc

## 配置中的环境变量替换

您可以在配置字符串值中直接使用 ${VARIABLE_NAME} 语法引用环境变量：

```json5
{
  models: {
    providers: {
      "vercel-gateway": {
        apiKey: "${VERCEL_GATEWAY_API_KEY}"
      }
    }
  }
}
```

有关完整详情，请参阅 [配置：环境变量替换]。

## 相关内容

- [网关配置]
- [常见问题解答：环境变量与 .env 加载]
- [模型概览]

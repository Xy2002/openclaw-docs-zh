---
summary: Sign in to GitHub Copilot from OpenClaw using the device flow
read_when:
  - You want to use GitHub Copilot as a model provider
  - You need the `openclaw models auth login-github-copilot` flow
---
# GitHub Copilot

## 什么是GitHub Copilot？

GitHub Copilot是GitHub推出的AI编码助手。它为您的GitHub账户和订阅计划提供Copilot模型的访问权限。OpenClaw可以通过两种不同的方式将Copilot用作模型提供商。

## 在OpenClaw中使用Copilot的两种方式

### 1) 内置GitHub Copilot提供商 (`github-copilot`)

使用原生设备登录流程获取GitHub令牌，然后在OpenClaw运行时将其兑换为Copilot API令牌。这是**默认**且最简单的方式，因为它不需要Visual Studio Code。

### 2) Copilot代理插件 (`copilot-proxy`)

使用**Copilot代理**VS Code扩展作为本地桥接。OpenClaw与代理的`/v1`端点通信，并使用您在那里配置的模型列表。如果您已经在VS Code中运行Copilot代理，或者需要通过它进行路由，请选择此方法。您必须启用该插件并保持VS Code扩展处于运行状态。

将GitHub Copilot用作模型提供商 (`github-copilot`)。登录命令会运行GitHub设备流程，保存身份验证配置文件，并更新您的配置以使用该配置文件。

## CLI设置

```bash
openclaw models auth login-github-copilot
```

系统会提示您访问一个URL并输入一次性代码。请保持终端打开，直到操作完成。

### 可选标志

```bash
openclaw models auth login-github-copilot --profile-id github-copilot:work
openclaw models auth login-github-copilot --yes
```

## 设置默认模型

```bash
openclaw models set github-copilot/gpt-4o
```

### 配置片段

```json5
{
  agents: { defaults: { model: { primary: "github-copilot/gpt-4o" } } }
}
```

## 注意事项

- 需要交互式TTY；请直接在终端中运行。
- Copilot模型的可用性取决于您的订阅计划；如果某个模型被拒绝，请尝试使用其他ID（例如 `github-copilot/gpt-4.1`）。
- 登录过程会将GitHub令牌存储在身份验证配置文件存储中，并在OpenClaw运行时将其兑换为Copilot API令牌。

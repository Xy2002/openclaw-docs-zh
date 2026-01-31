---
summary: Manual logins for browser automation + X/Twitter posting
read_when:
  - You need to log into sites for browser automation
  - You want to post updates to X/Twitter
---
# 浏览器登录 + X/Twitter 发布

## 手动登录（推荐）

当某个网站需要登录时，请在**主机**浏览器配置文件（即 openclaw 浏览器）中**手动登录**。

**请勿**将您的凭据提供给模型。自动登录通常会触发反机器人防护机制，并可能导致账户被锁定。

返回主浏览器文档：[浏览器](/tools/browser)。

## 使用哪个 Chrome 配置文件？

OpenClaw 控制一个**专用的 Chrome 配置文件**（名为 `openclaw`，界面带有橙色色调）。此配置文件与您日常使用的浏览器配置文件是分开的。

有两种简便方式访问该配置文件：

1) **让代理打开浏览器**，然后您自行登录。
2) **通过 CLI 打开浏览器**：

```bash
openclaw browser start
openclaw browser open https://x.com
```

如果您有多个配置文件，请传递 `--browser-profile <name>`（默认为 `openclaw`）。

## X/Twitter：推荐流程

- **阅读/搜索/查看线程：**使用 **bird** CLI 技能（无需浏览器，稳定性高）。
  - 仓库：https://github.com/steipete/bird
- **发布更新：**使用**主机**浏览器（手动登录）。

## 沙箱环境与主机浏览器访问

在沙箱环境中运行的浏览器会话**更有可能**触发机器人检测。对于 X/Twitter 等严格站点，建议优先使用**主机**浏览器。

如果代理处于沙箱环境中，浏览器工具默认会使用沙箱浏览器。要允许主机控制：

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        browser: {
          allowHostControl: true
        }
      }
    }
  }
}
```

然后指定主机浏览器：

```bash
openclaw browser open https://x.com --browser-profile openclaw --target host
```

或者，您可以为负责发布更新的代理禁用沙箱功能。

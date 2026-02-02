---
summary: 'Chrome extension: let OpenClaw drive your existing Chrome tab'
read_when:
  - You want the agent to drive an existing Chrome tab (toolbar button)
  - You need remote Gateway + local browser automation via Tailscale
  - You want to understand the security implications of browser takeover
---
# Chrome 扩展（浏览器中继）

OpenClaw Chrome扩展使代理能够直接控制您**现有的Chrome标签页**（即您日常使用的Chrome窗口），而无需启动由OpenClaw管理的独立Chrome配置文件。只需通过**单个Chrome工具栏按钮**，即可轻松完成附加或分离操作。

## 功能概述（概念）

该功能由三个部分组成：

- **浏览器控制服务**（网关或节点）：代理/工具通过网关调用的 API
- **本地中继服务器**（环回 CDP）：在控制服务器与扩展之间建立桥梁（默认使用 `http://127.0.0.1:18792`）
- **Chrome MV3 扩展**：使用 `chrome.debugger` 附加到当前活动标签页，并将 CDP 消息转发到中继

随后，OpenClaw通过常规的`browser`工具界面控制已附加的标签页，并自动选择正确的配置文件。

## 安装/加载（未打包）

1) 将扩展安装到稳定的本地路径：

```bash
openclaw browser extension install
```

2) 输出已安装扩展的目录路径：

```bash
openclaw browser extension path
```

3) 在 Chrome 中前往 `chrome://extensions`：

- 启用“开发者模式”
- 选择“加载已解压的扩展程序”，并指定上述打印出的目录路径

4) 锁定该扩展以固定显示。

## 更新（无需构建步骤）

扩展作为静态文件随 OpenClaw 发布包（npm 包）一起提供，无需单独的“构建”步骤。

升级 OpenClaw 后：

- 重新运行 `openclaw browser extension install`，以刷新 OpenClaw 状态目录下的已安装文件。
- 在 Chrome 中前往 `chrome://extensions`，点击扩展旁边的“重新加载”按钮。

## 使用说明（无需额外配置）

OpenClaw 内置了一个名为 `chrome` 的浏览器配置文件，默认使用默认端口连接到扩展中继。您可以直接使用此配置：

- CLI：`openclaw browser --browser-profile chrome tabs`
- 代理工具：`browser` 结合 `profile="chrome"`

如果您希望使用不同的名称或中继端口，可以创建自定义配置文件：

```bash
openclaw browser create-profile \
  --name my-chrome \
  --driver extension \
  --cdp-url http://127.0.0.1:18792 \
  --color "#00AA00"
```

## 附加与分离（通过工具栏按钮）

- 打开您希望 OpenClaw 控制的标签页。
- 单击扩展图标。
  - 当标签页已附加时，图标上的徽章会显示 `ON`。
- 再次单击即可分离。

扩展会控制哪个标签页？

- 扩展**不会自动**控制“您当前查看的任何标签页”。
- 它**仅控制您通过单击工具栏按钮显式附加的标签页**。
- 若要切换标签页，请打开目标标签页，然后在该标签页上单击扩展图标。

## 徽章与常见错误

- `ON`：表示已附加，OpenClaw 可以控制该标签页。
- `…`：表示正在连接到本地中继。
- `!`：表示无法连接到中继（最常见的原因是本地中继服务器未在此设备上运行）。

如果看到 `!`：

- 确保网关在本地运行（默认设置），或者如果网关运行在其他设备上，则在此设备上运行一个节点主机。
- 打开扩展的选项页面，查看中继是否可访问。

远程网关（使用节点主机）

本地网关（与 Chrome 运行在同一设备上）——通常**无需额外步骤**

如果网关与 Chrome 运行在同一设备上，它会在环回地址上启动浏览器控制服务，并自动启动中继服务器。扩展通过本地中继进行通信；CLI 和工具调用则发送到网关。

远程网关（网关运行在其他设备上）——**需要运行节点主机**

如果您的网关运行在另一台设备上，您需要在运行 Chrome 的设备上启动一个节点主机。网关会将浏览器操作代理到该节点；扩展和中继则保留在浏览器所在的设备上。

如果连接了多个节点，可以通过 `gateway.nodes.browser.node` 锁定某个节点，或通过 `gateway.nodes.browser.mode` 设置特定节点。

沙箱化（工具容器）

如果您的代理会话处于沙箱环境中（`agents.defaults.sandbox.mode != "off"`），则 `browser` 工具可能会受到限制：

- 默认情况下，沙箱会话通常针对的是**沙箱浏览器**（`target="sandbox"`），而不是您主机上的 Chrome。
- 要接管 Chrome 扩展中继，必须控制**主机**上的浏览器控制服务。

解决方案：

- 最简单的方法是：从**非沙箱**会话或代理中使用该扩展。
- 或者为沙箱会话启用主机浏览器控制：

```json5
{
  agents: {
    defaults: {
      sandbox: {
        browser: {
          allowHostControl: true
        }
      }
    }
  }
}
```

然后确保工具未被工具策略拒绝，并在必要时使用 `browser` 并结合 `target="host"` 调用。

调试：`openclaw sandbox explain`

## 运行远程访问的提示

- 保持网关和节点主机位于同一 Tailnet 中；避免将中继端口暴露给局域网或公共互联网。
- 有意识地配对节点；如果您不希望进行远程控制，可禁用浏览器代理路由（`gateway.nodes.browser.mode="off"`）。

“扩展路径”的工作原理

`openclaw browser extension path` 会打印包含扩展文件的**已安装**磁盘目录。

CLI 有意**不**打印 `node_modules` 路径。请务必先运行 `openclaw browser extension install`，将扩展复制到 OpenClaw 状态目录下的稳定位置。

如果您移动或删除该安装目录，Chrome 会将扩展标记为损坏，直到您从有效路径重新加载它。

## 安全影响（请仔细阅读）

此功能功能强大且风险较高，应被视为赋予模型“直接操控您的浏览器”的权限。

- 扩展可以使用 Chrome 的调试器 API（`chrome.debugger`）。当扩展附加到标签页时，模型可以：
  - 在该标签页中执行点击、输入或导航操作
  - 读取页面内容
  - 访问该标签页登录会话有权访问的所有内容
- **这并不像专用的 Openclaw 管理配置文件那样实现严格隔离**。
  - 如果您将扩展附加到日常使用的配置文件或标签页，就相当于授予模型对该账户状态的访问权限。

建议：

- 建议为扩展中继使用专门的 Chrome 配置文件，以与您的个人浏览区分开来。
- 请确保网关和所有节点主机仅在 Tailnet 内部运行；依赖网关认证和节点配对来保障安全。
- 请避免通过局域网暴露中继端口（`0.0.0.0`），并避免使用 Funnel（公共网络）。

相关链接：

- 浏览器工具概览：[浏览器](/tools/browser)
- 安全审计：[安全](/gateway/security)
- Tailscale 设置：[Tailscale](/gateway/tailscale)

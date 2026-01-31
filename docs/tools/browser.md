---
summary: Integrated browser control service + action commands
read_when:
  - Adding agent-controlled browser automation
  - Debugging why openclaw is interfering with your own Chrome
  - Implementing browser settings + lifecycle in the macOS app
---
# 浏览器（由 OpenClaw 管理）

OpenClaw 可以运行一个由代理控制的**专用 Chrome/Brave/Edge/Chromium 配置文件**。该配置文件与您的个人浏览器隔离，并通过 Gateway 内部的一个小型本地控制服务进行管理（仅限环回）。

初学者视角：
- 您可以将其视为一个**专属于代理的独立浏览器**。
- `openclaw` 配置文件**不会**影响您的个人浏览器配置文件。
- 代理可以在安全的环境中**打开标签页、读取页面、点击和输入**。
- 默认的 `chrome` 配置文件通过扩展中继使用**系统默认的 Chromium 浏览器**；切换到 `openclaw` 即可使用隔离的受管浏览器。

## 您将获得

- 一个名为 **openclaw** 的独立浏览器配置文件（默认带有橙色强调色）。
- 确定性的标签页控制（列出/打开/聚焦/关闭）。
- 代理操作（点击/输入/拖动/选择）、快照、屏幕截图、PDF。
- 可选的多配置文件支持（`openclaw`、`work`、`remote` 等）。

此浏览器**并非您的日常主力浏览器**，而是为代理自动化和验证提供的一块安全、隔离的工作区域。

## 快速入门

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

如果您看到“浏览器已禁用”，请在配置中启用它（见下文）并重启 Gateway。

## 配置文件：`openclaw` vs `chrome`

- `openclaw`：受管的隔离浏览器（无需扩展）。
- `chrome`：扩展中继至您的**系统浏览器**（需要 OpenClaw 扩展附加到标签页）。

如果您希望默认使用受管模式，请设置 `browser.defaultProfile: "openclaw"`。

## 配置

浏览器设置位于 `~/.openclaw/openclaw.json` 中。

```json5
{
  browser: {
    enabled: true,                    // default: true
    // cdpUrl: "http://127.0.0.1:18792", // legacy single-profile override
    remoteCdpTimeoutMs: 1500,         // remote CDP HTTP timeout (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // remote CDP WebSocket handshake timeout (ms)
    defaultProfile: "chrome",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" }
    }
  }
}
```

注意事项：
- 浏览器控制服务绑定到环回地址，端口基于 `gateway.port` 计算（默认：`18791`，即网关端口 + 2）。中继使用下一个端口（`18792`）。
- 如果您覆盖网关端口（`gateway.port` 或 `OPENCLAW_GATEWAY_PORT`），派生的浏览器端口会相应调整，以保持在同一“家族”内。
- `cdpUrl` 在未设置时默认为中继端口。
- `remoteCdpTimeoutMs` 适用于远程（非环回）CDP 可达性检查。
- `remoteCdpHandshakeTimeoutMs` 适用于远程 CDP WebSocket 可达性检查。
- `attachOnly: true` 表示“从不启动本地浏览器；仅在浏览器已在运行时才附加”。
- `color` 加上每个配置文件的 `color` 会为浏览器 UI 添加色调，以便您识别当前活动的配置文件。
- 默认配置文件是 `chrome`（扩展中继）。使用 `defaultProfile: "openclaw"` 来启用受管浏览器。
- 自动检测顺序：如果基于 Chromium，则使用系统默认浏览器；否则依次为 Chrome → Brave → Edge → Chromium → Chrome Canary。
- 本地 `openclaw` 配置文件会自动分配 `cdpPort`/`cdpUrl`——这些仅用于远程 CDP。

## 使用 Brave（或其他基于 Chromium 的浏览器）

如果您的**系统默认**浏览器是基于 Chromium 的（Chrome/Brave/Edge 等），OpenClaw 会自动使用它。要覆盖自动检测，请设置 `browser.executablePath`：

CLI 示例：

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

```json5
// macOS
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
  }
}

// Windows
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
  }
}

// Linux
{
  browser: {
    executablePath: "/usr/bin/brave-browser"
  }
}
```

## 本地与远程控制

- **本地控制（默认）：**Gateway 启动环回控制服务，并可启动本地浏览器。
- **远程控制（节点主机）：**在安装了浏览器的机器上运行节点主机；Gateway 将浏览器操作代理到该主机。
- **远程 CDP：**设置 `browser.profiles.<name>.cdpUrl`（或 `browser.cdpUrl`）以连接到远程基于 Chromium 的浏览器。在这种情况下，OpenClaw 不会启动本地浏览器。

远程 CDP URL 可以包含身份验证：
- 查询令牌（如 `https://provider.example?token=<token>`）
- HTTP 基本身份验证（如 `https://user:pass@provider.example`）

OpenClaw 在调用 `/json/*` 端点以及连接到 CDP WebSocket 时会保留身份验证信息。建议使用环境变量或密钥管理工具来存储令牌，而不是将其写入配置文件。

## 节点浏览器代理（零配置默认）

如果您在安装了浏览器的机器上运行**节点主机**，OpenClaw 可以自动将浏览器工具调用路由到该节点，而无需额外的浏览器配置。这是远程网关的默认路径。

注意事项：
- 节点主机通过**代理命令**公开其本地浏览器控制服务器。
- 配置文件来自节点自身的 `browser.profiles` 配置（与本地相同）。
- 如果您不想使用此功能：
  - 在节点上：`nodeHost.browserProxy.enabled=false`
  - 在网关上：`gateway.nodes.browser.mode="off"`

## Browserless（托管远程 CDP）

[Browserless](https://browserless.io) 是一项托管的 Chromium 服务，通过 HTTPS 公开 CDP 端点。您可以将 OpenClaw 浏览器配置文件指向某个 Browserless 区域端点，并使用您的 API 密钥进行身份验证。

示例：
```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    remoteCdpTimeoutMs: 2000,
    remoteCdpHandshakeTimeoutMs: 4000,
    profiles: {
      browserless: {
        cdpUrl: "https://production-sfo.browserless.io?token=<BROWSERLESS_API_KEY>",
        color: "#00AA00"
      }
    }
  }
}
```

注意事项：
- 用您的真实 Browserless 令牌替换 `<BROWSERLESS_API_KEY>`。
- 选择与您的 Browserless 账户匹配的区域端点（请参阅他们的文档）。

## 安全性

关键理念：
- 浏览器控制仅限环回访问；访问权限通过 Gateway 的身份验证或节点配对进行控制。
- 将 Gateway 和任何节点主机置于私有网络中（如 Tailscale）；避免公开暴露。
- 将远程 CDP URL/令牌视为机密；优先使用环境变量或密钥管理工具。

远程 CDP 提示：
- 尽可能使用 HTTPS 端点和短期令牌。
- 避免在配置文件中直接嵌入长期令牌。

## 多浏览器配置文件

OpenClaw 支持多个命名配置文件（路由配置）。配置文件可以是：
- **openclaw-managed**：一个专用的基于 Chromium 的浏览器实例，拥有自己的用户数据目录和 CDP 端口。
- **remote**：一个明确的 CDP URL（在其他地方运行的基于 Chromium 的浏览器）。
- **extension relay**：通过本地中继和 Chrome 扩展连接到您现有的 Chrome 标签页。

默认设置：
- 如果缺少 `openclaw` 配置文件，系统会自动创建。
- `chrome` 配置文件内置用于 Chrome 扩展中继（默认指向 `http://127.0.0.1:18792`）。
- 本地 CDP 端口默认从 **18800–18899** 分配。
- 删除配置文件会将其本地数据目录移至回收站。

所有控制端点都接受 `?profile=<name>`；CLI 使用 `--browser-profile`。

## Chrome 扩展中继（使用您现有的 Chrome）

OpenClaw 还可以通过本地 CDP 中继和 Chrome 扩展来驱动**您现有的 Chrome 标签页**（无需单独的“openclaw”Chrome 实例）。

完整指南：[Chrome 扩展](/tools/chrome-extension)

流程：
- Gateway 在本地运行（同一台机器）或在浏览器所在的机器上运行节点主机。
- 本地**中继服务器**监听环回地址上的 `cdpUrl`（默认：`http://127.0.0.1:18792`）。
- 您点击标签页上的**OpenClaw 浏览器中继**扩展图标以连接（不会自动连接）。
- 代理通过常规的 `browser` 工具，通过选择正确的配置文件来控制该标签页。

如果 Gateway 在其他地方运行，请在浏览器所在的机器上运行节点主机，以便 Gateway 可以代理浏览器操作。

### 沙盒会话

如果代理会话处于沙盒状态，`browser` 工具可能会默认使用 `target="sandbox"`（沙盒浏览器）。Chrome 扩展中继接管需要主机浏览器控制，因此：
- 运行未沙盒化的会话，或
- 设置 `agents.defaults.sandbox.browser.allowHostControl: true`，然后在调用该工具时使用 `target="host"`。

### 设置

1) 加载扩展（开发版/未打包版）：

```bash
openclaw browser extension install
```

- 对于 Chrome：进入 `chrome://extensions` 并启用“开发者模式”。
- 选择“加载未打包扩展”，然后选择由 `openclaw browser extension path` 打印的目录。
- 固定扩展，然后在您想要控制的标签页上点击它（徽章显示 `ON`）。

2) 使用：
- CLI：`openclaw browser --browser-profile chrome tabs`
- 代理工具：`browser`，搭配 `profile="chrome"`

可选：如果您想要不同的名称或中继端口，可以创建自己的配置文件：

```bash
openclaw browser create-profile \
  --name my-chrome \
  --driver extension \
  --cdp-url http://127.0.0.1:18792 \
  --color "#00AA00"
```

注意事项：
- 此模式依赖 Playwright-on-CDP 来执行大多数操作（屏幕截图/快照/操作）。
- 再次点击扩展图标即可断开连接。

## 隔离保证

- **专用用户数据目录**：绝不会影响您的个人浏览器配置文件。
- **专用端口**：避免 `9222`，防止与开发工作流发生冲突。
- **确定性的标签页控制**：通过 `targetId` 目标标签页，而不是“最后标签页”。

## 浏览器选择

在本地启动时，OpenClaw 会按以下顺序选择第一个可用的浏览器：
1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

您可以通过 `browser.executablePath` 进行覆盖。

平台：
- macOS：检查 `/Applications` 和 `~/Applications`。
- Linux：查找 `google-chrome`、`brave`、`microsoft-edge`、`chromium` 等。
- Windows：检查常见的安装位置。

## 控制 API（可选）

仅适用于本地集成，Gateway 公开了一个小型环回 HTTP API：

- 状态/启动/停止：`GET /`、`POST /start`、`POST /stop`
- 标签页：`GET /tabs`、`POST /tabs/open`、`POST /tabs/focus`、`DELETE /tabs/:targetId`
- 快照/屏幕截图：`GET /snapshot`、`POST /screenshot`
- 操作：`POST /navigate`、`POST /act`
- 钩子：`POST /hooks/file-chooser`、`POST /hooks/dialog`
- 下载：`POST /download`、`POST /wait/download`
- 调试：`GET /console`、`POST /pdf`
- 调试：`GET /errors`、`GET /requests`、`POST /trace/start`、`POST /trace/stop`、`POST /highlight`
- 网络：`POST /response/body`
- 状态：`GET /cookies`、`POST /cookies/set`、`POST /cookies/clear`
- 状态：`GET /storage/:kind`、`POST /storage/:kind/set`、`POST /storage/:kind/clear`
- 设置：`POST /set/offline`、`POST /set/headers`、`POST /set/credentials`、`POST /set/geolocation`、`POST /set/media`、`POST /set/timezone`、`POST /set/locale`、`POST /set/device`

所有端点都接受 `?profile=<name>`。

### Playwright 要求

某些功能（导航/操作/AI 快照/角色快照、元素截图、PDF）需要 Playwright。如果未安装 Playwright，这些端点将返回清晰的 501 错误。ARIA 快照和基本屏幕截图仍可用于 openclaw-managed Chrome。对于 Chrome 扩展中继驱动程序，ARIA 快照和屏幕截图需要 Playwright。

如果您看到 `Playwright is not available in this gateway build`，请安装完整的 Playwright 包（而非 `playwright-core`），并重启网关，或重新安装 OpenClaw 并启用浏览器支持。

## 内部工作原理

高级流程：
- 一个小型**控制服务器**接收 HTTP 请求。
- 它通过**CDP**连接到基于 Chromium 的浏览器（Chrome/Brave/Edge/Chromium）。
- 对于高级操作（点击/输入/快照/PDF），它在 CDP 之上使用**Playwright**。
- 当 Playwright 缺失时，只有非 Playwright 操作可用。

这种设计使代理能够在一个稳定、确定性的界面上运行，同时允许您切换本地/远程浏览器和配置文件。

## CLI 快速参考

所有命令都接受 `--browser-profile <name>` 来指定特定的配置文件。所有命令也接受 `--json` 以获取机器可读的输出（稳定的负载）。

基础命令：
- `openclaw browser status`
- `openclaw browser start`
- `openclaw browser stop`
- `openclaw browser tabs`
- `openclaw browser tab`
- `openclaw browser tab new`
- `openclaw browser tab select 2`
- `openclaw browser tab close 2`
- `openclaw browser open https://example.com`
- `openclaw browser focus abcd1234`
- `openclaw browser close abcd1234`

检查命令：
- `openclaw browser screenshot`
- `openclaw browser screenshot --full-page`
- `openclaw browser screenshot --ref 12`
- `openclaw browser screenshot --ref e12`
- `openclaw browser snapshot`
- `openclaw browser snapshot --format aria --limit 200`
- `openclaw browser snapshot --interactive --compact --depth 6`
- `openclaw browser snapshot --efficient`
- `openclaw browser snapshot --labels`
- `openclaw browser snapshot --selector "#main" --interactive`
- `openclaw browser snapshot --frame "iframe#main" --interactive`
- `openclaw browser console --level error`
- `openclaw browser errors --clear`
- `openclaw browser requests --filter api --clear`
- `openclaw browser pdf`
- `openclaw browser responsebody "**/api" --max-chars 5000`

行动命令：
- `openclaw browser navigate https://example.com`
- `openclaw browser resize 1280 720`
- `openclaw browser click 12 --double`
- `openclaw browser click e12 --double`
- `openclaw browser type 23 "hello" --submit`
- `openclaw browser press Enter`
- `openclaw browser hover 44`
- `openclaw browser scrollintoview e12`
- `openclaw browser drag 10 11`
- `openclaw browser select 9 OptionA OptionB`
- `openclaw browser download e12 /tmp/report.pdf`
- `openclaw browser waitfordownload /tmp/report.pdf`
- `openclaw browser upload /tmp/file.pdf`
- `openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'`
- `openclaw browser dialog --accept`
- `openclaw browser wait --text "Done"`
- `openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"`
- `openclaw browser evaluate --fn '(el) => el.textContent' --ref 7`
- `openclaw browser highlight e12`
- `openclaw browser trace start`
- `openclaw browser trace stop`

状态命令：
- `openclaw browser cookies`
- `openclaw browser cookies set session abc123 --url "https://example.com"`
- `openclaw browser cookies clear`
- `openclaw browser storage local get`
- `openclaw browser storage local set theme dark`
- `openclaw browser storage session clear`
- `openclaw browser set offline on`
- `openclaw browser set headers --json '{"X-Debug":"1"}'`
- `openclaw browser set credentials user pass`
- `openclaw browser set credentials --clear`
- `openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"`
- `openclaw browser set geo --clear`
- `openclaw browser set media dark`
- `openclaw browser set timezone America/New_York`
- `openclaw browser set locale en-US`
- `openclaw browser set device "iPhone 14"`

注意事项：
- `upload` 和 `dialog` 是**准备**调用；在触发选择器/对话框的点击/按下之前先运行它们。
- `upload` 还可以通过 `--input-ref` 或 `--element` 直接设置文件输入。
- `snapshot`：
  - `--format ai`（Playwright 安装时的默认设置）：返回带有数字引用的 AI 快照（`aria-ref="<n>"`）。
  - `--format aria`：返回无障碍树（无引用；仅用于检查）。
  - `--efficient`（或 `--mode efficient`）：紧凑的角色快照预设（交互式 + 紧凑 + 深度 + 较低的最大字符数）。
  - 配置默认值（仅工具/CLI）：设置 `browser.snapshotDefaults.mode: "efficient"`，以便在调用者未指定模式时使用高效快照（请参阅 [网关配置](/gateway/configuration#browser-openclaw-managed-browser)）。
  - 角色快照选项（`--interactive`、`--compact`、`--depth`、`--selector`）强制使用基于角色的快照，并带有类似 `ref=e12` 的引用。
  - `--frame "<iframe selector>"` 将角色快照限制在 iframe 内（与角色引用一起使用，如 `e12`）。
  - `--interactive` 输出一个扁平、易于选择的交互元素列表（最适合驱动操作）。
  - `--labels` 添加了一个仅视口的屏幕截图，并叠加了引用标签（打印 `MEDIA:<path>`）。
- `click`/`type`/等需要来自 `snapshot` 的 `ref`（无论是数字 `12` 或角色引用 `e12`）。出于有意为之的原因，CSS 选择器不支持用于操作。

## 快照与引用

OpenClaw 支持两种“快照”风格：

- **AI 快照（数字引用）**：`openclaw browser snapshot`（默认；`--format ai`）
  - 输出：包含数字引用的文本快照。
  - 操作：`openclaw browser click 12`、`openclaw browser type 23 "hello"`。
  - 在内部，引用通过 Playwright 的 `aria-ref` 解析。

- **角色快照（角色引用，如 `e12`）**：`openclaw browser snapshot --interactive`（或 `--compact`、`--depth`、`--selector`、`--frame`）
  - 输出：基于角色的列表/树，带有 `[ref=e12]`（并可选 `[nth=1]`）。
  - 操作：`openclaw browser click e12`、`openclaw browser highlight e12`。
  - 在内部，引用通过 `getByRole(...)` 解析（加上 `nth()` 用于处理重复引用）。
  - 添加 `--labels` 以包括带有叠加 `e12` 标签的视口截图。

引用行为：
- 引用在**不同导航之间并不稳定**；如果出现问题，重新运行 `snapshot` 并使用新的引用。
- 如果角色快照是使用 `--frame` 拍摄的，角色引用将被限制在该 iframe 内，直到下一次角色快照。

## 等待增强功能

您不仅可以等待时间或文本：

- 等待 URL（Playwright 支持通配符）：
  - `openclaw browser wait --url "**/dash"`
- 等待加载状态：
  - `openclaw browser wait --load networkidle`
- 等待 JS 谓词：
  - `openclaw browser wait --fn "window.ready===true"`
- 等待选择器变为可见：
  - `openclaw browser wait "#main"`

这些可以组合使用：

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## 调试工作流

当操作失败时（例如，“不可见”、“严格模式违规”、“被遮挡”）：

1. `openclaw browser snapshot --interactive`
2. 使用 `click <ref>` / `type <ref>`（在交互模式中优先使用角色引用）
3. 如果仍然失败：`openclaw browser highlight <ref>` 查看 Playwright 正在瞄准什么
4. 如果页面行为异常：
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. 对于深度调试：记录跟踪信息：
   - `openclaw browser trace start`
   - 重现问题
   - `openclaw browser trace stop`（打印 `TRACE:<path>`）

## JSON 输出

`--json` 用于脚本编写和结构化工具。

示例：

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

JSON 中的角色快照包括 `refs` 加上一个小的 `stats` 块（行数/字符数/引用/交互性），以便工具可以推断负载大小和密度。

## 状态与环境旋钮

这些在“让网站表现得像 X”工作流中非常有用：

- Cookies：`cookies`、`cookies set`、`cookies clear`
- 存储：`storage local|session get|set|clear`
- 离线：`set offline on|off`
- 头部：`set headers --json '{"X-Debug":"1"}'`（或 `--clear`）
- HTTP 基本身份验证： `set credentials user pass`（或 `--clear`）
- 地理位置：`set geo <lat> <lon> --origin "https://example.com"`（或 `--clear`）
- 媒体：`set media dark|light|no-preference|none`
- 时区/语言：`set timezone ...`、`set locale ...`
- 设备/视口：
  - `set device "iPhone 14"`（Playwright 设备预设）
  - `set viewport 1280 720`

## 安全与隐私

- openclaw 浏览器配置文件可能包含已登录的会话；请将其视为敏感信息。
- `browser act kind=evaluate` / `openclaw browser evaluate` 和 `wait --fn`
  在页面上下文中执行任意 JavaScript。提示注入可能会导致偏离预期。如果您不需要此功能，请使用 `browser.evaluateEnabled=false` 禁用它。
- 对于登录和反机器人注意事项（X/Twitter 等），请参阅 [浏览器登录 + X/Twitter 发布](/tools/browser-login)。
- 保持 Gateway/节点主机的私密性（仅限环回或尾网）。
- 远程 CDP 端点功能强大；请对其进行隧道保护并加以防护。

## 故障排除

有关 Linux 特定问题（尤其是 snap Chromium），请参阅 [浏览器故障排除](/tools/browser-linux-troubleshooting)。

## 代理工具与控制方式

代理在浏览器自动化方面拥有**单一工具**：
- `browser` — 状态/启动/停止/标签页/打开/聚焦/关闭/快照/屏幕截图/导航/操作

映射方式：
- `browser snapshot` 返回一个稳定的 UI 树（AI 或 ARIA）。
- `browser act` 使用快照 `ref` ID 来点击/输入/拖动/选择。
- `browser screenshot` 捕获像素（整个页面或元素）。
- `browser` 接受：
  - `profile` 用于选择命名浏览器配置文件（openclaw、chrome 或远程 CDP）。
  - `target`（`sandbox` | `host` | `node`）用于选择浏览器所在的位置。
  - 在沙盒会话中，`target: "host"` 需要 `agents.defaults.sandbox.browser.allowHostControl=true`。
  - 如果省略了 `target`：沙盒会话默认使用 `sandbox`，非沙盒会话默认使用 `host`。
  - 如果连接了具备浏览器功能的节点，该工具可能会自动路由到该节点，除非您固定 `target="host"` 或 `target="node"`。

这使得代理的操作具有确定性，并避免了脆弱的选择器。

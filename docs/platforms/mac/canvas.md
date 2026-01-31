---
summary: Agent-controlled Canvas panel embedded via WKWebView + custom URL scheme
read_when:
  - Implementing the macOS Canvas panel
  - Adding agent controls for visual workspace
  - Debugging WKWebView canvas loads
---
# Canvas（macOS 应用）

macOS 应用使用 `WKWebView` 嵌入了一个由代理控制的 **Canvas 面板**。这是一个轻量级的可视化工作区，适用于 HTML/CSS/JS、A2UI 以及小型交互式 UI 表面。

## Canvas 的存储位置

Canvas 状态存储在 Application Support 目录下：

- `~/Library/Application Support/OpenClaw/canvas/<session>/...`

Canvas 面板通过一个 **自定义 URL 方案** 提供这些文件：

- `openclaw-canvas://<session>/<path>`

示例：
- `openclaw-canvas://main/` → `<canvasRoot>/main/index.html`
- `openclaw-canvas://main/assets/app.css` → `<canvasRoot>/main/assets/app.css`
- `openclaw-canvas://main/widgets/todo/` → `<canvasRoot>/main/widgets/todo/index.html`

如果根目录中不存在 `index.html`，应用将显示一个 **内置的脚手架页面**。

## 面板行为

- 无边框、可调整大小的面板，固定在菜单栏附近（或鼠标光标处）。
- 每个会话都会记住面板的大小和位置。
- 当本地 Canvas 文件发生更改时，面板会自动重新加载。
- 同一时间仅显示一个 Canvas 面板（必要时切换会话）。

您可以在设置中关闭 Canvas：**允许 Canvas**。当 Canvas 被禁用时，Canvas 节点命令将返回 `CANVAS_DISABLED`。

## 代理 API 接口

Canvas 通过 **Gateway WebSocket** 公开，因此代理可以：

- 显示或隐藏面板
- 导航到某个路径或 URL
- 执行 JavaScript
- 捕获快照图像

CLI 示例：

```bash
openclaw nodes canvas present --node <id>
openclaw nodes canvas navigate --node <id> --url "/"
openclaw nodes canvas eval --node <id> --js "document.title"
openclaw nodes canvas snapshot --node <id>
```

注意事项：
- `canvas.navigate` 接受 **本地 Canvas 路径**，`http(s)` 接受 URL，`file://` 也接受 URL。
- 如果您传递 `"/"`，Canvas 将显示本地脚手架或 `index.html`。

## A2UI 在 Canvas 中

A2UI 由 Gateway Canvas 主机托管，并在 Canvas 面板中渲染。当 Gateway 宣布一个 Canvas 主机时，macOS 应用会在首次打开时自动导航到 A2UI 主机页面。

默认 A2UI 主机 URL：

```
http://<gateway-host>:18793/__openclaw__/a2ui/
```

### A2UI 命令（v0.8）

Canvas 目前接受 **A2UI v0.8** 服务器到客户端的消息：

- `beginRendering`
- `surfaceUpdate`
- `dataModelUpdate`
- `deleteSurface`

`createSurface`（v0.9）不受支持。

CLI 示例：

```bash
cat > /tmp/a2ui-v0.8.jsonl <<'EOFA2'
{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"root","component":{"Column":{"children":{"explicitList":["title","content"]}}}},{"id":"title","component":{"Text":{"text":{"literalString":"Canvas (A2UI v0.8)"},"usageHint":"h1"}}},{"id":"content","component":{"Text":{"text":{"literalString":"If you can read this, A2UI push works."},"usageHint":"body"}}}]}}
{"beginRendering":{"surfaceId":"main","root":"root"}}
EOFA2

openclaw nodes canvas a2ui push --jsonl /tmp/a2ui-v0.8.jsonl --node <id>
```

快速测试：

```bash
openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"
```

## 从 Canvas 触发代理运行

Canvas 可以通过深度链接触发新的代理运行：

- `openclaw://agent?...`

示例（使用 JS）：

```js
window.location.href = "openclaw://agent?message=Review%20this%20design";
```

除非提供有效密钥，否则应用会提示确认。

## 安全注意事项

- Canvas 方案阻止目录遍历；文件必须位于会话根目录下。
- 本地 Canvas 内容使用自定义方案，无需回环服务器。
- 外部 `http(s)` URL 仅在显式导航时才被允许。

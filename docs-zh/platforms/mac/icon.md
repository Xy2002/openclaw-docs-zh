---
summary: Menu bar icon states and animations for OpenClaw on macOS
read_when:
  - Changing menu bar icon behavior
---
# 菜单栏图标状态

作者：steipete · 更新日期：2025-12-06 · 适用范围：macOS 应用程序 (`apps/macos`)

- **空闲：** 正常图标动画（闪烁，偶尔轻微摆动）。
- **已暂停：** 状态项使用 `appearsDisabled`；无任何运动。
- **语音触发（大耳朵）：** 当检测到唤醒词时，语音唤醒检测器调用 `AppState.triggerVoiceEars(ttl: nil)`，并在捕获语音期间保持 `earBoostActive=true`。耳朵会放大至 1.9 倍，并将耳孔改为圆形以提高可读性，随后在静默 1 秒后通过 `stopVoiceEars()` 缓慢缩小。此状态仅由应用内语音管道触发。
- **工作中（代理运行）：** `AppState.isWorking=true` 驱动一种“尾巴/腿部小幅度抖动”的微运动：在任务进行时，腿部抖动频率加快并产生轻微偏移。目前该状态与 WebChat 代理运行相关联；在其他长时间任务接入后，也应添加类似的切换逻辑。

连线点
- 语音唤醒：在触发时，运行时或测试器调用 `AppState.triggerVoiceEars(ttl: nil)`；在静默 1 秒后调用 `stopVoiceEars()`，以匹配捕获窗口。
- 代理活动：在工作时段周围设置 `AppStateStore.shared.setWorking(true/false)`（已在 WebChat 代理调用中实现）。确保工作时段尽可能短，并在 `defer` 块中重置状态，以避免动画卡住。

形状与尺寸
- 基础图标在 `CritterIconRenderer.makeIcon(blink:legWiggle:earWiggle:earScale:earHoles:)` 中绘制。
- 耳朵缩放默认为 `1.0`；语音增强会设置 `earScale=1.9` 并切换 `earHoles=true`，但不改变整体框架大小（18×18 pt 模板图像渲染到 36×36 px 的 Retina 备用存储中）。
- 小幅度抖动的腿部摆动幅度最高可达约 1.0，并伴有轻微的水平晃动；它会叠加到现有的空闲抖动之上。

行为注意事项
- 不对外暴露用于控制耳朵或工作状态的 CLI 或代理开关；所有切换逻辑应保留在应用内部信号中，以避免意外触发。
- TTL 时间应设置得较短（<10 秒），以便在任务挂起时图标能迅速恢复到初始状态。

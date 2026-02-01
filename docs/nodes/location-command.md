---
summary: >-
  Location command for nodes (location.get), permission modes, and background
  behavior
read_when:
  - Adding location node support or permissions UI
  - Designing background location + push flows
---
# 位置命令（节点）

## 概述
- `location.get` 是一种节点命令（通过 `node.invoke` 实现）。
- 默认关闭。
- 设置使用选择器：关闭 / 使用时 / 始终。
- 独立切换开关：精确位置。

## 为何使用选择器而非简单开关
操作系统权限是多层次的。我们可以在应用中提供一个选择器，但最终的实际权限授予仍由操作系统决定。
- iOS/macOS：用户可在系统提示或设置中选择“使用时”或“始终”。应用可以请求升级权限级别，但操作系统可能要求用户前往设置中手动调整。
- Android：后台位置是单独的权限；在 Android 10 及以上版本中，通常需要通过设置流程来授予。
- 精确位置是独立的权限授予（iOS 14+ 的“精确”，Android 的“精细”与“粗略”）。

UI 中的选择器决定了我们请求的位置模式；实际授予的权限则存储在操作系统设置中。

## 设置模型
按节点设备：
- `location.enabledMode`: `off | whileUsing | always`
- `location.preciseEnabled`: 布尔值

UI 行为：
- 选择 `whileUsing` 会请求前台权限。
- 选择 `always` 首先确保 `whileUsing` 已启用，然后请求后台权限（或在必要时将用户引导至设置页面）。
- 如果操作系统拒绝所请求的权限级别，则回退到已授予的最高权限级别，并显示当前状态。

## 权限映射（node.permissions）
可选。macOS 节点通过权限映射报告 `location`；iOS/Android 可能不包含此信息。

## 命令：`location.get`
通过 `node.invoke` 调用。

参数（建议）：
```json
{
  "timeoutMs": 10000,
  "maxAgeMs": 15000,
  "desiredAccuracy": "coarse|balanced|precise"
}
```

响应负载：
```json
{
  "lat": 48.20849,
  "lon": 16.37208,
  "accuracyMeters": 12.5,
  "altitudeMeters": 182.0,
  "speedMps": 0.0,
  "headingDeg": 270.0,
  "timestamp": "2026-01-03T12:34:56.000Z",
  "isPrecise": true,
  "source": "gps|wifi|cell|unknown"
}
```

错误（稳定代码）：
- `LOCATION_DISABLED`：选择器已关闭。
- `LOCATION_PERMISSION_REQUIRED`：缺少所请求模式所需的权限。
- `LOCATION_BACKGROUND_UNAVAILABLE`：应用处于后台，但仅允许“使用时”权限。
- `LOCATION_TIMEOUT`：无法及时修复。
- `LOCATION_UNAVAILABLE`：系统故障或无可用提供商。

## 后台行为（未来）
目标：即使节点处于后台，模型也能请求位置信息，但前提条件是：
- 用户选择了“始终”。
- 操作系统授予了后台位置权限。
- 应用被允许在后台运行以获取位置信息（iOS 后台模式 / Android 前台服务或特殊许可）。

推送触发流程（未来）：
1) 网关向节点发送推送消息（静默推送或 FCM 数据）。
2) 节点短暂唤醒并向设备请求位置信息。
3) 节点将位置数据转发给网关。

注意事项：
- iOS：需要“始终”权限和后台位置模式。静默推送可能会受到限制；可能出现间歇性失败。
- Android：后台位置可能需要前台服务；否则，可能会被拒绝。

## 模型/工具集成
- 工具界面：`nodes` 工具新增 `location_get` 操作（需节点支持）。
- CLI：`openclaw nodes location get --node <id>`。
- 代理指南：仅在用户已启用位置且了解其范围时调用。

## UX 文案（建议）
- 关闭：“位置共享已禁用。”
- 使用时：“仅当 OpenClaw 打开时。”
- 始终：“允许后台位置。需要系统权限。”
- 精确：“使用精确的 GPS 定位。关闭可共享大致位置。”

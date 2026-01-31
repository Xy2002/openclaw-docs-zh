---
summary: >-
  Camera capture (iOS node + macOS app) for agent use: photos (jpg) and short
  video clips (mp4)
read_when:
  - Adding or modifying camera capture on iOS nodes or macOS
  - Extending agent-accessible MEDIA temp-file workflows
---
# 摄像头捕获（代理）

OpenClaw 支持在代理工作流中使用**摄像头捕获**功能：

- **iOS 节点**（通过网关配对）：通过 `node.invoke` 捕获**照片**（`jpg`）或**短视频片段**（`mp4`，可选音频）。
- **Android 节点**（通过网关配对）：通过 `node.invoke` 捕获**照片**（`jpg`）或**短视频片段**（`mp4`，可选音频）。
- **macOS 应用程序**（通过网关的节点）：通过 `node.invoke` 捕获**照片**（`jpg`）或**短视频片段**（`mp4`，可选音频）。

所有摄像头访问均受**用户可控设置**的限制。

## iOS 节点

### 用户设置（默认开启）

- iOS 设置标签 → **相机** → **允许相机**（`camera.enabled`）
  - 默认：**开启**（缺少该键被视为已启用）。
  - 关闭时：`camera.*` 命令返回 `CAMERA_DISABLED`。

### 命令（通过网关 `node.invoke`）

- `camera.list`
  - 响应负载：
    - `devices`：包含 `{ id, name, position, deviceType }` 的数组

- `camera.snap`
  - 参数：
    - `facing`：`front|back`（默认：`front`）
    - `maxWidth`：数字（可选；iOS 节点上的默认值为 `1600`）
    - `quality`：`0..1`（可选；默认值为 `0.9`）
    - `format`：当前为 `jpg`
    - `delayMs`：数字（可选；默认值为 `0`）
    - `deviceId`：字符串（可选；来自 `camera.list`）
  - 响应负载：
    - `format: "jpg"`
    - `base64: "<...>"`
    - `width`、`height`
  - 负载保护：照片会被重新压缩，以确保 base64 负载不超过 5 MB。

- `camera.clip`
  - 参数：
    - `facing`：`front|back`（默认：`front`）
    - `durationMs`：数字（默认值为 `3000`，上限为 `60000`）
    - `includeAudio`：布尔值（默认为 `true`）
    - `format`：当前为 `mp4`
    - `deviceId`：字符串（可选；来自 `camera.list`）
  - 响应负载：
    - `format: "mp4"`
    - `base64: "<...>"`
    - `durationMs`
    - `hasAudio`

### 前台要求

与 `canvas.*` 类似，iOS 节点仅允许在**前台**执行 `camera.*` 命令。后台调用将返回 `NODE_BACKGROUND_UNAVAILABLE`。

### CLI 辅助工具（临时文件 + 媒体）

获取附件最简单的方式是使用 CLI 辅助工具，它会将解码后的媒体写入临时文件，并打印 `MEDIA:<path>`。

示例：

```bash
openclaw nodes camera snap --node <id>               # default: both front + back (2 MEDIA lines)
openclaw nodes camera snap --node <id> --facing front
openclaw nodes camera clip --node <id> --duration 3000
openclaw nodes camera clip --node <id> --no-audio
```

注意：
- `nodes camera snap` 默认同时启用前后镜头，以便代理获得两个视角。
- 输出文件是临时文件（位于操作系统临时目录中），除非您构建自己的封装器。

## Android 节点

### 用户设置（默认开启）

- 安卓设置表 → **相机** → **允许相机**（`camera.enabled`）
  - 默认：**开启**（缺少该键被视为已启用）。
  - 关闭时：`camera.*` 命令返回 `CAMERA_DISABLED`。

### 权限

- 安卓需要运行时权限：
  - `CAMERA` 用于 `camera.snap` 和 `camera.clip`。
  - `RECORD_AUDIO` 用于 `camera.clip` 当 `includeAudio=true` 时。

如果缺少权限，应用会在可能的情况下提示用户；如果被拒绝，`camera.*` 请求将失败并返回 `*_PERMISSION_REQUIRED` 错误。

### 前台要求

与 `canvas.*` 类似，Android 节点仅允许在**前台**执行 `camera.*` 命令。后台调用将返回 `NODE_BACKGROUND_UNAVAILABLE`。

### 负载保护

照片会被重新压缩，以确保 base64 负载不超过 5 MB。

## macOS 应用程序

### 用户设置（默认关闭）

macOS 配套应用程序提供一个复选框：

- **设置 → 通用 → 允许相机**（`openclaw.cameraEnabled`）
  - 默认：**关闭**
  - 关闭时：相机请求将返回“相机已被用户禁用”。

### CLI 辅助工具（节点调用）

使用主 `openclaw` CLI 在 macOS 节点上调用相机命令。

示例：

```bash
openclaw nodes camera list --node <id>            # list camera ids
openclaw nodes camera snap --node <id>            # prints MEDIA:<path>
openclaw nodes camera snap --node <id> --max-width 1280
openclaw nodes camera snap --node <id> --delay-ms 2000
openclaw nodes camera snap --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --duration 10s          # prints MEDIA:<path>
openclaw nodes camera clip --node <id> --duration-ms 3000      # prints MEDIA:<path> (legacy flag)
openclaw nodes camera clip --node <id> --device-id <id>
openclaw nodes camera clip --node <id> --no-audio
```

注意：
- `openclaw nodes camera snap` 默认为 `maxWidth=1600`，除非被覆盖。
- 在 macOS 上，`camera.snap` 在预热/曝光稳定后等待 `delayMs`（默认 2000 毫秒）再进行拍摄。
- 照片负载会被重新压缩，以确保 base64 不超过 5 MB。

## 安全性 + 实际限制

- 摄像头和麦克风访问会触发常规的操作系统权限提示（并在 Info.plist 中需要使用说明字符串）。
- 视频片段有上限（当前为 `<= 60s`），以避免节点负载过大（base64 开销 + 消息限制）。

## macOS 屏幕视频（操作系统级别）

对于*屏幕*视频（而非摄像头），请使用 macOS 配套应用程序：

```bash
openclaw nodes screen record --node <id> --duration 10s --fps 15   # prints MEDIA:<path>
```

注意：
- 需要 macOS **屏幕录制**权限（TCC）。

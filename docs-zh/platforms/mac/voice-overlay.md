---
summary: Voice overlay lifecycle when wake-word and push-to-talk overlap
read_when:
  - Adjusting voice overlay behavior
---
# 语音叠加生命周期（macOS）

受众：macOS 应用贡献者。目标：在唤醒词与按键说话功能重叠时，确保语音叠加的行为可预测。

### 当前意图
- 如果叠加已因唤醒词而可见，且用户按下快捷键，则快捷键会话会*采用*现有文本，而不是重置文本。在按住快捷键期间，叠加将持续显示。当用户松开快捷键时：如果有修剪后的文本，则发送；否则，关闭叠加。
- 单独的唤醒词仍会在静音时自动发送；按键说话则在松开时立即发送。

### 已实现（2025年12月9日）
- 叠加会话现在为每次捕获（唤醒词或按键说话）携带一个标记。当标记不匹配时，部分/最终/发送/关闭/级别更新会被丢弃，从而避免过时回调。
- 按键说话会将任何可见的叠加文本作为前缀（因此，在唤醒叠加显示时按下快捷键会保留现有文本并追加新语音）。它会等待最多1.5秒以获取最终转录结果，然后回退到当前文本。
- 钟声/叠加日志在`info`处以`voicewake.overlay`、`voicewake.ptt`和`voicewake.chime`类别发出（会话开始、部分、最终、发送、关闭、钟声原因）。

### 下一步
1. **VoiceSessionCoordinator（角色）**
   - 同一时间只拥有一个`VoiceSession`。
   - API（基于标记）：`beginWakeCapture`、`beginPushToTalk`、`updatePartial`、`endCapture`、`cancel`、`applyCooldown`。
   - 丢弃携带过时标记的回调（防止旧识别器重新打开叠加）。
2. **VoiceSession（模型）**
   - 字段：`token`、`source`（唤醒词|按键说话）、已提交/易失性文本、钟声标志、计时器（自动发送、空闲）、`overlayMode`（显示|编辑|发送）、冷却截止时间。
3. **叠加绑定**
   - `VoiceSessionPublisher`（`ObservableObject`）将活动会话镜像到 SwiftUI。
   - `VoiceWakeOverlayView`仅通过发布者渲染；它从不直接修改全局单例。
   - 叠加用户操作（`sendNow`、`dismiss`、`edit`）会使用会话标记回调协调器。
4. **统一发送路径**
   - 在`endCapture`上：如果修剪后的文本为空→关闭；否则`performSend(session:)`（播放一次发送钟声，转发，关闭）。
   - 按键说话：无延迟；唤醒词：可选延迟用于自动发送。
   - 在按键说话结束后对唤醒运行时应用短暂冷却，以防止唤醒词立即再次触发。
5. **日志记录**
   - 协调器在子系统`bot.molt`中以`voicewake.overlay`和`voicewake.chime`类别发出`.info`日志。
   - 关键事件：`session_started`、`adopted_by_push_to_talk`、`partial`、`finalized`、`send`、`dismiss`、`cancel`、`cooldown`。

### 调试检查清单
- 在重现卡滞叠加时流式传输日志：

  ```bash
  sudo log stream --predicate 'subsystem == "bot.molt" AND category CONTAINS "voicewake"' --level info --style compact
  ```
- 验证是否只有一个活动会话标记；过时回调应由协调器丢弃。
- 确保按键说话释放始终使用活动标记调用`endCapture`；如果文本为空，预期为`dismiss`，不带钟声或发送。

### 迁移步骤（建议）
1. 添加`VoiceSessionCoordinator`、`VoiceSession`和`VoiceSessionPublisher`。
2. 重构`VoiceWakeRuntime`以创建/更新/结束会话，而不是直接操作`VoiceWakeOverlayController`。
3. 重构`VoicePushToTalk`以采用现有会话，并在释放时调用`endCapture`；应用运行时冷却。
4. 将`VoiceWakeOverlayController`连接到发布者；移除来自运行时/PTT的直接调用。
5. 添加会话采用、冷却和空文本关闭的集成测试。

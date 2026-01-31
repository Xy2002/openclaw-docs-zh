---
summary: Gateway singleton guard using the WebSocket listener bind
read_when:
  - Running or debugging the gateway process
  - Investigating single-instance enforcement
---
# 网关锁

最后更新：2025-12-11

## 原因
- 确保在同一主机的每个基础端口上仅运行一个网关实例；额外的网关必须使用隔离的配置文件和唯一的端口。
- 在发生崩溃或收到SIGKILL信号时能够正常恢复，且不会留下过期的锁文件。
- 当控制端口已被占用时，立即以清晰的错误信息快速失败。

## 机制
- 网关在启动时立即通过独占TCP监听器绑定WebSocket监听器（默认为`ws://127.0.0.1:18789`）。
- 如果绑定失败并返回`EADDRINUSE`，启动过程将抛出`GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`。
- 操作系统会在任何进程退出时自动释放监听器，包括进程崩溃或收到SIGKILL信号——无需单独的锁文件或清理步骤。
- 在关闭时，网关会关闭WebSocket服务器及其底层HTTP服务器，以尽快释放端口。

## 错误表现
- 如果其他进程已占用该端口，启动过程将抛出`GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`。
- 其他绑定失败将以`GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")`的形式暴露出来。

## 运维注意事项
- 如果端口被*另一个*进程占用，错误信息相同；请释放该端口，或使用`openclaw gateway --port <port>`选择其他端口。
- macOS应用程序在启动网关之前仍会维护其自身的轻量级PID守护机制；运行时锁则由WebSocket绑定来强制实施。

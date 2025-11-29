# bg - 后台进程管理器

[English](README.md) | [中文](README_CN.md)

一个简单的 Windows 后台进程管理工具。在独立的终端窗口中运行长时间任务，不阻塞主终端。

## 特性

- **非阻塞**: 在新窗口中启动进程，主终端保持空闲
- **持久化**: 跨终端会话追踪进程状态
- **日志记录**: 所有输出带时间戳保存到日志文件
- **进程树控制**: 停止命令会终止整个进程树

## 安装

```bash
npm install -g bg-manager
```

## 使用方法

### 启动进程
```bash
bg start <名称> "<命令>" [选项]

# 选项:
#   --cwd <目录>      工作目录
#   --daemon, -d      无窗口模式运行（类似pm2）
#   --env KEY=VALUE   设置环境变量（可多次使用）

# 示例
bg start server "npm run dev" --cwd /path/to/project
bg start kernel "python main.py"
bg start api "node server.js" --daemon
bg start worker "python task.py" --env API_KEY=xxx --env DEBUG=1
```

### 查看状态
```bash
bg list              # 列出所有实例
bg status <名称>     # 显示实例详情
bg logs <名称>       # 查看日志输出（最后50行）
bg logs <名称> -n 100  # 查看最后100行
bg logs <名称> -f    # 实时跟踪日志输出
```

### 停止进程
```bash
bg stop <名称>       # 停止指定实例
bg stopall           # 停止所有运行中的实例
```

### 管理历史记录
```bash
bg history <名称>    # 查看实例历史
bg prune             # 清理旧实例（保留最近10个）
bg prune --keep 5    # 每个名称只保留最近5个
```

### 帮助
```bash
bg --help            # 显示所有命令
bg <命令> --help     # 显示特定命令的帮助
bg --version         # 显示版本号
```

## 工作原理

- 每次 `bg start` 会创建一个新的 PowerShell 窗口运行命令
- 输出带时间戳保存到 `~/.bg-manager/instances/<id>/log.txt`
- 实例元数据存储在 `~/.bg-manager/`
- `bg` 命令立即返回，进程独立运行

## 数据位置

所有数据存储在 `~/.bg-manager/`：
- `active.json` - 当前活动的实例
- `instances/<id>/` - 实例数据和日志

## 系统要求

- Windows（使用 PowerShell 进行窗口管理）
- Node.js >= 14

## 许可证

MIT

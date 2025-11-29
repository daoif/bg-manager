# bg - Background Process Manager

[English](README.md) | [中文](README_CN.md)

A simple background process manager for Windows. Run long-running processes in separate terminal windows without blocking your main terminal.

## Features

- **Non-blocking**: Launch processes in new windows, your terminal stays free
- **Persistent**: Track processes across terminal sessions
- **Logging**: All output is timestamped and saved to log files
- **Process tree control**: Stop commands kill the entire process tree

## Installation

```bash
npm install -g bg-manager
```

## Usage

### Start a process
```bash
bg start <name> "<command>" [options]

# Options:
#   --cwd <dir>       Working directory
#   --daemon, -d      Run headless (no window, like pm2)
#   --env KEY=VALUE   Set environment variables (can be used multiple times)

# Examples
bg start server "npm run dev" --cwd /path/to/project
bg start kernel "python main.py"
bg start api "node server.js" --daemon
bg start worker "python task.py" --env API_KEY=xxx --env DEBUG=1
```

### View status
```bash
bg list              # List all instances
bg status <name>     # Show details for an instance
bg logs <name>       # View log output (last 50 lines)
bg logs <name> -n 100  # View last 100 lines
bg logs <name> -f    # Follow log output in real-time
```

### Stop processes
```bash
bg stop <name>       # Stop a specific instance
bg stopall           # Stop all running instances
```

### Manage history
```bash
bg history <name>    # View instance history
bg prune             # Clean up old instances (keep last 10)
bg prune --keep 5    # Keep only last 5 per name
```

### Help
```bash
bg --help            # Show all commands
bg <command> --help  # Show help for a specific command
bg --version         # Show version
```

## How it works

- Each `bg start` creates a new PowerShell window running your command
- Output is captured with timestamps to `~/.bg-manager/instances/<id>/log.txt`
- Instance metadata is stored in `~/.bg-manager/`
- The `bg` command returns immediately, the process runs independently

## Data location

All data is stored in `~/.bg-manager/`:
- `active.json` - Currently active instances
- `instances/<id>/` - Instance data and logs

## Requirements

- Windows (uses PowerShell for window management)
- Node.js >= 14

## License

MIT

# bg-manager: Warp Agent Prompt

> Copy this prompt to your Warp Agent rules to enable background process management.

---

## Prompt

For long-running commands that don't need synchronous output (e.g., `npm run dev`, `python server.py`, dev servers, watchers), use the `bg` command instead of running them directly:

```bash
# Start a background process
bg start <name> "<command>" --cwd <directory>

# View logs
bg logs <name>           # Last 50 lines
bg logs <name> -f        # Follow in real-time

# Stop when done
bg stop <name>
```

**Why**: Running long commands directly blocks Warp's terminal. `bg` launches them in a separate window, letting you continue working immediately. All output is logged with timestamps for later review.

**Quick reference**:
- `bg list` - Show running processes
- `bg status <name>` - Show process details
- `bg stopall` - Stop all processes

---

Install: `npm install -g bg-manager`

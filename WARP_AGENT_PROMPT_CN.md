# bg-manager: Warp Agent 提示词

> 将此提示词复制到 Warp Agent 规则中，启用后台进程管理。

---

## 提示词

对于不需要同步输出的长时间运行命令（如 `npm run dev`、`python server.py`、开发服务器、监视器），使用 `bg` 命令而不是直接运行：

```bash
# 启动后台进程
bg start <名称> "<命令>" --cwd <目录>

# 查看日志
bg logs <名称>           # 最后50行
bg logs <名称> -f        # 实时跟踪

# 完成后停止
bg stop <名称>
```

**原因**：直接运行长命令会阻塞 Warp 终端。`bg` 在独立窗口中启动它们，让你可以立即继续工作。所有输出都会带时间戳记录，方便后续查看。

**快速参考**：
- `bg list` - 显示运行中的进程
- `bg status <名称>` - 显示进程详情
- `bg stopall` - 停止所有进程

---

安装：`npm install -g bg-manager`

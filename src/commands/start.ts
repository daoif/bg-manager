import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import chalk from 'chalk';
import {
  ensureDirs,
  getActiveInstanceId,
  setActiveInstance,
  generateInstanceId,
  getLogPath,
  writeMeta,
  readMeta,
  isProcessRunning,
  InstanceMeta,
} from '../state';

interface StartOptions {
  name: string;
  command: string;
  cwd: string;
  daemon?: boolean;
  env?: string[];
}


function parseEnvVars(envArgs: string[] = []): Record<string, string> {
  const envVars: Record<string, string> = {};
  for (const arg of envArgs) {
    const idx = arg.indexOf('=');
    if (idx > 0) {
      envVars[arg.slice(0, idx)] = arg.slice(idx + 1);
    }
  }
  return envVars;
}

export async function startCommand(options: StartOptions): Promise<void> {
  const { name, command, cwd, daemon, env } = options;

  // Check if already running
  const existingId = getActiveInstanceId(name);
  if (existingId) {
    const meta = readMeta(existingId);
    const pid = meta?.pid || meta?.windowPid;
    if (meta && pid && isProcessRunning(pid)) {
      console.log(chalk.yellow(`Instance "${name}" is already running (PID: ${pid})`));
      console.log(chalk.yellow(`Use 'bg stop ${name}' to stop it first.`));
      process.exit(1);
    }
  }

  ensureDirs();
  const instanceId = generateInstanceId(name);
  const logFile = getLogPath(instanceId);

  // Ensure log directory exists
  const logDir = path.dirname(logFile);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  // Prepare environment
  const additionalEnv = parseEnvVars(env);
  const spawnEnv = { ...process.env, ...additionalEnv };

  const startedAt = new Date().toISOString();

  if (daemon) {
    // Daemon mode: true background, no terminal window
    // Use a logger helper process to capture output to file
    const loggerScript = path.join(__dirname, '..', 'logger.js');

    const wrapper = spawn('node', [loggerScript, logFile, cwd, command], {
      cwd,
      detached: true,
      stdio: 'ignore',
      env: spawnEnv,
      windowsHide: true,
    });

    if (!wrapper.pid) {
      console.log(chalk.red(`Failed to start process`));
      process.exit(1);
    }

    const meta: InstanceMeta = {
      pid: wrapper.pid,
      command,
      cwd,
      startedAt,
      logFile,
      name,
      instanceId,
    };

    writeMeta(instanceId, meta);
    setActiveInstance(name, instanceId);
    wrapper.unref();

    console.log(chalk.green(`Started "${name}" as daemon (PID: ${wrapper.pid})`));
    console.log(`  Instance: ${instanceId}`);
    console.log(`  Log file: ${logFile}`);
    console.log(chalk.dim(`Use 'bg logs ${name}' to view output`));
  } else {
    // Default: open a new terminal window (non-blocking, like original bg)
    // 
    // 关键设计（见 TROUBLESHOOTING.md）：
    // - 将启动脚本写入 _run.ps1 文件（UTF-8 BOM）
    // - 使用 PowerShell Start-Process 启动新窗口（纯PS窗口，支持UTF-8）
    // - 脚本开头写入 $PID 到 pid.txt，以便获取窗口PID
    
    const pidFile = path.join(path.dirname(logFile), 'pid.txt');
    const runScript = path.join(path.dirname(logFile), '_run.ps1');
    
    // 生成启动脚本内容
    // 注意：显式设置UTF-8编码，保持通用性，不依赖系统profile
    const scriptContent = [
      `# bg auto-generated script`,
      `# Force UTF-8 encoding for output and file writing`,
      `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8`,
      `$OutputEncoding = [System.Text.Encoding]::UTF8`,
      ``,
      `$PID | Set-Content -Path '${pidFile.replace(/'/g, "''")}' -Encoding UTF8`,
      `$ErrorActionPreference = 'Continue'`,
      `Set-Location '${cwd.replace(/'/g, "''")}'`,
      `& { ${command} } 2>&1 | ForEach-Object {`,
      `  $ts = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'`,
      `  "$ts" + [char]9 + $_ | Add-Content -Path '${logFile.replace(/'/g, "''")}'  -Encoding UTF8`,
      `  $_`,
      `}`,
    ].join('\r\n');
    
    // 写入脚本文件（带UTF-8 BOM，让Windows PowerShell正确识别编码）
    const BOM = '\uFEFF';
    fs.writeFileSync(runScript, BOM + scriptContent, 'utf-8');
    
    // 直接用 PowerShell Start-Process 启动新窗口
    // 不用detached，launcher执行完Start-Process后立即退出（几百毫秒）
    // 这样新窗口是纯PowerShell窗口，支持UTF-8
    const launcherCmd = `Start-Process powershell -ArgumentList '-NoExit','-NoProfile','-ExecutionPolicy','Bypass','-File','${runScript.replace(/'/g, "''")}'`;
    
    const child = spawn('powershell.exe', [
      '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', launcherCmd
    ], {
      cwd,
      stdio: 'ignore',
      env: spawnEnv,
      windowsHide: true,  // 隐藏 launcher PowerShell（它只是一个临时启动器）
    });
    
    // 等待launcher完成（很快，因为Start-Process是非阻塞的）
    await new Promise<void>((resolve) => child.on('close', resolve));
    
    // 等待PID文件被新窗口写入
    let windowPid: number | undefined;
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 100));
      if (fs.existsSync(pidFile)) {
        const pidStr = fs.readFileSync(pidFile, 'utf-8').trim();
        windowPid = parseInt(pidStr, 10);
        if (!isNaN(windowPid)) break;
      }
    }
    
    if (!windowPid) {
      console.log(chalk.yellow(`Warning: Could not capture window PID`));
    }

    const meta: InstanceMeta = {
      windowPid,
      command,
      cwd,
      startedAt,
      logFile,
      name,
      instanceId,
    };

    writeMeta(instanceId, meta);
    setActiveInstance(name, instanceId);

    console.log(chalk.green(`Started "${name}" in new window (PID: ${windowPid})`));
    console.log(`  Instance: ${instanceId}`);
    console.log(`  Log file: ${logFile}`);
  }
  // bg command exits immediately - instance runs independently
}


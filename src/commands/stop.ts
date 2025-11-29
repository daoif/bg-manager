import chalk from 'chalk';
import treeKill from 'tree-kill';
import {
  getActiveInstanceId,
  removeActiveInstance,
  readMeta,
  isProcessRunning,
} from '../state';

export async function stopCommand(name: string): Promise<void> {
  const instanceId = getActiveInstanceId(name);
  
  if (!instanceId) {
    console.log(chalk.yellow(`No active instance found for "${name}"`));
    process.exit(1);
  }

  const meta = readMeta(instanceId);
  if (!meta) {
    console.log(chalk.yellow(`Instance metadata not found for "${instanceId}"`));
    removeActiveInstance(name);
    process.exit(1);
  }

  const pid = meta.pid || meta.windowPid;
  if (!pid) {
    console.log(chalk.yellow(`No PID found for instance "${name}"`));
    removeActiveInstance(name);
    process.exit(1);
  }

  if (!isProcessRunning(pid)) {
    console.log(chalk.yellow(`Process (PID: ${pid}) is not running`));
    removeActiveInstance(name);
    console.log(chalk.dim(`Removed stale active entry for "${name}"`));
    return;
  }

  console.log(chalk.cyan(`Stopping "${name}" (PID: ${pid})...`));

  return new Promise((resolve) => {
    treeKill(pid, 'SIGTERM', (err) => {
      if (err) {
        console.log(chalk.red(`Failed to stop process: ${err.message}`));
        // Try force kill
        treeKill(pid, 'SIGKILL', (killErr) => {
          if (killErr) {
            console.log(chalk.red(`Force kill also failed: ${killErr.message}`));
          } else {
            console.log(chalk.green(`Force killed "${name}"`));
            removeActiveInstance(name);
          }
          resolve();
        });
      } else {
        console.log(chalk.green(`Stopped "${name}"`));
        removeActiveInstance(name);
        resolve();
      }
    });
  });
}

export async function stopAllCommand(): Promise<void> {
  const { getActiveMap } = await import('../state');
  const activeMap = getActiveMap();
  const names = Object.keys(activeMap);

  if (names.length === 0) {
    console.log(chalk.yellow('No active instances'));
    return;
  }

  console.log(chalk.cyan(`Stopping ${names.length} instance(s)...`));
  
  for (const name of names) {
    await stopCommand(name);
  }
}

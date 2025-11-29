import chalk from 'chalk';
import {
  getActiveInstanceId,
  readMeta,
  isProcessRunning,
} from '../state';

export function statusCommand(name: string): void {
  const instanceId = getActiveInstanceId(name);
  
  if (!instanceId) {
    console.log(chalk.yellow(`No active instance found for "${name}"`));
    process.exit(1);
  }

  const meta = readMeta(instanceId);
  if (!meta) {
    console.log(chalk.yellow(`Instance metadata not found for "${instanceId}"`));
    process.exit(1);
  }

  const pid = meta.pid || meta.windowPid;
  const running = pid ? isProcessRunning(pid) : false;
  const status = running ? chalk.green('RUNNING') : chalk.red('STOPPED');
  const mode = meta.windowPid ? 'window' : 'headless';

  console.log(chalk.bold(`Instance: ${name}`));
  console.log(`  Status:     ${status}`);
  console.log(`  PID:        ${pid || 'N/A'}`);
  console.log(`  Mode:       ${mode}`);
  console.log(`  Command:    ${meta.command}`);
  console.log(`  CWD:        ${meta.cwd}`);
  console.log(`  Started:    ${meta.startedAt}`);
  console.log(`  Instance ID: ${meta.instanceId}`);
  console.log(`  Log file:   ${meta.logFile}`);
}

import chalk from 'chalk';
import {
  getActiveMap,
  readMeta,
  isProcessRunning,
  getAllInstanceIds,
} from '../state';

export function listCommand(): void {
  const activeMap = getActiveMap();
  const activeNames = Object.keys(activeMap);
  const allInstances = getAllInstanceIds();

  console.log(chalk.bold('Active Instances:'));
  
  if (activeNames.length === 0) {
    console.log(chalk.dim('  (none)'));
  } else {
    for (const name of activeNames) {
      const instanceId = activeMap[name];
      const meta = readMeta(instanceId);
      
      if (meta) {
        const pid = meta.pid || meta.windowPid;
        const running = pid ? isProcessRunning(pid) : false;
        const status = running ? chalk.green('RUNNING') : chalk.red('STOPPED');
        const mode = meta.windowPid ? 'window' : 'headless';
        
        console.log(`  ${chalk.cyan(name)}`);
        console.log(`    Status: ${status}  PID: ${pid || 'N/A'}  Mode: ${mode}`);
        console.log(`    Instance: ${instanceId}`);
      } else {
        console.log(`  ${chalk.cyan(name)}: ${chalk.dim('(metadata missing)')}`);
      }
    }
  }

  // Count history per name
  const historyCount: Record<string, number> = {};
  for (const id of allInstances) {
    const nameMatch = id.match(/^(.+)_\d{8}_\d{6}$/);
    if (nameMatch) {
      const name = nameMatch[1];
      historyCount[name] = (historyCount[name] || 0) + 1;
    }
  }

  const historyNames = Object.keys(historyCount);
  if (historyNames.length > 0) {
    console.log('');
    console.log(chalk.bold('History Summary:'));
    for (const name of historyNames.sort()) {
      console.log(`  ${name}: ${historyCount[name]} instance(s)`);
    }
  }
}

import chalk from 'chalk';
import {
  getInstancesForName,
  readMeta,
  getActiveInstanceId,
} from '../state';

export function historyCommand(name: string): void {
  const instances = getInstancesForName(name);
  const activeInstanceId = getActiveInstanceId(name);
  
  if (instances.length === 0) {
    console.log(chalk.yellow(`No history found for "${name}"`));
    return;
  }

  console.log(chalk.bold(`History for "${name}" (${instances.length} instance(s)):`));
  
  for (const instanceId of instances) {
    const meta = readMeta(instanceId);
    const isActive = instanceId === activeInstanceId;
    const prefix = isActive ? chalk.green('* ') : '  ';
    
    if (meta) {
      const startedAt = meta.startedAt;
      console.log(`${prefix}${instanceId}`);
      console.log(`    Started: ${startedAt}`);
      console.log(`    Command: ${meta.command}`);
    } else {
      console.log(`${prefix}${instanceId} ${chalk.dim('(metadata missing)')}`);
    }
  }
}

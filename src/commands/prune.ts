import * as fs from 'fs';
import chalk from 'chalk';
import {
  getAllInstanceIds,
  getInstanceDir,
  getActiveInstanceId,
} from '../state';

interface PruneOptions {
  keep: number;
}

export function pruneCommand(options: PruneOptions): void {
  const { keep } = options;
  const allInstances = getAllInstanceIds();

  // Group by name
  const byName: Record<string, string[]> = {};
  for (const id of allInstances) {
    const nameMatch = id.match(/^(.+)_\d{8}_\d{6}$/);
    if (nameMatch) {
      const name = nameMatch[1];
      if (!byName[name]) {
        byName[name] = [];
      }
      byName[name].push(id);
    }
  }

  let totalDeleted = 0;

  for (const name of Object.keys(byName)) {
    // Sort by timestamp (newest first)
    const instances = byName[name].sort().reverse();
    const activeId = getActiveInstanceId(name);
    
    // Keep the most recent N instances (and always keep active)
    const toDelete: string[] = [];
    let kept = 0;
    
    for (const id of instances) {
      if (id === activeId) {
        // Always keep active instance
        continue;
      }
      if (kept < keep) {
        kept++;
        continue;
      }
      toDelete.push(id);
    }

    for (const id of toDelete) {
      const dir = getInstanceDir(id);
      try {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(chalk.dim(`Deleted: ${id}`));
        totalDeleted++;
      } catch (err) {
        console.log(chalk.red(`Failed to delete ${id}: ${err}`));
      }
    }
  }

  if (totalDeleted === 0) {
    console.log(chalk.green('Nothing to prune'));
  } else {
    console.log(chalk.green(`Pruned ${totalDeleted} instance(s)`));
  }
}

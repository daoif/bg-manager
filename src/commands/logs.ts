import * as fs from 'fs';
import chalk from 'chalk';
import {
  getActiveInstanceId,
  readMeta,
} from '../state';

interface LogsOptions {
  name: string;
  lines: number;
  follow?: boolean;
}

export function logsCommand(options: LogsOptions): void {
  const { name, lines, follow } = options;
  
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

  const logFile = meta.logFile;
  
  if (!fs.existsSync(logFile)) {
    console.log(chalk.yellow(`Log file not found: ${logFile}`));
    process.exit(1);
  }

  if (follow) {
    // Follow mode - tail the file and watch for changes
    console.log(chalk.dim(`--- Following ${logFile} (Ctrl+C to exit) ---`));
    
    // Print existing content first
    const content = fs.readFileSync(logFile, 'utf-8');
    const allLines = content.split(/\r?\n/).filter(l => l.length > 0);
    const tailLines = allLines.slice(-lines);
    for (const line of tailLines) {
      console.log(line);
    }
    
    // Watch for changes
    let lastSize = fs.statSync(logFile).size;
    
    const interval = setInterval(() => {
      try {
        const stat = fs.statSync(logFile);
        if (stat.size > lastSize) {
          // Read new content
          const fd = fs.openSync(logFile, 'r');
          const buffer = Buffer.alloc(stat.size - lastSize);
          fs.readSync(fd, buffer, 0, buffer.length, lastSize);
          fs.closeSync(fd);
          
          const newContent = buffer.toString('utf-8');
          const newLines = newContent.split(/\r?\n/);
          for (const line of newLines) {
            if (line.length > 0) {
              console.log(line);
            }
          }
          
          lastSize = stat.size;
        }
      } catch {
        // File might be deleted or inaccessible
      }
    }, 500);

    // Handle Ctrl+C
    process.on('SIGINT', () => {
      clearInterval(interval);
      console.log(chalk.dim('\n--- Stopped following ---'));
      process.exit(0);
    });
  } else {
    // Normal mode - just print tail
    const content = fs.readFileSync(logFile, 'utf-8');
    const allLines = content.split(/\r?\n/).filter(l => l.length > 0);
    const tailLines = allLines.slice(-lines);
    
    if (tailLines.length === 0) {
      console.log(chalk.dim('(no log content)'));
    } else {
      for (const line of tailLines) {
        console.log(line);
      }
    }
  }
}

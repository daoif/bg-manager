#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { readFileSync } from 'fs';
import { join } from 'path';

// Read version from package.json
const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));
const version: string = packageJson.version;
import { startCommand } from './commands/start';
import { stopCommand, stopAllCommand } from './commands/stop';
import { listCommand } from './commands/list';
import { statusCommand } from './commands/status';
import { logsCommand } from './commands/logs';
import { historyCommand } from './commands/history';
import { pruneCommand } from './commands/prune';

yargs(hideBin(process.argv))
  .scriptName('bg')
  .usage('$0 <command> [options]')
  .command(
    'start <name> <command>',
    'Start a background process',
    (yargs) => {
      return yargs
        .positional('name', {
          describe: 'Instance name',
          type: 'string',
          demandOption: true,
        })
        .positional('command', {
          describe: 'Command to run',
          type: 'string',
          demandOption: true,
        })
        .option('Cwd', {
          alias: 'cwd',
          describe: 'Working directory',
          type: 'string',
          default: process.cwd(),
        })
        .option('daemon', {
          alias: 'd',
          describe: 'Run as daemon (headless, no window, like pm2)',
          type: 'boolean',
          default: false,
        })
        .option('env', {
          describe: 'Environment variables (KEY=VALUE)',
          type: 'array',
          default: [],
        });
    },
    async (argv) => {
      await startCommand({
        name: argv.name as string,
        command: argv.command as string,
        cwd: argv.Cwd as string,
        daemon: argv.daemon,
        env: argv.env as string[],
      });
    }
  )
  .command(
    'stop <name>',
    'Stop a background process',
    (yargs) => {
      return yargs.positional('name', {
        describe: 'Instance name',
        type: 'string',
        demandOption: true,
      });
    },
    async (argv) => {
      await stopCommand(argv.name as string);
    }
  )
  .command(
    'list',
    'List active instances',
    () => {},
    () => {
      listCommand();
    }
  )
  .command(
    'status <name>',
    'Show status of an instance',
    (yargs) => {
      return yargs.positional('name', {
        describe: 'Instance name',
        type: 'string',
        demandOption: true,
      });
    },
    (argv) => {
      statusCommand(argv.name as string);
    }
  )
  .command(
    'logs <name>',
    'Show logs for an instance',
    (yargs) => {
      return yargs
        .positional('name', {
          describe: 'Instance name',
          type: 'string',
          demandOption: true,
        })
        .option('Lines', {
          alias: 'lines',
          describe: 'Number of lines to show',
          type: 'number',
          default: 50,
        })
        .option('follow', {
          alias: 'f',
          describe: 'Follow log output',
          type: 'boolean',
          default: false,
        });
    },
    (argv) => {
      logsCommand({
        name: argv.name as string,
        lines: argv.Lines as number,
        follow: argv.follow,
      });
    }
  )
  .command(
    'history <name>',
    'Show history for an instance name',
    (yargs) => {
      return yargs.positional('name', {
        describe: 'Instance name',
        type: 'string',
        demandOption: true,
      });
    },
    (argv) => {
      historyCommand(argv.name as string);
    }
  )
  .command(
    'stopall',
    'Stop all active instances',
    () => {},
    async () => {
      await stopAllCommand();
    }
  )
  .command(
    'prune',
    'Clean up old instances',
    (yargs) => {
      return yargs.option('keep', {
        describe: 'Number of instances to keep per name',
        type: 'number',
        default: 10,
      });
    },
    (argv) => {
      pruneCommand({ keep: argv.keep });
    }
  )
  .demandCommand(1, 'Please specify a command')
  .strict()
  .help()
  .alias('help', 'h')
  .version(version)
  .alias('version', 'v')
  .parse();

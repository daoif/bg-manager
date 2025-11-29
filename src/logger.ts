#!/usr/bin/env node

/**
 * Logger wrapper - runs in background and logs timestamped output to file
 * Usage: node logger.js <logFile> <cwd> <command> [args...]
 */

import * as fs from 'fs';
import { spawn } from 'child_process';

const args = process.argv.slice(2);
if (args.length < 3) {
  console.error('Usage: logger <logFile> <cwd> <command> [args...]');
  process.exit(1);
}

const [logFile, cwd, command, ...cmdArgs] = args;

const logStream = fs.createWriteStream(logFile, { flags: 'a' });

function formatTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

const child = spawn(command, cmdArgs, {
  cwd,
  shell: true,
  stdio: ['ignore', 'pipe', 'pipe'],
});

child.stdout?.on('data', (data: Buffer) => {
  const lines = data.toString().split(/\r?\n/);
  for (const line of lines) {
    if (line.length === 0) continue;
    const ts = formatTimestamp();
    logStream.write(`${ts}\t${line}\n`);
  }
});

child.stderr?.on('data', (data: Buffer) => {
  const lines = data.toString().split(/\r?\n/);
  for (const line of lines) {
    if (line.length === 0) continue;
    const ts = formatTimestamp();
    logStream.write(`${ts}\t${line}\n`);
  }
});

child.on('close', (code) => {
  const ts = formatTimestamp();
  logStream.write(`${ts}\t[bg] Process exited with code ${code}\n`);
  logStream.end();
  process.exit(0);
});

child.on('error', (err) => {
  const ts = formatTimestamp();
  logStream.write(`${ts}\t[bg] Process error: ${err.message}\n`);
});

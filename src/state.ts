import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const BG_DIR = path.join(os.homedir(), '.bg-manager');
const ACTIVE_FILE = path.join(BG_DIR, 'active.json');
const INSTANCES_DIR = path.join(BG_DIR, 'instances');

export interface InstanceMeta {
  pid?: number;
  windowPid?: number;
  command: string;
  cwd: string;
  startedAt: string;
  logFile: string;
  name: string;
  instanceId: string;
}

export interface ActiveMap {
  [name: string]: string; // name -> instanceId
}

export function ensureDirs(): void {
  if (!fs.existsSync(BG_DIR)) {
    fs.mkdirSync(BG_DIR, { recursive: true });
  }
  if (!fs.existsSync(INSTANCES_DIR)) {
    fs.mkdirSync(INSTANCES_DIR, { recursive: true });
  }
}

export function getActiveMap(): ActiveMap {
  if (!fs.existsSync(ACTIVE_FILE)) {
    return {};
  }
  try {
    const content = fs.readFileSync(ACTIVE_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

export function setActiveMap(map: ActiveMap): void {
  ensureDirs();
  fs.writeFileSync(ACTIVE_FILE, JSON.stringify(map, null, 2), 'utf-8');
}

export function getActiveInstanceId(name: string): string | undefined {
  const map = getActiveMap();
  return map[name];
}

export function setActiveInstance(name: string, instanceId: string): void {
  const map = getActiveMap();
  map[name] = instanceId;
  setActiveMap(map);
}

export function removeActiveInstance(name: string): void {
  const map = getActiveMap();
  delete map[name];
  setActiveMap(map);
}

export function generateInstanceId(name: string): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `${name}_${timestamp}`;
}

export function getInstanceDir(instanceId: string): string {
  return path.join(INSTANCES_DIR, instanceId);
}

export function getMetaPath(instanceId: string): string {
  return path.join(getInstanceDir(instanceId), 'meta.json');
}

export function getLogPath(instanceId: string): string {
  return path.join(getInstanceDir(instanceId), 'log.txt');
}

export function readMeta(instanceId: string): InstanceMeta | null {
  const metaPath = getMetaPath(instanceId);
  if (!fs.existsSync(metaPath)) {
    return null;
  }
  try {
    const content = fs.readFileSync(metaPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export function writeMeta(instanceId: string, meta: InstanceMeta): void {
  const dir = getInstanceDir(instanceId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(getMetaPath(instanceId), JSON.stringify(meta, null, 2), 'utf-8');
}

export function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export function getAllInstanceIds(): string[] {
  if (!fs.existsSync(INSTANCES_DIR)) {
    return [];
  }
  return fs.readdirSync(INSTANCES_DIR).filter(name => {
    const dir = path.join(INSTANCES_DIR, name);
    return fs.statSync(dir).isDirectory() && fs.existsSync(path.join(dir, 'meta.json'));
  });
}

export function getInstancesForName(name: string): string[] {
  return getAllInstanceIds()
    .filter(id => id.startsWith(`${name}_`))
    .sort()
    .reverse();
}

export { BG_DIR, ACTIVE_FILE, INSTANCES_DIR };

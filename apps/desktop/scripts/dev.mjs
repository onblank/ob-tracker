import { spawn } from 'node:child_process';
import { existsSync, watch } from 'node:fs';
import net from 'node:net';
import { dirname, resolve } from 'node:path';

const cwd = resolve(import.meta.dirname, '..');
const children = new Set();
let electron = null;
let restartTimer = null;

function run(args) {
  const child = spawn('pnpm', args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' });
  children.add(child);
  child.on('exit', () => children.delete(child));
  return child;
}

function waitForPort(port) {
  return new Promise((resolveReady) => {
    const attempt = () => {
      const socket = net.connect(port, '127.0.0.1');
      socket.once('connect', () => { socket.destroy(); resolveReady(); });
      socket.once('error', () => setTimeout(attempt, 150));
    };
    attempt();
  });
}

function waitForFile(path) {
  return new Promise((resolveReady) => {
    const attempt = () => existsSync(path) ? resolveReady() : setTimeout(attempt, 150);
    attempt();
  });
}

function startElectron() {
  if (electron) electron.kill();
  electron = run(['exec', 'electron', '.']);
}

const mainFile = resolve(cwd, 'dist/main/main.js');
const preloadFile = resolve(cwd, 'dist/preload/preload.cjs');
run(['exec', 'vite', '--config', 'vite.renderer.config.ts']);
run(['exec', 'vite', 'build', '--config', 'vite.main.config.ts', '--watch']);
run(['exec', 'vite', 'build', '--config', 'vite.preload.config.ts', '--watch']);

await Promise.all([waitForPort(5173), waitForFile(mainFile), waitForFile(preloadFile)]);
startElectron();

for (const file of [mainFile, preloadFile]) {
  watch(dirname(file), (_event, changed) => {
    if (changed && !file.endsWith(String(changed))) return;
    clearTimeout(restartTimer);
    restartTimer = setTimeout(startElectron, 250);
  });
}

function shutdown() {
  for (const child of children) child.kill();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

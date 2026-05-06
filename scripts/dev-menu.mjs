import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { spawn, execFileSync } from 'node:child_process';
import { openSync, closeSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const HOST = '127.0.0.1';
const PORT = '5173';
const URL = `http://${HOST}:${PORT}/`;
const OUT_LOG = join(ROOT, 'vite-dev.out.log');
const ERR_LOG = join(ROOT, 'vite-dev.err.log');
const PID_FILE = join(process.env.TEMP || ROOT, 'salvation-breakers-vite.pid');

let serverPid = readSavedPid();

const rl = createInterface({ input, output });

process.on('SIGINT', async () => {
  await stopServer();
  rl.close();
  process.exit(0);
});

await startServer();
await menuLoop();

async function menuLoop() {
  while (true) {
    console.clear();
    console.log('Salvation Breakers Dev Server');
    console.log('');
    showStatus();
    console.log('');
    console.log('[R] Restart server');
    console.log('[O] Open server in browser');
    console.log('[Q] Quit server and close');
    console.log('');

    const answer = (await askMenu()).trim().toUpperCase();

    if (answer === 'R') {
      await stopServer();
      await startServer();
    } else if (answer === 'O') {
      openBrowser();
    } else if (answer === 'Q') {
      await stopServer();
      rl.close();
      return;
    }
  }
}

async function askMenu() {
  try {
    return await rl.question('Type R, O, or Q and press Enter: ');
  } catch (error) {
    if (error && error.code === 'ERR_USE_AFTER_CLOSE') return 'Q';
    throw error;
  }
}

async function startServer() {
  if (isRunning(serverPid)) return;

  writeFileSync(OUT_LOG, '');
  writeFileSync(ERR_LOG, '');

  const outFd = openSync(OUT_LOG, 'a');
  const errFd = openSync(ERR_LOG, 'a');

  const child = spawn(
    'cmd.exe',
    ['/d', '/s', '/c', `npm.cmd run dev -- --port ${PORT}`],
    {
      cwd: ROOT,
      detached: true,
      windowsHide: true,
      stdio: ['ignore', outFd, errFd],
    },
  );

  serverPid = child.pid;
  writeFileSync(PID_FILE, String(serverPid));
  child.unref();

  closeSync(outFd);
  closeSync(errFd);

  await sleep(1500);
}

async function stopServer() {
  if (isRunning(serverPid)) {
    try {
      execFileSync('taskkill.exe', ['/PID', String(serverPid), '/T', '/F'], { stdio: 'ignore' });
    } catch {
      // Already stopped.
    }
  }

  serverPid = undefined;
  try {
    writeFileSync(PID_FILE, '');
  } catch {
    // Ignore temp file cleanup problems.
  }

  await sleep(500);
}

function openBrowser() {
  spawn('cmd.exe', ['/d', '/c', 'start', '', URL], {
    cwd: ROOT,
    detached: true,
    windowsHide: true,
    stdio: 'ignore',
  }).unref();
}

function showStatus() {
  if (isRunning(serverPid)) {
    console.log(`Status: running, PID ${serverPid}`);
  } else {
    console.log('Status: stopped');
  }
  console.log(`URL:    ${URL}`);
  console.log(`Logs:   ${OUT_LOG}`);
}

function isRunning(pid) {
  if (!pid) return false;

  try {
    const result = execFileSync('tasklist.exe', ['/FI', `PID eq ${pid}`, '/NH'], { encoding: 'utf8' });
    return result.includes(String(pid));
  } catch {
    return false;
  }
}

function readSavedPid() {
  if (!existsSync(PID_FILE)) return undefined;

  const pid = Number(readFileSync(PID_FILE, 'utf8').trim());
  return Number.isFinite(pid) && pid > 0 ? pid : undefined;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

import { app, BrowserWindow, globalShortcut, ipcMain, Menu, nativeImage, Tray } from 'electron';
import { randomUUID } from 'node:crypto';
import { join, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { CompleteOnboarding, GetBootstrapState } from '@obt/application';
import type { CompleteOnboardingInput } from '@obt/application';
import type { Clock, IdGenerator } from '@obt/contracts';
import { migrateDatabase, openDatabase, SqliteSettingsRepository, SqliteUnitOfWork, SqliteWorkerRepository } from '@obt/db-sqlite';
import { IPC } from '../shared/ipc';

class SystemClock implements Clock {
  public now(): Date { return new Date(); }
  public monotonicMilliseconds(): number { return performance.now(); }
}
class CryptoIdGenerator implements IdGenerator {
  public generate(): string { return randomUUID(); }
}

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

function getMigrationsDirectory(): string {
  return app.isPackaged
    ? join(process.resourcesPath, 'migrations')
    : resolve(app.getAppPath(), '../../packages/db-sqlite/migrations');
}

function getTrayIconPath(): string {
  return app.isPackaged
    ? join(process.resourcesPath, 'tray-icon.png')
    : join(app.getAppPath(), 'build/tray-icon.png');
}

function showMainWindow(): void {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

function createTray(): void {
  const icon = nativeImage.createFromPath(getTrayIconPath());
  tray = new Tray(icon);
  tray.setToolTip('OB-Tracker');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Open OB-Tracker', click: showMainWindow },
    { type: 'separator' },
    { label: 'Quit', click: () => { isQuitting = true; app.quit(); } },
  ]));
  tray.on('double-click', showMainWindow);
}

async function createWindow(): Promise<BrowserWindow> {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 980,
    minHeight: 640,
    show: false,
    backgroundColor: '#F7F8FC',
    title: 'OB-Tracker',
    webPreferences: {
      preload: join(app.getAppPath(), 'dist/preload/preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      window.hide();
    }
  });
  window.once('ready-to-show', () => window.show());

  if (app.isPackaged) await window.loadFile(join(app.getAppPath(), 'dist/renderer/index.html'));
  else await window.loadURL('http://127.0.0.1:5173');

  return window;
}

async function start(): Promise<void> {
  await app.whenReady();

  const db = openDatabase(join(app.getPath('userData'), 'ob-tracker.sqlite'));
  migrateDatabase(db, getMigrationsDirectory());

  const workers = new SqliteWorkerRepository(db);
  const settings = new SqliteSettingsRepository(db);
  const unitOfWork = new SqliteUnitOfWork(db);
  const clock = new SystemClock();
  const ids = new CryptoIdGenerator();
  const getBootstrapState = new GetBootstrapState(workers, settings);
  const completeOnboarding = new CompleteOnboarding(workers, settings, unitOfWork, clock, ids);

  ipcMain.handle(IPC.bootstrapGet, () => getBootstrapState.execute());
  ipcMain.handle(IPC.onboardingComplete, (_event, input: unknown) => completeOnboarding.execute(input as CompleteOnboardingInput));
  ipcMain.handle(IPC.windowHide, () => mainWindow?.hide());

  mainWindow = await createWindow();
  createTray();

  const configuredShortcut = settings.get().globalShortcut;
  if (configuredShortcut) {
    const registered = globalShortcut.register(configuredShortcut, () => {
      if (!mainWindow) return;
      if (mainWindow.isVisible()) mainWindow.hide();
      else showMainWindow();
    });
    if (!registered) console.warn(`Global shortcut could not be registered: ${configuredShortcut}`);
  }

  app.on('activate', showMainWindow);
  app.on('before-quit', () => { isQuitting = true; });
  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
    db.close();
  });
}

void start().catch((error: unknown) => {
  console.error('Failed to start OB-Tracker', error);
  app.quit();
});

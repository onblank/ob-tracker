import { contextBridge, ipcRenderer } from 'electron';
import type { ObTrackerDesktopApi } from '../shared/ipc';
import { IPC } from '../shared/ipc';

const api: ObTrackerDesktopApi = {
  getBootstrapState: () => ipcRenderer.invoke(IPC.bootstrapGet),
  completeOnboarding: (input) => ipcRenderer.invoke(IPC.onboardingComplete, input),
  hideWindow: () => ipcRenderer.invoke(IPC.windowHide),
};

contextBridge.exposeInMainWorld('obTracker', api);

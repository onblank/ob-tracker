import { contextBridge, ipcRenderer } from 'electron';
import type { ObTrackerDesktopApi } from '../shared/ipc';
import { IPC } from '../shared/ipc';

const api: ObTrackerDesktopApi = {
  getBootstrapState: () => ipcRenderer.invoke(IPC.bootstrapGet),
  completeOnboarding: (input) => ipcRenderer.invoke(IPC.onboardingComplete, input),
  getTrackerState: () => ipcRenderer.invoke(IPC.trackerGet),
  createClient: (input) => ipcRenderer.invoke(IPC.clientCreate, input),
  createProject: (input) => ipcRenderer.invoke(IPC.projectCreate, input),
  startTimer: (input) => ipcRenderer.invoke(IPC.timerStart, input),
  stopTimer: () => ipcRenderer.invoke(IPC.timerStop),
  hideWindow: () => ipcRenderer.invoke(IPC.windowHide),
};

contextBridge.exposeInMainWorld('obTracker', api);

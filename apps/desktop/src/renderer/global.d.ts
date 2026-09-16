import type { ObTrackerDesktopApi } from '../shared/ipc';

declare global {
  interface Window { obTracker: ObTrackerDesktopApi; }
}
export {};

import type { TimeInterval } from './types';

export function validateInterval(interval: TimeInterval): void {
  if (!Number.isFinite(interval.startedAtMs) || !Number.isFinite(interval.endedAtMs))
    throw new Error('Interval timestamps must be finite');
  if (interval.endedAtMs <= interval.startedAtMs)
    throw new Error('Time interval must have positive duration');
}

export function intervalsOverlap(a: TimeInterval, b: TimeInterval): boolean {
  validateInterval(a); validateInterval(b);
  return a.startedAtMs < b.endedAtMs && b.startedAtMs < a.endedAtMs;
}

export function autoStopAt(startedAtMs: number, maxDurationSeconds: number): number {
  if (!Number.isFinite(startedAtMs)) throw new Error('startedAtMs must be finite');
  if (!Number.isInteger(maxDurationSeconds) || maxDurationSeconds <= 0)
    throw new Error('maxDurationSeconds must be a positive integer');
  return startedAtMs + maxDurationSeconds * 1000;
}

export function shouldAutoStop(input: {startedAtMs: number; nowMs: number; maxDurationSeconds: number;}): boolean {
  return input.nowMs >= autoStopAt(input.startedAtMs, input.maxDurationSeconds);
}

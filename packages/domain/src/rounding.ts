import type { RoundingIncrementMinutes, RoundingMode } from './types';

export function roundDurationSeconds(rawSeconds: number, mode: RoundingMode, incrementMinutes: RoundingIncrementMinutes): number {
  if (!Number.isInteger(rawSeconds) || rawSeconds <= 0) throw new Error('rawSeconds must be a positive integer');
  if (mode === 'none') return rawSeconds;
  const increment = incrementMinutes * 60;
  const ratio = rawSeconds / increment;
  switch (mode) {
    case 'nearest': return Math.max(increment, Math.round(ratio) * increment);
    case 'up': return Math.ceil(ratio) * increment;
    case 'down': return Math.max(increment, Math.floor(ratio) * increment);
  }
}

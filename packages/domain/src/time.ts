import { calculateHourlyAmount } from './billing';
import { roundDurationSeconds } from './rounding';
import type {
  BillingModel,
  RoundingIncrementMinutes,
  RoundingMode,
  TimeInterval,
  WorkType,
} from './types';

export function validateInterval(interval: TimeInterval): void {
  if (!Number.isFinite(interval.startedAtMs) || !Number.isFinite(interval.endedAtMs))
    throw new Error('Interval timestamps must be finite');
  if (interval.endedAtMs <= interval.startedAtMs)
    throw new Error('Time interval must have positive duration');
}

export function intervalsOverlap(a: TimeInterval, b: TimeInterval): boolean {
  validateInterval(a);
  validateInterval(b);
  return a.startedAtMs < b.endedAtMs && b.startedAtMs < a.endedAtMs;
}

export function autoStopAt(startedAtMs: number, maxDurationSeconds: number): number {
  if (!Number.isFinite(startedAtMs)) throw new Error('startedAtMs must be finite');
  if (!Number.isInteger(maxDurationSeconds) || maxDurationSeconds <= 0)
    throw new Error('maxDurationSeconds must be a positive integer');
  return startedAtMs + maxDurationSeconds * 1000;
}

export function shouldAutoStop(input: {
  startedAtMs: number;
  nowMs: number;
  maxDurationSeconds: number;
}): boolean {
  return input.nowMs >= autoStopAt(input.startedAtMs, input.maxDurationSeconds);
}

export function calculateClosedTimeEntry(input: {
  startedAtMs: number;
  endedAtMs: number;
  workType: WorkType;
  billingModel: BillingModel;
  hourlyRateMinor: number | null;
  currencyCode: string | null;
  roundingMode: RoundingMode;
  roundingIncrementMinutes: RoundingIncrementMinutes;
}): { rawDurationSeconds: number; roundedDurationSeconds: number; calculatedAmountMinor: number } {
  validateInterval({ startedAtMs: input.startedAtMs, endedAtMs: input.endedAtMs });
  const rawDurationSeconds = Math.max(1, Math.floor((input.endedAtMs - input.startedAtMs) / 1000));
  const roundedDurationSeconds = roundDurationSeconds(
    rawDurationSeconds,
    input.roundingMode,
    input.roundingIncrementMinutes,
  );

  if (input.billingModel !== 'hourly') {
    return { rawDurationSeconds, roundedDurationSeconds, calculatedAmountMinor: 0 };
  }
  if (input.hourlyRateMinor === null || input.currencyCode === null) {
    throw new Error('Hourly time entry requires a rate and currency');
  }

  const amount = calculateHourlyAmount({
    roundedDurationSeconds,
    hourlyRateMinor: input.hourlyRateMinor,
    workType: input.workType,
    currencyCode: input.currencyCode,
  });
  return { rawDurationSeconds, roundedDurationSeconds, calculatedAmountMinor: amount.amountMinor };
}

import { describe, expect, it } from 'vitest';
import {
  autoStopAt,
  calculateClosedTimeEntry,
  calculateHourlyAmount,
  intervalsOverlap,
  resolveEntryBillingTerm,
  resolveWorkType,
  roundDurationSeconds,
  shouldAutoStop,
} from './index';

describe('work type', () => {
  it('resolves task > project > client', () => {
    expect(resolveWorkType({ client: 'billable', project: 'learning', task: 'non_billable' })).toBe(
      'non_billable',
    );
    expect(resolveWorkType({ client: 'billable', project: 'learning', task: null })).toBe(
      'learning',
    );
    expect(resolveWorkType({ client: 'billable', project: null, task: null })).toBe('billable');
  });
});
describe('billing', () => {
  it('resolves task > project > client', () => {
    const client = {
      id: 'c',
      billingModel: 'hourly' as const,
      hourlyRateMinor: 5000,
      currencyCode: 'EUR',
    };
    const project = {
      id: 'p',
      billingModel: 'fixed' as const,
      fixedAmountMinor: 2500000,
      currencyCode: 'EUR',
    };
    const task = {
      id: 't',
      billingModel: 'hourly' as const,
      hourlyRateMinor: 10000,
      currencyCode: 'EUR',
    };
    expect(resolveEntryBillingTerm({ client, project, task })?.id).toBe('t');
    expect(resolveEntryBillingTerm({ client, project, task: null })?.id).toBe('p');
  });
  it('does not bill learning time hourly', () => {
    expect(
      calculateHourlyAmount({
        roundedDurationSeconds: 3600,
        hourlyRateMinor: 10000,
        workType: 'learning',
        currencyCode: 'EUR',
      }).amountMinor,
    ).toBe(0);
  });
});
describe('rounding', () => {
  it('preserves raw with none', () => expect(roundDurationSeconds(4020, 'none', 15)).toBe(4020));
  it('rounds up', () => expect(roundDurationSeconds(4020, 'up', 15)).toBe(4500));
});
describe('overlaps', () => {
  it('allows touching, rejects overlap', () => {
    expect(
      intervalsOverlap({ startedAtMs: 0, endedAtMs: 10 }, { startedAtMs: 9, endedAtMs: 20 }),
    ).toBe(true);
    expect(
      intervalsOverlap({ startedAtMs: 0, endedAtMs: 10 }, { startedAtMs: 10, endedAtMs: 20 }),
    ).toBe(false);
  });
});
describe('auto-stop', () => {
  it('stops at start + max', () => {
    expect(autoStopAt(1000, 86400)).toBe(86401000);
    expect(shouldAutoStop({ startedAtMs: 1000, nowMs: 86401000, maxDurationSeconds: 86400 })).toBe(
      true,
    );
  });
});
describe('closed time entries', () => {
  it('calculates factual, rounded and billable duration', () => {
    expect(
      calculateClosedTimeEntry({
        startedAtMs: 0,
        endedAtMs: 61 * 60 * 1000,
        workType: 'billable',
        billingModel: 'hourly',
        hourlyRateMinor: 6000,
        currencyCode: 'EUR',
        roundingMode: 'up',
        roundingIncrementMinutes: 15,
      }),
    ).toEqual({
      rawDurationSeconds: 3660,
      roundedDurationSeconds: 4500,
      calculatedAmountMinor: 7500,
    });
  });

  it('does not repeat fixed amounts on a time entry', () => {
    expect(
      calculateClosedTimeEntry({
        startedAtMs: 0,
        endedAtMs: 60_000,
        workType: 'billable',
        billingModel: 'fixed',
        hourlyRateMinor: null,
        currencyCode: 'EUR',
        roundingMode: 'none',
        roundingIncrementMinutes: 1,
      }).calculatedAmountMinor,
    ).toBe(0);
  });
});

import type { BillingTermView, Money, WorkType } from './types';

export function resolveEntryBillingTerm(input: {
  client?: BillingTermView | null; project?: BillingTermView | null; task?: BillingTermView | null;
}): BillingTermView | null {
  return input.task ?? input.project ?? input.client ?? null;
}

export function calculateHourlyAmount(input: {
  roundedDurationSeconds: number; hourlyRateMinor: number; workType: WorkType; currencyCode: string;
}): Money {
  if (!Number.isInteger(input.roundedDurationSeconds) || input.roundedDurationSeconds <= 0)
    throw new Error('roundedDurationSeconds must be a positive integer');
  if (!Number.isInteger(input.hourlyRateMinor) || input.hourlyRateMinor < 0)
    throw new Error('hourlyRateMinor must be a non-negative integer');
  if (input.workType !== 'billable') return { amountMinor: 0, currencyCode: input.currencyCode };
  return { amountMinor: Math.round((input.roundedDurationSeconds / 3600) * input.hourlyRateMinor), currencyCode: input.currencyCode };
}

export function fixedComponentAmount(input: {fixedAmountMinor: number; workType: WorkType; currencyCode: string;}): Money {
  if (!Number.isInteger(input.fixedAmountMinor) || input.fixedAmountMinor < 0)
    throw new Error('fixedAmountMinor must be a non-negative integer');
  return { amountMinor: input.workType === 'billable' ? input.fixedAmountMinor : 0, currencyCode: input.currencyCode };
}

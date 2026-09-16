export const WORK_TYPES = ['billable', 'non_billable', 'learning'] as const;
export type WorkType = (typeof WORK_TYPES)[number];

export const ENTITY_STATUSES = ['not_started', 'in_progress', 'completed'] as const;
export type EntityStatus = (typeof ENTITY_STATUSES)[number];

export const BILLING_MODELS = ['none', 'hourly', 'fixed'] as const;
export type BillingModel = (typeof BILLING_MODELS)[number];

export const ROUNDING_MODES = ['none', 'nearest', 'up', 'down'] as const;
export type RoundingMode = (typeof ROUNDING_MODES)[number];

export const ROUNDING_INCREMENTS_MINUTES = [1, 5, 6, 10, 15, 30, 60] as const;
export type RoundingIncrementMinutes = (typeof ROUNDING_INCREMENTS_MINUTES)[number];

export interface Money { readonly amountMinor: number; readonly currencyCode: string; }

export interface BillingTermView {
  readonly id: string;
  readonly billingModel: BillingModel;
  readonly hourlyRateMinor?: number | null;
  readonly fixedAmountMinor?: number | null;
  readonly currencyCode?: string | null;
}

export interface TimeInterval {
  readonly startedAtMs: number;
  readonly endedAtMs: number;
}

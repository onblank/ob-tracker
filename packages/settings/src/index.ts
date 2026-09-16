import { z } from 'zod';
export const settingsSchema = z.object({
  language: z.string().min(1).default('system'),
  defaultCurrencyCode: z.string().regex(/^[A-Z]{3}$/).default('EUR'),
  defaultWorkType: z.enum(['billable','non_billable','learning']).default('billable'),
  defaultBillingModel: z.enum(['none','hourly']).default('hourly'),
  defaultHourlyRateMinor: z.number().int().nonnegative().nullable().default(null),
  autoStopEnabled: z.boolean().default(true),
  autoStopSeconds: z.number().int().positive().default(86400),
  idleDetectionEnabled: z.boolean().default(true),
  idleThresholdSeconds: z.number().int().positive().default(7200),
  roundingMode: z.enum(['none','nearest','up','down']).default('none'),
  roundingIncrementMinutes: z.union([z.literal(1),z.literal(5),z.literal(6),z.literal(10),z.literal(15),z.literal(30),z.literal(60)]).default(1),
  firstDayOfWeek: z.enum(['system','monday','sunday']).default('monday'),
  timeFormat: z.enum(['system','12h','24h']).default('system'),
  dateFormat: z.enum(['system','DD/MM/YYYY','MM/DD/YYYY','YYYY-MM-DD']).default('system'),
  theme: z.enum(['system','light','dark']).default('system'),
  backupReminderDays: z.number().int().positive().default(7),
  backupRetentionCount: z.number().int().positive().default(5),
  backupDirectory: z.string().nullable().default(null),
  backupReminderSnoozedUntil: z.string().nullable().default(null),
  globalShortcut: z.string().min(1).nullable().default('CommandOrControl+Shift+T'),
  minimizeToTray: z.boolean().default(true)
});
export type AppSettings = z.infer<typeof settingsSchema>;
export const DEFAULT_SETTINGS: AppSettings = settingsSchema.parse({});

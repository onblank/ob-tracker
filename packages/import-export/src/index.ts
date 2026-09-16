import { z } from 'zod';
import { NATIVE_EXPORT_FORMAT, NATIVE_EXPORT_SCHEMA_VERSION } from '@obt/shared';

export const NATIVE_SHARED_FILES = [
  'workers.csv',
  'clients.csv',
  'projects.csv',
  'tasks.csv',
  'billing_terms.csv',
  'time_entries.csv',
] as const;

export const NATIVE_HEADERS = {
  'workers.csv': ['id','display_name','company_name','created_at','updated_at'],
  'clients.csv': ['id','name','description','color_hex','work_type','created_at','updated_at','archived_at'],
  'projects.csv': ['id','client_id','name','description','status','color_hex','work_type_override','estimated_seconds','budget_amount_minor','budget_currency_code','created_at','updated_at','completed_at','archived_at'],
  'tasks.csv': ['id','project_id','name','description','status','color_hex','work_type_override','estimated_seconds','budget_amount_minor','budget_currency_code','created_at','updated_at','completed_at','archived_at'],
  'billing_terms.csv': ['id','client_id','project_id','task_id','billing_model','hourly_rate_minor','fixed_amount_minor','currency_code','effective_from','effective_to','created_at'],
  'time_entries.csv': ['id','worker_id','client_id','project_id','task_id','started_at','ended_at','started_timezone','started_utc_offset_minutes','ended_timezone','ended_utc_offset_minutes','note','source','stop_reason','work_type_snapshot','billing_model_snapshot','billing_term_id_snapshot','hourly_rate_minor_snapshot','currency_code_snapshot','rounding_mode_snapshot','rounding_increment_minutes_snapshot','raw_duration_seconds','rounded_duration_seconds','calculated_amount_minor','created_at','updated_at'],
} as const satisfies Record<(typeof NATIVE_SHARED_FILES)[number], readonly string[]>;

export const manifestFileSchema = z.object({
  name: z.enum(NATIVE_SHARED_FILES),
  rowCount: z.number().int().nonnegative(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
});

export const nativeManifestSchema = z.object({
  format: z.literal(NATIVE_EXPORT_FORMAT),
  schemaVersion: z.literal(NATIVE_EXPORT_SCHEMA_VERSION),
  exportId: z.string().uuid(),
  appVersion: z.string().min(1),
  exportedAt: z.string().datetime({ offset: true }),
  workerId: z.string().uuid(),
  files: z.array(manifestFileSchema).length(NATIVE_SHARED_FILES.length),
}).superRefine((manifest, context) => {
  const names = new Set(manifest.files.map((file) => file.name));
  for (const required of NATIVE_SHARED_FILES) {
    if (!names.has(required)) context.addIssue({ code: 'custom', path: ['files'], message: `Missing ${required}` });
  }
  if (names.size !== manifest.files.length) context.addIssue({ code: 'custom', path: ['files'], message: 'Duplicate native export file entry' });
});

export type NativeManifest = z.infer<typeof nativeManifestSchema>;

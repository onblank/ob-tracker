-- Local-only singleton table. Not part of .obtracker exports.
CREATE TABLE app_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  language TEXT NOT NULL DEFAULT 'system',
  default_currency_code TEXT NOT NULL DEFAULT 'EUR' CHECK (length(default_currency_code) = 3 AND default_currency_code = upper(default_currency_code)),
  default_work_type TEXT NOT NULL DEFAULT 'billable' REFERENCES ref_work_types(value) ON UPDATE RESTRICT ON DELETE RESTRICT,
  default_billing_model TEXT NOT NULL DEFAULT 'hourly' CHECK (default_billing_model IN ('none', 'hourly')),
  default_hourly_rate_minor INTEGER NULL CHECK (default_hourly_rate_minor IS NULL OR default_hourly_rate_minor >= 0),

  auto_stop_enabled INTEGER NOT NULL DEFAULT 1 CHECK (auto_stop_enabled IN (0, 1)),
  auto_stop_seconds INTEGER NOT NULL DEFAULT 86400 CHECK (auto_stop_seconds > 0),
  idle_detection_enabled INTEGER NOT NULL DEFAULT 1 CHECK (idle_detection_enabled IN (0, 1)),
  idle_threshold_seconds INTEGER NOT NULL DEFAULT 7200 CHECK (idle_threshold_seconds > 0),

  rounding_mode TEXT NOT NULL DEFAULT 'none' REFERENCES ref_rounding_modes(value) ON UPDATE RESTRICT ON DELETE RESTRICT,
  rounding_increment_minutes INTEGER NOT NULL DEFAULT 1 CHECK (rounding_increment_minutes IN (1, 5, 6, 10, 15, 30, 60)),

  first_day_of_week TEXT NOT NULL DEFAULT 'monday' CHECK (first_day_of_week IN ('system', 'monday', 'sunday')),
  time_format TEXT NOT NULL DEFAULT 'system' CHECK (time_format IN ('system', '12h', '24h')),
  date_format TEXT NOT NULL DEFAULT 'system' CHECK (date_format IN ('system', 'DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD')),
  theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('system', 'light', 'dark')),

  backup_reminder_days INTEGER NOT NULL DEFAULT 7 CHECK (backup_reminder_days > 0),
  backup_retention_count INTEGER NOT NULL DEFAULT 5 CHECK (backup_retention_count > 0),
  backup_directory TEXT NULL,
  backup_reminder_snoozed_until TEXT NULL,

  global_shortcut TEXT NULL DEFAULT 'CommandOrControl+Shift+T',
  minimize_to_tray INTEGER NOT NULL DEFAULT 1 CHECK (minimize_to_tray IN (0, 1))
) STRICT;

INSERT INTO app_settings(id) VALUES (1);

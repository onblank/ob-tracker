# OB-Tracker Domain Rules v1

## Worker

One local installation represents one worker. Worker has display name and optional company name. There is no local account/authentication model.

## Hierarchy

`Client → Project → Task`.

Project requires Client. Task requires Project. A time entry requires Project and may omit Task. Client-only tracking is invalid.

## Status

Project and Task independently use `not_started`, `in_progress`, `completed`.

Creation defaults to `not_started`. First valid tracking moves applicable `not_started` Task/Project to `in_progress`. Completion is always explicit. Tracking completed work requires explicit reopen to `in_progress`.

## Work type

`billable`, `non_billable`, `learning`.

Resolution: `Task override > Project override > Client`.

Work type determines whether billing components count as billable value. Non-billable/learning activity produces zero time-derived billable amount.

## Billing

Billing model is independent of work type: `none`, `hourly`, `fixed`.

Effective term: `Task > Project > Client > none`.

Client may define `none`/`hourly`, never fixed. Project/Task may define fixed.

Fixed Project value is base contract scope. Explicit child billing is additional scope; inherited child work is already included. Fixed `0` is an explicit zero extra, not inheritance.

OB-Tracker reports tracked/billable/contract values, not accounting revenue recognition.

## Time

Persist full instants, not “date + clock time”. Entries may cross midnight/month/year boundaries.

One active timer maximum. Overlaps are forbidden. Touching intervals are allowed.

Starting another timer while one is active offers:
1. stop current and start requested;
2. cancel.

## Manual entries

Allowed, but reject:
- zero/negative duration;
- future start/end;
- end <= start;
- overlaps;
- duration beyond configured auto-stop maximum.

## Auto-stop and recovery

Default 24h. The active timer is persisted immediately. On app/PC restart, elapsed time is evaluated from persisted timestamps. If limit was exceeded, close at exactly `started_at + limit`, not restart time.

## Clock changes

While running, compare wall time with monotonic elapsed time. Material manual clock drift closes at last trusted time with `clock_change`. Timezone changes alone do not count. After a full shutdown, tamper detection is best effort because the product intentionally has no trusted remote clock.

## Idle

Enabled by default at 120 minutes. Never silently remove idle time. User chooses whether to keep, stop at idle start, or remove the gap and continue. Removing a gap creates separate contiguous entries. Auto-stop takes precedence.

## Rounding

Raw duration is immutable factual time. Billing rounding is a derived/snapshotted billing duration with modes `none`, `nearest`, `up`, `down` and increments `1/5/6/10/15/30/60` minutes.

## Historical integrity

Closed entries snapshot effective billing/work/rounding data. Later rate/configuration changes never rewrite historical values.

Fixed values are historical billing terms, not copied onto every time entry.

## Archive

Archived Client/Project/Task remains historically resolvable but cannot start new tracking until explicitly restored.

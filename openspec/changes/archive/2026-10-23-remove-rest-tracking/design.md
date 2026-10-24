# Design

## Context

Roast batches store `restStartTime`; `BatchStatus` includes `resting`; bagging checks elapsed time against a 24-hour minimum. The repository also fills missing rest starts during initialization. Dashboard activity and batch history add rest events from that field. See proposal.md for the motivation.

## Goals / Non-Goals

**Goals:**

- Let any roast with remaining roasted weight be packed immediately.
- Remove rest timestamps, countdowns, statuses, and activity/history events from the app.
- Continue accepting old local data and backup files without presenting their rest values.
- Preserve roast dates, bagging dates, sale dates, and existing purpose-pool behavior.

**Non-Goals:**

- Enforcing or recording a physical resting practice outside the app.
- Changing roast-date ordering, bagging weights, packaging choices, or sale rules.
- Changing the IndexedDB schema version or adding a dependency.

## Decisions

1. **Remove rest start from the active batch model.** New roast records do not store `restStartTime`; remove `markRested`, `startRest`, `restTiming`, and the 24-hour constant. A batch with remaining weight is immediately `ready-to-bag`; a batch with none is `bagged`.
   - Alternative: keep a hidden rest timestamp and disable only the UI. Rejected because it would continue persisting and deriving rest information despite no longer needing to track it.

2. **Normalize existing local records at startup.** The repository already performs a startup batch normalization. Extend that path to rewrite old batches without `restStartTime` and normalize legacy `resting`/`roasted` statuses to the current derived ready-to-bag or bagged status. No database version bump or index change is needed.
   - Alternative: leave stale timestamps in local rows and merely stop displaying them. Rejected because rest would still be persisted and future code could accidentally use it.

3. **Accept legacy backups but discard the rest field.** Backup parsing ignores `restStartTime` and normalizes old statuses; newly exported data contains no rest field. Keep the existing backup format version because old files remain readable and no required collection changes.
   - Alternative: reject older backups or bump the version. Rejected because the obsolete field can be safely ignored without losing roast, bagging, or sale history.

4. **Remove rest from activity and timeline ordering.** Activity kinds and history events no longer include `rested`; history orders the remaining receipt, roast, bagging, and sale events. Dashboard copy describes roasted, bagged, and sold activity.
   - Alternative: retain a synthetic rest event using roast date. Rejected because it would suggest a recorded rest stage that the operator no longer tracks.

5. **Keep bagging creation time.** `createdAt` remains the timestamp for bagging history and audit grouping. It is not a rest measurement and still identifies when packages were recorded.

## Risks / Trade-offs

- [Old local records and backups contain rest fields or `resting` status] → Normalize local batches once during startup and discard the fields while parsing backups.
- [A rollback expects rest data] → Existing rest values are intentionally not preserved by the normalization; rollback can use the roast date as the former behavior did.
- [Removing rest UI could leave stale copy or icons] → Update activity labels, status labels, pack form, dashboard, history, and tests in the same change.

## Migration Plan

On startup, detect legacy batch rows containing `restStartTime` or a rest-only status and rewrite them without rest data, setting status from remaining roasted weight. Backup import applies the same normalization. New exports do not contain rest fields. There is no IndexedDB version bump. Rollback restores the older behavior, which can derive the old rest start from the roast date.

# Design

## Context

`downloadBackup` in the dashboard writes lots, profiles, batches, bags, sales, and settings, plus `exportedAt`, then downloads `coffee-backup-YYYY-MM-DD.json`. `saveState` already replaces every IndexedDB table. There is no import and no format version. See proposal.md for why.

## Goals / Non-Goals

**Goals:**

- One backup document that export writes and import reads.
- Replace local data only after confirmation, through the existing save path.

**Non-Goals:**

- Merging two inventories, cloud sync, or partial restore.
- Changing roast, stock, or sale rules.

## Decisions

1. **Add `formatVersion: 1` to the export.** Keep the current collections and `exportedAt`. Import accepts version 1, or a missing version when the six collections are present, so files already downloaded still restore.
   - Alternative: reject files without a version. Rejected because the current export would not move.

2. **Validate before writing.** Parse JSON, require arrays for lots, profiles, batches, bags, and sales, and an object for settings. Reject negative weights and sales that reference missing bag ids. On failure, do not call `saveState`.
   - Alternative: write first and roll back on error. Rejected because a failed write can leave a cleared database.

3. **Confirm, then replace.** The import control is a file input. After a valid parse, ask the operator to confirm replacement. Confirmation calls `saveState` with the parsed state. Cancel does nothing.
   - Alternative: merge by id. Rejected because the same ids on two machines would collide, and restore means the file is the whole database.

4. **Put export and import on Settings, and keep the dashboard export.** Both downloads use the same builder. Import lives on Settings, next to a second export, so a restore is not hidden on the dashboard only.
   - Alternative: import only on the dashboard. Rejected because Settings is where the operator looks to move a machine.

## Risks / Trade-offs

- [A confirmed import wipes the current browser] → The confirm step names that replacement. There is no undo except another backup.
- [A file from a newer app has unknown fields] → Ignore unknown fields. Reject only a higher `formatVersion` than this app understands.
- [Validation misses a broken reference] → Check bag ids on sales and batch ids on bags before save. Do not try to repair them.

## Migration Plan

No schema change. New exports add `formatVersion`. Old exports still import. Rollback is removing the import control; downloaded files remain readable JSON.

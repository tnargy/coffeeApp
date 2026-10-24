# Design

## Context

`RoastBatch`, `BaggedUnit`, and `Sale` have no void marker and no update path that adjusts inventory. `applyEntityUpdate` edits a field in place, so changing a batch's roasted yield does not move the lot's green. `removeLot` and `removeProfile` are hard deletes, guarded only by "no dependents". `saveState` replaces every table at once. A bagging is stored as individual bag rows sharing a `batchId` and `createdAt`; the history trail renders one "Bagging" event per such group. See proposal.md for why.

## Goals / Non-Goals

**Goals:**

- Mark records void instead of deleting them, and keep a durable change log.
- Make every derived figure skip voided records.
- Give the operator one place to find a record and correct it.

**Non-Goals:**

- Undo, re-void, or restoring a voided record. A voided record is corrected by recording the right one.
- Merging or splitting a bagging. Change the count by voiding and packing again.
- Changing how roasts, rest, bagging, and sales are recorded.

## Decisions

1. **Void markers on the records, plus a new `audit` table.** Add optional `voidedAt` and `voidReason` to `RoastBatch`, `BaggedUnit`, and `Sale`. Add an `AuditEntry` table holding `id`, `at`, `entity`, `entityKey`, `action`, `note`, and a list of `field`/`from`/`to` changes. Dexie version 2 adds the table; existing rows are untouched.
   - Alternative: a separate `voids` table. Rejected because a void marker travels with the record, so a list of records can be filtered without a join.

2. **A bagging is keyed by `batchId` and `createdAt`.** `entityKey` is `batch:<id>`, `bagging:<batchId>:<createdAt>`, or `sale:<id>`. A bagging edit applies to every bag in that group.
   - Alternative: treat each bag separately. Rejected because the trail and the operator both think in pack actions.

3. **One set of domain functions, used by every path.** `editRecord(state, target, changes, note)` and `voidRecord(state, target, note)` return a `DomainResult`. They validate the note, apply the change, adjust the affected inventory, and append the audit entry. The UI only calls these.
   - Alternative: reuse `applyEntityUpdate` and add the audit separately. Rejected because `applyEntityUpdate` does not adjust the lot or the batch, so a corrected weight would leave the books wrong.

4. **Inventory is adjusted at the moment of the change.** Editing a roast's green weight charged moves the difference in the lot's remaining green; editing its roasted yield moves the batch's roasted remaining. Voiding a sale returns its bags to available. Voiding a bagging returns its weight to the batch. Voiding a roast returns its green to the lot. A voided record is skipped by `roastedRemaining`, `bagsReadyCount`, `pnl`, `roastedUse`, and `personalCharged`.
   - Alternative: recompute every figure from raw events on each read. Rejected because the current model stores balances, not events.

5. **Void children first, and refuse with a name.** Voiding a bagging whose bag is sold is refused naming the sale. Voiding a roast with a live bagging is refused naming the bagging. Each refusal returns a message, not a silent no-op.
   - Alternative: cascade the void. Rejected because it would undo several records in one step with a single note.

6. **A new Records page lists everything.** It lists roasts, baggings, and sales, marks voided ones, and offers edit and void. The change log sits on the same page. The existing History trail and dashboard lists show voided records with a void marker so nothing disappears silently.
   - Alternative: put edit and void in the History trail. Rejected because the trail is per lot or batch and has no list of sales.

## Risks / Trade-offs

- [Editing a roast after it has been bagged can make the bagged weight exceed the batch] → Reject an edit that would push a batch's roasted remaining below the weight already packed.
- [Void markers are not enforced at the type level] → Centralize in the two domain functions so no caller edits a record directly.
- [The change log grows forever] → One entry per edit or void. This app is single-user, so volume is low.
- [An edit changes history that a sale was priced against] → The change log shows the old value, so the sale can be voided and re-recorded if needed.

## Migration Plan

Dexie version 2 adds the `audit` table and leaves existing rows alone. Records without `voidedAt` are live. Rollback is dropping the Records page and the new table; the void markers are ignored by old code because they are optional fields. Do not rewrite existing records.

# Design

## Context

See proposal.md for motivation. Observed current state:

- `packBags` (`src/domain/rules.ts`) takes one `batchId`, checks `bagCount x weightPerBag` against that batch's remaining weight, and creates bags with `batchId` set. Weight comes from the opposite-purpose pool first, then the chosen pool.
- A bagging is not its own record. It is the set of bags sharing `(batchId, createdAt)`. `baggingKey`, `editBagging`, `voidBagging`, the Records page grouping, and the audit log all depend on that pair.
- Many reads assume `bag.batchId` is the only source: `liveBags`/`livePackedWeight`, `voidBatch`, `personalCharged`, `costOfBag`, `saleSources`, `batchTrail`, `dashboardSummary`, and `recentActivity`.
- Backups validate that every bag's `batchId` exists (`src/backup.ts`). The format version is 1.

## Goals / Non-Goals

**Goals:**
- One pack can draw from several batches in the order selected, with exact per-bag, per-batch traceability.
- Existing single-batch data and behavior are unchanged, with no data migration.
- Cost, trail, void, and roast-void stay correct for combined bags.

**Non-Goals:**
- Choosing per-batch grams by hand. The draw is automatic (confirmed with the operator).
- Naming or labeling blends, or mixing purposes or bag sizes within one pack.
- Editing weight per bag on a combined bagging.
- Changing the roast, sale, or green-lot models.

## Decisions

**1. Record sources on each bag.** Add an optional `sources: { batchId: number; weight: number }[]` to `BaggedUnit`. When absent, a helper `bagSources(bag)` returns `[{ batchId: bag.batchId, weight: bag.weight }]`. Single-batch packs and old data therefore need no migration, and every reader goes through the helper.
- Alternative: a separate `bagSources` table. Rejected: another store, another backup section, and a Dexie schema bump for data that is always read with its bag.
- Alternative: split a straddling bag into two bags. Rejected: changes bag count and what is sold.

**2. `batchId` is the bagging's anchor.** For a combined pack, every bag's `batchId` is the first batch that supplied weight (the first selected). `(batchId, createdAt)` therefore still identifies the whole bagging, so `baggingKey`, Records grouping, audit entries, and `RecordTarget` keep working. `sources` is the authority for weights and tracing. A bag wholly from batch B still has the anchor A as `batchId`, which is why no reader may use `batchId` alone to find a batch's bags.
- Alternative: a `packId` on each bag. Rejected: new identity concept, changes the audit key format, and needs a migration for old bags.

**3. Replace `bag.batchId === id` lookups with a source-based helper.** Add `bagsFromBatch(state, batchId)` (any bag whose sources include the batch) and `weightFromBatch(bag, batchId)`. Use them in `liveBags`, `livePackedWeight`, `voidBatch`, `personalCharged`, `batchTrail`, and `dashboardSummary`. `voidBatch` then refuses when any live bag has a source in that batch and names that bagging.

**4. Draw algorithm.** Input becomes `batchIds: number[]` (ordered). `batchId` stays accepted as shorthand for a one-element list so existing callers and tests keep working. Validate: non-empty, no duplicates, each batch exists, is not void, and has weight remaining; bag count and weight rules unchanged. Total = `roundGrams(weightPerBag x bagCount)`. If the sum of remaining weight is less than the total, return `shortfall('roasted', ...)`. Otherwise walk the batches in order, taking `min(remaining, still needed)` from each, and apply the existing opposite-pool-first rule per batch. Then slice the ordered draw into bags of `weightPerBag`, giving each bag its per-batch parts. The last part of each bag absorbs rounding so a bag's sources sum exactly to its weight. Batches that supply nothing are not recorded as sources and are untouched.

**5. Void and edit.** `voidBagging` restores each source batch's share into the pool matching the bag's stored purpose, as today. Its group lookup stays `(batchId anchor, createdAt)`. `editBagging` bag size is unchanged. For weight per bag, a group is "combined" if any bag has more than one source batch or a source other than its anchor; that case returns a validation error telling the operator to void and pack again. Reallocating across batches on edit would need a re-draw and is out of scope.

**6. Cost.** `costOfBag` sums, over sources, `source.weight x (batch.greenWeightCharged / batch.roastedYield) x (lot.totalCost / lot.weightReceived)`. For a single source this equals the current formula. `saleSources` returns one entry per bag with the list of source batches and lots.

**7. UI.** `PackBags` replaces the single batch select with an ordered selection: tapping a batch adds it to a "Use these batches, in order" list; entries can be removed or moved up or down. A live preview shows total needed, total available in the selection, grams to be drawn from each batch, and a shortfall warning. The submit button stays disabled while the selection is empty or short. The existing batch list stays and doubles as the picker. Records shows a combined bagging once, labeled with its batches (`Bagging from Batch #1, #2`). RecordSale shows each bag's source batches. The history trail for a batch shows the grams this batch supplied.

**8. Backup.** Bump `BACKUP_FORMAT_VERSION` to 2. An older app then refuses the file instead of silently dropping `sources` and mis-tracing bags. The importer accepts versions 1 and 2. For any bag with `sources`, validate that every `batchId` exists, no weight is negative, and the weights sum to the bag weight (within rounding). The existing check that `bag.batchId` exists still applies. Missing `sources` stays valid.

## Risks / Trade-offs

- **A missed reader still assumes one batch** -> Mitigation: grep every `.batchId` use; route reads through the helpers; tests for roast-void, cost, trail, and dashboard with a bag whose only link to a batch is a later source.
- **Anchor `batchId` can mislead future code** -> Mitigation: document the invariant on the type, and keep the helpers the only way to ask "which bags came from this batch".
- **Weight edit on combined baggings is blocked** -> Mitigation: clear error message; void and re-pack is available. Revisit only if it proves annoying.
- **Rounding** -> Mitigation: draw in grams rounded with `roundGrams`; final part absorbs remainder; a test asserts every bag's sources sum to its weight.
- **Older app versions refuse v2 backups** -> Accepted. It protects traceability.

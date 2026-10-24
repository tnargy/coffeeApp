# Proposal

## Why

Packing today draws from exactly one roast batch. When no single batch has enough beans left for the bags the operator wants to fill, they must pack a short run from each batch separately, and the last bag from each batch ends up under-filled or skipped. The operator needs to combine several batches in one pack so the bags get filled and no beans are stranded.

## What Changes

- The Pack bags page lets the operator select more than one batch for a single pack, in order.
- The system takes the pack's total weight (bags x weight per bag) from the selected batches automatically, draining each in the order selected until the total is met. The last batch used may be only partly drained.
- A bag that straddles the boundary between two batches is allowed. Each bag records exactly how many grams came from which batch, so every bag stays traceable to its source batches.
- The pack is rejected, with nothing changed, if the selected batches together do not hold enough roasted weight. The shortfall is reported.
- The per-batch purpose-pool rule still applies to each batch drawn from: the opposite-purpose pool is used first, then the chosen-purpose pool.
- Voiding a combined bagging returns each source batch's share to that batch. Voiding a roast is refused while any live bag draws from it.
- Cost of goods, history trails, and the dashboard trail use each bag's per-batch split instead of assuming one batch.
- Editing weight per bag on a combined bagging is not supported in this change. The operator voids it and packs again. Bag size can still be edited.
- Single-batch packing behaves exactly as before. Existing bags and backups without a split are treated as drawn entirely from their one batch.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `resting-and-packaging`: add a requirement for packing from several batches in one pack, the automatic draw order, per-bag source traceability, and the shortfall rejection.
- `corrections`: add a requirement for how void, edit, and roast-void behave when a bagging draws from more than one batch.
- `sales`: add a requirement that cost basis for a bag is computed from each source batch's share.

## Impact

- `src/types.ts`: new optional per-bag source list on `BaggedUnit`.
- `src/domain/rules.ts`: `packBags` input and logic, `voidBagging`, `editBagging`, `voidBatch`, `costOfBag`, `livePackedWeight` and `liveBags`, `personalCharged`, `batchTrail`, `recentActivity`, `dashboardSummary`, `saleSources`.
- `src/pages/PackBags.tsx`: multi-batch selection UI and a preview of the draw.
- `src/pages/Records.tsx`, `src/pages/RecordSale.tsx`: label combined baggings and bags with their batches.
- `src/backup.ts`: validate and accept the new optional field; old backups still import.
- `src/db.ts`: no schema index change expected (the field is not indexed).
- Tests in `src/domain/rules.test.ts` and `src/backup.test.ts`.
- No new dependencies.

## Assumptions

- "Combine batches" means pooling roasted beans from several batches into one pack, not producing a labelled blend product.
- Only batches with roasted weight remaining and not voided can be selected.
- One pack has a single purpose (personal or for sale) and a single bag size and bag weight, as today.

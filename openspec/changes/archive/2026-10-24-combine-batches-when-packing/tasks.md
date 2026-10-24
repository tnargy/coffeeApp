# Tasks

## 1. Bag sources in the data model

- [x] 1.1 Add optional `sources: { batchId: number; weight: number }[]` to `BaggedUnit` in `src/types.ts`, with a comment that `batchId` is the bagging's anchor. Verify: `npm run typecheck` passes.
- [x] 1.2 In `src/domain/rules.ts`, add `bagSources(bag)`, `bagsFromBatch(state, batchId)`, and `weightFromBatch(bag, batchId)`. Missing `sources` yields one source of the full weight from `bag.batchId`. Verify: unit tests for a legacy bag and a two-source bag in `src/domain/rules.test.ts`.
- [x] 1.3 Switch `liveBags`, `livePackedWeight`, `personalCharged`, and `voidBatch` to the helpers. `voidBatch` must refuse while any live bag has a source in the batch and name that bagging. Verify: tests that a batch used only as a later source cannot be voided, and that `editBatch` roasted-yield checks count that batch's share. Existing tests still pass with `npm test`.

## 2. Combined packing

- [x] 2.1 Extend `PackBagsInput` with ordered `batchIds`, keeping `batchId` as shorthand for one batch. Validate empty, duplicate, missing, void, and zero-remaining batches. Verify: tests for each rejection leave state unchanged.
- [x] 2.2 Implement the draw in `packBags`: drain batches in order, apply the opposite-pool-first rule per batch, slice the draw into bags with per-bag `sources` that sum exactly to the bag weight, set each bag's `batchId` to the first supplying batch, and untouched batches stay unchanged. Verify: tests for the spec scenarios (A then B fills bags, first batch covers the pack, order matters, straddling bag has two sources, personal pack across for-sale batches).
- [x] 2.3 Reject when selected batches hold less than the total using `shortfall('roasted', ...)`. Verify: test reports a 200 g shortfall and leaves batches and bags unchanged.
- [x] 2.4 Confirm single-batch packing is unchanged. Verify: all existing `packBags` tests pass untouched.

## 3. Void, edit, and cost

- [x] 3.1 Update `voidBagging` to return each source batch's share to the pool matching the bag's purpose, via the bag's sources. Verify: test voiding a two-batch bagging restores both batches and the audit entry is recorded once.
- [x] 3.2 Update `editBagging`: allow bag size on a combined bagging, and refuse weight per bag on one with a message to void and pack again. Verify: tests for both outcomes; single-batch edits unchanged.
- [x] 3.3 Update `costOfBag` to sum cost across sources, and `saleSources` to return each bag's source batches and lots. Verify: test a bag of 100 g from each of two lots at different costs, and that P&L cost of goods uses the sum.

## 4. Trails, dashboard, and backup

- [x] 4.1 Update `batchTrail`, `recentActivity`, and `dashboardSummary` to find bags through sources. The batch trail shows the grams this batch supplied. Verify: tests that a later-source batch shows the bagging in its trail and counts in the dashboard trail, and that a combined bagging appears once in recent activity.
- [x] 4.2 In `src/backup.ts`, bump `BACKUP_FORMAT_VERSION` to 2, still accept version 1, and validate each bag's `sources` (existing batches, no negatives, weights sum to the bag weight). Verify: tests in `src/backup.test.ts` for a v1 file without sources, a valid v2 file with sources, and rejected files (missing batch, bad sum, negative weight); round-trip export then import keeps sources.

## 5. User interface

- [x] 5.1 Rework `src/pages/PackBags.tsx` to an ordered batch selection (add, remove, move up/down) with a live preview of needed grams, available grams, per-batch draw, and a shortfall warning. Submit calls `packBatch` with `batchIds`; the button is disabled while the selection is empty or short. Verify: `npm run typecheck` and `npm run lint` pass; in the dev server, pack one batch and then a two-batch pack and see both succeed, and a short selection is blocked.
- [x] 5.2 In `src/pages/Records.tsx`, label combined baggings with all source batches and their grams, list them once, and hide the weight-per-bag edit for combined baggings with an explanation. In `src/pages/RecordSale.tsx`, show each bag's source batches. Verify: in the dev server, a combined bagging shows once, voids cleanly, and a combined bag is selectable in a sale.
- [x] 5.3 Final check across the change. Verify: `npm test`, `npm run lint`, and `npm run build` all pass.

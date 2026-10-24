# Design

## Context

Green lots have no reserve field. `personalUseReserveTargetGrams` is a single settings value, about 1 lb, and the dashboard compares all green on hand to it. Roasted stock is one total. Batch classification (`internal` or `for-sale`) is already stored and shown only in secondary lists. See proposal.md for why.

## Goals / Non-Goals

**Goals:**

- Store an adjustable reserve on each lot and derive allotment, coverage, and fair-to-sell from that plus existing roast classifications.
- Show the split on the current dashboard and set the reserve when a lot is received or from the lot list.

**Non-Goals:**

- A calendar-month window, a second reserve target, or auto-classifying roasts.
- Blocking a roast or a sale when the allotment is open.
- Changing bag, rest, or sale math.

## Decisions

1. **Add `personalReserveGrams` on the lot.** Omit it on lots already stored; treat a missing value as 0. New receipts write an explicit number. No new IndexedDB index.
   - Alternative: keep only the settings target. Rejected because a new lot would not change the allotment and the operator could not set a reserve per lot.

2. **Default a blank receive field to `min(settings target, weight received)`.** The receive form shows that default and accepts an override, including 0. Later edits use the same cap: reserve must be from 0 through weight received.
   - Alternative: default every new lot to 0. Rejected because the operator's allotment is about 1 lb unless they say otherwise.

3. **Derive coverage; do not store it.** For each lot, personal charged is the sum of `greenWeightCharged` on `internal` batches of that lot. Unmet reserve is `max(0, reserve - personal charged)`. Fair green is `max(0, weight remaining - unmet)`. A lot is covered when unmet is 0. Fair-to-sell roasted weight is `roastedWeightRemaining` on `for-sale` batches of covered lots only. Personal roasted weight is `roastedWeightRemaining` on `internal` batches and is never fair to sell.
   - Alternative: count roasted yield toward the allotment. Rejected because the reserve is a green amount taken from the lot.

4. **Replace the green-on-hand alert with the allotment status.** The rail shows total allotment, how much is covered, and which lots are fair to sell. Lot rows show reserve, unmet amount, and fair green. Roasted stat shows personal use and for sale, and marks for-sale roasted fair only when its lot is covered.
   - Alternative: keep the monthly green warning beside the new status. Rejected because the two signals contradict.

## Risks / Trade-offs

- [A for-sale roast before the allotment is covered is not marked fair to sell] → Show it as for sale, and show the unmet reserve, so the operator can see why it is not cleared.
- [Raising a reserve above remaining green plus what was already charged] → Allow it up to weight received. Unmet can then exceed weight remaining; fair green is 0 until more personal green is charged or the reserve is lowered.
- [Existing lots become fully fair to sell] → Missing reserve is 0. The operator sets a reserve if they still want one.

## Migration Plan

No schema version bump. On read, missing `personalReserveGrams` is 0. Rollback is ignoring the field and restoring the old alert. Do not rewrite stored batches.

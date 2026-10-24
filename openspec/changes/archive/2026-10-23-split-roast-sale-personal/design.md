# Design

## Context

A roast stores one `classification` and one `roastedWeightRemaining`. Bags have no purpose. `personalCharged` sums `greenWeightCharged` on internal roasts. `roastedUse` puts each roast's remaining weight in one bucket. Packing and sales do not reclassify. See proposal.md for why.

IndexedDB indexes batches by lot, profile, date, and status, and bags by batch, status, and time. Purpose is not indexed. Grams are rounded to thousandths in `roundGrams`.

## Goals / Non-Goals

**Goals:**

- Keep one roast record and derive personal and for-sale weight from pools, including roasts already stored.
- Let logging set the yield split and packing choose a bag purpose, including taking a shortfall from the other pool.
- Count personal green from current personal roasted weight, loose or bagged, and keep personal bags out of sales and bags ready.

**Non-Goals:**

- A second roast record, a bag split, or a purpose edit on a live bag.
- Auto-classifying from the lot reserve, or changing rest start, green receipt, or reserve editing.
- A schema version bump.

## Decisions

1. **Store pools on the roast and purpose on the bag.** Add `personalYield`, `forSaleYield`, `personalRemaining`, and `forSaleRemaining`. They are the source of truth when present. `roastedYield` and `roastedWeightRemaining` stay the sums. Add `classification` on the bag. Keep the roast `classification` field so old reads still typecheck, but stock, allotment, labels, and sales MUST use the pools and bag purpose.
   - Alternative: two sibling batches. Rejected because rest, void, and history are per roast, and the operator asked for one batch.
   - Alternative: purpose only on bags. Rejected because an unpacked split has to show before packing.

2. **Derive missing pools. Do not rewrite stored rows on open.** A missing pair means the roast is still one purpose: internal puts yield and remaining in personal, for sale puts them in for sale. A bag with no purpose uses its roast's single purpose. Import materializes those values so a restored file is explicit. New writes always store the fields.
   - Alternative: a migration that rewrites every roast. Rejected because a missing field already has one meaning and IndexedDB needs no new index.

3. **Logging sets both pools. The default personal amount is 0.** Personal is rounded, then for sale is the yield minus that amount, adjusted so the two pools equal the stored yield. A personal amount outside 0 through yield is rejected. Green charged stays one number.
   - Alternative: two green charges. Rejected because the operator charges the roaster once.

4. **Packing chooses a purpose and may reclassify across pools.** Deduct the pack from the opposite-purpose remaining pool first, then the chosen-purpose pool. Every bag in that pack stores the chosen purpose. Do not change the logged yield split. This preserves already allocated personal weight while adding a personal pack to the allotment. Reject only when the pack exceeds total remaining, or rest is unfinished.
   - Alternative: deduct from the chosen pool first. Rejected because it can consume existing personal weight without increasing the personal share when the operator is packing for personal use to cover the lot allotment.

5. **Allotment uses current personal roasted weight, not the logged yield split.** For each live roast, personal roasted weight is personal remaining plus the weight of its live personal bags. Green share is `greenWeightCharged * personalRoasted / roastedYield`, or 0 when yield is 0. Fair-to-sell roasted weight is for-sale remaining on covered lots only.
   - Alternative: count only `personalYield`. Rejected because packing personal bags from a for-sale remainder would not cover the reserve.

6. **Corrections move unpacked weight only.** The roast edit replaces the whole-classification swap with an unpacked personal amount. The other unpacked pool is the remainder. Packed bags keep their purpose. Voiding a bagging adds its weight back to the unpacked pool of the purpose on those bags. A yield edit keeps the pools equal to the new totals by applying the unpacked delta to for sale first, then personal, and still cannot drop below weight already packed.
   - Alternative: reclassify packed bags from the roast edit. Rejected because a sold bag must not change purpose under a roast correction.

7. **Sales and bags ready read bag purpose.** The sale list and `recordSale` exclude personal bags. Bags ready counts available, non-void, for-sale bags only.

## Risks / Trade-offs

- [A screen still reads roast `classification` and treats a mixed roast as for sale] → Stock, sale, label, and history paths go through pool helpers. A mixed roast's stored classification is not displayed as the split.
- [Rounding leaves the pools off the yield by a thousandth] → After rounding the personal amount, set for sale so the two pools equal the stored total.
- [Voiding a personal pack returns weight to personal even if that weight was taken from for sale] → That matches the bag purpose. The operator moves unpacked weight if the purpose was wrong.
- [An old backup has no bag purpose] → Import copies the parent roast's single purpose. It does not invent a split.

## Migration Plan

No schema version bump. On read, missing pool fields mean a single purpose. Import writes the derived fields. Rollback is ignoring the new fields and treating each roast by `classification` again. Do not rewrite roasts that already have pools.

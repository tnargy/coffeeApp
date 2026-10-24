# Tasks

## 1. Pools

- [x] 1.1 Add optional `personalYield`, `forSaleYield`, `personalRemaining`, and `forSaleRemaining` on a roast, and optional `classification` on a bag. Add a helper that fills a missing pair from the roast classification, and a bag purpose that uses the parent roast when the bag has none. Verify a roast object without the new fields still typechecks and `npm run typecheck` passes.
- [x] 1.2 Make new roast writes store both pools equal to the yield and remaining, and make the two pools sum to those totals after rounding. Verify `npm run typecheck` passes.

## 2. Log a split

- [x] 2.1 Accept a personal amount on log, defaulting to 0, and reject an amount below 0 or above the roasted yield. Store one roast whose pools sum to the yield. Add tests for an all-for-sale roast, an all-personal roast, a 250 g personal / 250 g for-sale split, and a rejected amount. Verify `npm test` passes them.
- [x] 2.2 Add a personal-grams field on the log form, defaulting to 0, and show the for-sale remainder. Verify the field is on the log form and `npm run typecheck` passes.

## 3. Allotment and roasted stock

- [x] 3.1 Count personal charged as green charged times personal remaining plus live personal bag weight, divided by roasted yield. A zero yield contributes nothing. Add a test that a 600 g charge and 500 g yield with 250 g personal counts 300 g, and that packing the other 250 g as personal counts 600 g. Verify `npm test` passes it.
- [x] 3.2 Split roasted remaining by pool, and mark only for-sale remaining fair to sell when the lot is covered. Add a test with one split roast. Verify `npm test` passes it.

## 4. Packing

- [x] 4.1 Accept a purpose on pack. Reclassify from the opposite-purpose pool first, then consume the chosen-purpose pool. Store the chosen purpose on each bag. Reject a pack over total remaining. Add tests for packing personal bags from an all-for-sale roast and for the over-remaining reject. Verify `npm test` passes them.
- [x] 4.2 Add a purpose choice on the pack form and show both remaining pools. Verify the control is on the pack form and `npm run typecheck` passes.

## 5. Sales and bags ready

- [x] 5.1 Refuse a sale that includes a personal bag, and count only available for-sale bags as bags ready. Add tests for the refusal and for a count of 1 when one personal bag and one for-sale bag are available. Verify `npm test` passes them.
- [x] 5.2 Omit personal bags from the sale form. Verify they are not listed and `npm run typecheck` passes.

## 6. Corrections

- [x] 6.1 Let a roast edit set unpacked personal weight, with the other pool as the remainder, and require a note. Do not change packed bag purpose. Add tests for the move and for a missing note. Verify `npm test` passes them.
- [x] 6.2 On void of a bagging, return its weight to the unpacked pool of the purpose on those bags. Add a test that voiding a personal bagging leaves for-sale remaining unchanged. Verify `npm test` passes it.
- [x] 6.3 Replace the roast classification swap in the records edit with the unpacked personal amount. Verify the records form no longer swaps the whole roast purpose and `npm run typecheck` passes.

## 7. Backup and labels

- [x] 7.1 On import, fill missing roast pools and bag purpose from the stored single classification, without inventing a split. Add a test that a for-sale roast with no pool fields imports as all for sale. Verify `npm test` passes it.
- [x] 7.2 Show both amounts when a roast is mixed, and show bag purpose in history and on the pack and sale lists. Verify a mixed roast is not labeled only "For sale" and `npm run typecheck` passes.

## 8. Integration

- [x] 8.1 Run `npm test`, `npm run typecheck`, and `npm run lint`. Confirm the split log, allotment share, pack-across-pools, personal-bag sale refusal, bags ready, void return, and old-backup import tests are covered.

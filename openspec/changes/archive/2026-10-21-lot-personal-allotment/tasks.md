# Tasks

## 1. Lot reserve

- [x] 1.1 Add optional `personalReserveGrams` on a green lot and treat a missing value as 0. Verify a lot object without the field still typechecks and `npm run typecheck` passes.
- [x] 1.2 On receive, store an explicit reserve: the operator's amount, or the personal-use setting capped at weight received when the amount is omitted. Add a test that a 5 lb receipt with no reserve stores 1 lb when the setting is 1 lb, and that an 8 oz override stores 8 oz. Verify `npm test` passes it.
- [x] 1.3 Reject a reserve below 0 or above weight received, and allow a later edit that does not change roast classifications. Add tests for reject, lower-to-12-oz, and unchanged classification. Verify `npm test` passes them.

## 2. Allotment math

- [x] 2.1 Derive personal charged, unmet reserve, fair green, and covered from internal `greenWeightCharged` on that lot. Add a test that roasting 1 lb internal covers a 1 lb reserve, and that 5 lb remaining with an unmet 1 lb reserve has 4 lb fair green. Verify `npm test` passes it.
- [x] 2.2 Split roasted weight remaining into personal use and for sale. Mark for-sale roasted fair to sell only when its lot is covered. Add a test with one internal batch and one for-sale batch. Verify `npm test` passes it.
- [x] 2.3 Confirm an open allotment does not block a roast or a sale. Verify the existing roast and sale success tests still pass via `npm test`.

## 3. Dashboard and receive form

- [x] 3.1 Add a reserve field on receive, prefilled with the capped setting and editable, including 0. Verify the field is on the receive form and `npm run typecheck` passes.
- [x] 3.2 Let each dashboard lot row edit its reserve, and show reserve, unmet amount, and fair green. Verify a lot row exposes those three figures and `npm run typecheck` passes.
- [x] 3.3 Replace the green-on-hand monthly alert with allotment status, and split the roasted stat into personal use and for sale, marking for-sale roasted fair only when the lot is covered. Verify the monthly on-hand warning text is gone and `npm run typecheck` passes.

## 4. Integration

- [x] 4.1 Run `npm test`, `npm run typecheck`, and `npm run lint`. Confirm receive default and override, reserve cap, allotment coverage, fair green, roasted split, and non-blocking roast or sale are covered.

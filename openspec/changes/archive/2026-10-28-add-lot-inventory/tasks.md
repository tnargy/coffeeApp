# Tasks

## 1. Depleted-lot rule

- [x] 1.1 Add `isDepletedLot` for `weightRemaining <= 0` next to the existing lot helpers, and verify a unit test treats zero and negative remaining as depleted and a positive remainder as not
- [x] 1.2 Verify existing `greenRemaining` and allotment behavior still includes a zero-remaining lot, with a unit test that a depleted lot does not change the green total and an unmet reserve on that lot is still counted

## 2. Dashboard list

- [x] 2.1 Filter only the dashboard green-inventory list with `isDepletedLot`, leaving the allotment warning and green-remaining total on every lot, and verify the list source is the filtered set while the warning sum is not
- [x] 2.2 When lots exist but all are depleted, show a note pointing at Inventory instead of "No lots yet", and verify that copy is distinct from the empty-inventory message

## 3. Inventory page

- [x] 3.1 Add a read-only `/inventory` page, not a top-nav item, and point the Green bean inventory "View all" link at it. List every lot's name, origin, received weight, and remaining weight, with a history link. Verify the route is registered, `APP_ROUTES` has no `/inventory`, the dashboard link targets `/inventory`, and a depleted lot is included in the page's lot list
- [x] 3.2 Leave History and the log-roast lot picker listing every lot, and verify neither page filters with `isDepletedLot`

## 4. Integration check

- [x] 4.1 Run `npm test`, `npm run lint`, and `npm run typecheck`, and verify all three succeed

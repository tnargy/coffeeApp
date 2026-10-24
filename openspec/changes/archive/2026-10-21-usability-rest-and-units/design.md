# Design

## Context

`recordRoast` stores `restStartTime: null`. Pack bags has a separate rest-start field and a Mark rested action, and refuses to pack until that time is 24 hours old. Receive uses `datetime-local`. `formatWeight` switches among lb, oz, and g by size, while some screens already call `formatGrams`. Amounts are stored in grams. See proposal.md for why.

## Goals / Non-Goals

**Goals:**

- Set rest start from the batch roast time, including batches already stored with a null rest start.
- Take a receipt date only, and show weights in the units in the weight-display spec.

**Non-Goals:**

- Changing the 24-hour minimum, bag-size default, or stored gram math.
- Dropping the time from roast logging. That time is the rest start.
- Converting bag fill weight to ounces. Bag size stays ounces; coffee in the bag stays grams.

## Decisions

1. **Write `restStartTime` from `roastDate` inside `recordRoast`.** Pack bags reads that field and drops the rest-start input and Mark rested button. Readiness still uses `restTiming` and 24 hours.
   - Alternative: leave rest start null and treat a missing value as roast date only in the UI. Rejected because bagging currently requires a stored rest start, and history should show one rest event.

2. **Backfill null rest starts from `roastDate` when state is loaded.** Do not invent a new time. Batches that already have a rest start stay as recorded.
   - Alternative: only new roasts rest automatically. Rejected because existing batches would still need Mark rested.

3. **Store a receipt as local midnight ISO for the chosen calendar date.** The receive control is `type="date"`. Display receipt with a date, not a time. Older receipts keep their stored instant and show the calendar date.
   - Alternative: store `YYYY-MM-DD` and special-case every date parser. Rejected because the rest of the app already uses ISO strings.

4. **Add explicit formatters instead of the size-based `formatWeight`.** `formatPounds` for received weight and the reserve setting. `formatGrams` for every other coffee weight, including unmet reserve. Bag size stays ounces. Roast, remaining, and weight-per-bag inputs stay grams. Receive weight and reserve inputs stay pounds.
   - Alternative: keep `formatWeight` and only relabel a few cards. Rejected because it still flips a 300 g roast to ounces.

## Risks / Trade-offs

- [A backdated roast is immediately past 24 hours] → That matches using the stored roast time. Bagging still shows elapsed rest.
- [Local midnight shifts the calendar date in another timezone] → This app is single-user and local. Display the stored calendar date, not a converted time.
- [1 lb minus 300 g is 153.6 g, not 154] → Show rounded grams. The spec says about 154 g.

## Migration Plan

No schema version bump. On load, copy `roastDate` into a null `restStartTime`. Rollback is ignoring that copy and restoring the mark-rest control. Do not convert stored weights.

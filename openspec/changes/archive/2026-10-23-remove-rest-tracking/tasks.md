# Tasks

## 1. Remove rest from roast state

- [x] 1.1 Remove `restStartTime` and the `resting` batch status from the active roast model. New roasts with weight remaining are ready to bag immediately; empty batches are bagged. Normalize old local batches by dropping legacy rest timestamps and deriving status from remaining weight. Add a startup migration test and verify `npm run typecheck` passes.
- [x] 1.2 Remove rest timing and manual-rest domain/repository operations, and remove the 24-hour condition from bagging. Add tests that a newly logged batch can be bagged immediately and that exhausted batches still reject further packing. Verify `npm test` passes.

## 2. Remove rest UI and activity

- [x] 2.1 Remove rest countdowns, elapsed-time messages, and rest-based submit disabling from the pack page. Show batches as ready whenever roasted weight remains. Verify the form allows immediate bagging and `npm run typecheck` passes.
- [x] 2.2 Remove rest from dashboard activity, status labels, activity icons, and batch/lot history timelines. Add or update tests to confirm history contains receipt, roast, bagging, and sale only. Verify `npm test` passes.

## 3. Preserve backup compatibility

- [x] 3.1 Ignore `restStartTime` and normalize old batch statuses when importing older backups; ensure new exports do not contain rest fields. Add a legacy backup import/export test and verify `npm test` passes.

## 4. Integration

- [x] 4.1 Run `npm test`, `npm run typecheck`, and `npm run lint`. Confirm immediate bagging, migration of stored batches, rest-free history/activity, and old-backup import are covered.

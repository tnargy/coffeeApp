# Tasks

## 1. Rest starts at roast time

- [x] 1.1 Set `restStartTime` from the roast time when a roast is recorded. Add a test that the batch rest start equals the stored roast time. Verify `npm test` passes it.
- [x] 1.2 On load, copy `roastDate` into a null `restStartTime` and leave an existing rest start unchanged. Add a test for both cases. Verify `npm test` passes it.
- [x] 1.3 Remove the pack-bags rest-start field and Mark rested action. Bagging still waits 24 hours from the roast time and shows elapsed or remaining rest. Verify the pack page has no rest-start control and the existing not-ready bagging test still passes via `npm test`.

## 2. Receipt date

- [x] 2.1 Change green receipt to a date input and store that calendar date without a time of day. Verify the receive form uses a date control and a recorded lot's receipt is that calendar date. Confirm with `npm run typecheck`.

## 3. Weight display

- [x] 3.1 Add pound and gram formatters and stop using the size-based weight switch for operator-facing amounts. Verify a 300 g value formats as grams and a 5 lb received value formats as pounds with a unit test via `npm test`.
- [x] 3.2 Show lot weight received and the reserve setting in pounds, bag size in ounces, and every other coffee weight in grams, including unmet reserve. Verify the dashboard lot row shows received in lb, reserve in lb, and unmet reserve in g, and `npm run typecheck` passes.
- [x] 3.3 Keep roast, remaining, and weight-per-bag inputs in grams, receive weight and reserve inputs in pounds, and bag size input in ounces. Verify those input labels on the receive, roast, and pack forms and `npm run typecheck` passes.

## 4. Integration

- [x] 4.1 Run `npm test`, `npm run typecheck`, and `npm run lint`. Confirm rest starts at roast time, receipt has no time, and a 1 lb reserve minus a 300 g personal roast shows about 154 g still reserved.

# Tasks

## 1. Trail data

- [x] 1.1 Add batch id and a short batch label to trail events that belong to a batch, leaving receipt-only events unlabeled. Verify `npm test` still passes the existing batch trail kind order (`received`, `roasted`, `rested`, `bagged`, `sold`).
- [x] 1.2 Make `lotTrail` emit one green receipt, then each batch in roast-date order with that batch's events in stage order and labeled with the batch. Add a test for two batches at different stages and verify `npm test` passes it.
- [x] 1.3 Keep missing stages out of the trail. Add a test that a roasted-only batch returns receipt and roast with profile, and not rest, bagging, or sale. Verify `npm test` passes it.

## 2. History timeline

- [x] 2.1 Replace the decimal history list with a vertical timeline rail, and put a static stage legend (receipt → roast → rest → bag → sale) outside the event list with no timestamps. Verify the history page no longer uses a decimal list and `npm run typecheck` passes.
- [x] 2.2 Label the timeline with the selected batch or lot and mark that row in the picker. Verify a `?batch=` or `?lot=` visit shows that subject's name in the heading and `npm run typecheck` passes.
- [x] 2.3 When history opens with no subject and a batch exists, select the latest roast in the query; if there are lots but no batches, select the latest receipt. Show the empty prompt only when neither exists. Verify `npm run typecheck` passes and the empty prompt is not the default when data exists.

## 3. Dashboard entry

- [x] 3.1 Link each green-inventory lot to `/history?lot=` for that lot. Leave existing batch links on `/history?batch=`. Verify both link targets in the dashboard page and `npm run typecheck` passes.

## 4. Integration

- [x] 4.1 Run `npm test`, `npm run typecheck`, and `npm run lint`, and confirm the four Full History Trail scenarios are covered: ordered batch timeline, lot receipt-once with batch labels, dashboard subject links, and omitted stages.

# Design

## Context

`/history` already lists lots and batches and renders `batchTrail` / `lotTrail` as a decimal list. `batchTrail` emits receipt, roast, rest, bagging, and sale, sorted by stage then time. `lotTrail` prepends one receipt and appends each batch's other events with no batch identity and no shared order. Dashboard batch links use `/history?batch=`. Both "View all" links open `/history` with no subject, so the trail pane stays empty. See proposal.md for why.

## Goals / Non-Goals

**Goals:**

- Derive the trail in the existing domain helpers and render it as a timeline on the current history page.
- Lot view: one green receipt, then each batch in roast order, each event named to its batch.
- A dashboard link, or opening history when data exists, shows a subject's timeline immediately.

**Non-Goals:**

- New stored fields, a new route, or a chart library.
- Changing roast, rest, bag, or sale recording.
- Replacing the dashboard summary lists with the full timeline.
- Drawing stages that have not happened as if they were recorded.

## Decisions

1. **Keep trail derivation in the domain helpers.** `batchTrail` remains the batch source. `lotTrail` keeps a single receipt, drops the duplicate receipt from each batch, and orders batches by roast date. Events that belong to a batch carry that batch's id and a short label. Nothing new is persisted.
   - Alternative: assemble the trail only in the page. Rejected because stage order is already a domain rule and the existing trail tests live with those helpers.

2. **Omit stages that did not happen.** No rest event without a rest start, no bagging event without bags, no sale event without a related sale. A static legend (receipt → roast → rest → bag → sale) may sit above the rail so the sequence is readable. Legend items are not events and have no timestamps.
   - Alternative: grey out missing stages on the rail. Rejected because they can be read as recorded history, which the spec forbids.

3. **Restyle the existing history page; do not add a route.** Replace the decimal list with a vertical rail. Reuse the activity icon and chip mapping already used on the dashboard. The heading names the selected batch or lot, and that row is marked in the picker. Query params stay `batch` and `lot`.
   - Alternative: a modal or a second page. Rejected because the current links already target `/history`.

4. **Do not land on an empty trail when a subject exists.** If the query has a batch or lot, show that trail. If it has neither and a batch exists, select the latest roast and put it in the query. If there are lots but no batches, select the latest receipt the same way. Green-inventory rows link to `/history?lot=`. Existing batch links stay. "View all" may still go to `/history`; the page chooses the subject.
   - Alternative: only fix the dashboard links. Rejected because an unmarked visit would still hide the trail.

## Risks / Trade-offs

- [A lot with many batches makes a long page] → Keep roast order under one receipt. No pagination in this change.
- [Auto-select rewrites the URL] → Use the same `batch` and `lot` params the links already use, so refresh stays stable.
- [The stage legend is mistaken for events] → Keep it outside the event list, with no times.
- [A caller assumed `lotTrail` append order] → No current test locks that order. Add one for receipt-once, roast order, and batch identity.

## Migration Plan

Client-only. No IndexedDB change. Ship with the app. Roll back by reverting the history page, the trail helpers, and the lot links.

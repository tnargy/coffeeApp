# Tasks

## 1. Void markers and change log storage

- [x] 1.1 Add optional `voidedAt` and `voidReason` to a roast, a bag, and a sale, and an `AuditEntry` type with entity, key, action, note, and field changes. Verify a record without the markers still typechecks and `npm run typecheck` passes.
- [x] 1.2 Add an `audit` table at Dexie version 2 and load it with the rest of the state. Add a test that existing data still loads and an audit entry round-trips. Verify `npm test` passes it.

## 2. Edit a record

- [x] 2.1 Add a domain function that edits a roast, a bagging, or a sale and refuses an edit with no note. Add a test that editing a sale amount changes it and that an edit with no note is refused and changes nothing. Verify `npm test` passes them.
- [x] 2.2 Write an audit entry for each edit with the old value, the new value, and the note. Add a test that the change log holds the entry and that an earlier edit is still there after a later one. Verify `npm test` passes it.
- [x] 2.3 Move the difference when a roast edit changes the green weight charged or the roasted yield, and reject an edit that would push the batch below the weight already packed. Add tests for the lot adjustment and the rejection. Verify `npm test` passes them.

## 3. Void a record

- [x] 3.1 Add a domain function that voids a record with a note, keeps the record, and marks it void. Add a test that the record is kept, marked, and that voiding an already void record is refused. Verify `npm test` passes it.
- [x] 3.2 Restore inventory on void: a sale returns its bags to available, a bagging returns its weight to the batch, a roast returns its green to the lot. Add a test for each. Verify `npm test` passes them.
- [x] 3.3 Refuse to void a record that still has live records under it, and name the record to void first. Add a test for a roast with a live bagging and for a bagging with a sold bag. Verify `npm test` passes them.
- [x] 3.4 Write an audit entry for each void. Add a test that the void is in the change log with its note. Verify `npm test` passes it.

## 4. Voided records leave current figures

- [x] 4.1 Exclude voided roasts, baggings, and sales from roasted weight, bags ready, sales total, P&L, roasted personal and for-sale split, and the personal allotment charged. Add a test that a voided sale leaves the sales total and P&L unchanged. Verify `npm test` passes it.
- [x] 4.2 Mark voided records in the history trail and the dashboard lists instead of hiding them. Verify a voided roast shows a void marker with its reason and `npm run typecheck` passes.

## 5. Records screen

- [x] 5.1 Add a records page listing roasts, baggings, and sales, including voided ones marked as void, with the change log. Verify the page lists each record and the log shows the entries, and `npm run typecheck` passes.
- [x] 5.2 Let the operator start an edit or a void from the records page, require the note, and show the result or the refusal message. Verify an edit with no note is refused with a message and a void that is blocked names the record to void first, and `npm run typecheck` passes.

## 6. Integration

- [x] 6.1 Run `npm test`, `npm run typecheck`, and `npm run lint`. Confirm an edit, a void, the change log, the refusal order, and the figures all behave as specified.

# Proposal

## Why

A recorded roast, bagging, or sale cannot be changed once it is saved. A typo in a weight, a roast logged against the wrong lot, or a sale booked twice has no fix, so the operator either leaves the record wrong or deletes the whole database. Once real data accumulates, corrections need to be possible without losing the record of what happened.

## What Changes

- Let the operator edit a roast, a bagging, or a sale, and void any of them.
- Every edit and void requires a note saying why, and both are written to a change log that shows when, what record, what changed, and the note.
- A void does not delete the record. The record stays, marked void with its reason, and is left out of green, roasted, bagged, sales, and P&L figures.
- Void a sale first, then its bagging, then the roast. Voiding a record that still has live records under it is refused with a message saying what to void first.
- Assumption: a bagging is the group of bags packed in one action, matching the "Bagging" step in the history trail. Editing a bagging changes the weight and size of those bags, not how many there are. To change the count, void the bagging and pack again.
- Assumption: editing a roast changes the green weight charged, the roasted yield, the classification, or the roast date. Changing the green weight charged moves the difference in the lot's remaining green.

## Capabilities

### New Capabilities

- `corrections`: Edit and void a roast, bagging, or sale, with a required note and a change log, keeping voided records visible but out of current figures.

### Modified Capabilities

- `roasting`: A voided roast leaves the roasted stock and the green it consumed, and cannot be voided while it still has live baggings.
- `resting-and-packaging`: A voided bagging returns its roasted weight to the batch and cannot be voided while one of its bags is still sold.
- `sales`: A voided sale returns its bags to available and leaves the sales history and P&L.

## Impact

New audit table, void markers on roasts, baggings, and sales, a records screen for editing and voiding, and the inventory and P&L figures that must skip voided records. No change to how roasts, rest, bagging, and sales are recorded.

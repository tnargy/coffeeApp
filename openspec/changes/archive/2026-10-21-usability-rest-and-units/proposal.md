# Proposal

## Why

Logging a roast does not start the rest, and the operator must mark rest again before bagging. Receipt asks for a time that is not used, and most weights flip between pounds, ounces, and grams, so a 1 lb reserve roasted as 300 g does not read as 154 g still reserved.

## What Changes

- Start rest when a roast is logged, using the roast time already stored on the batch. Remove the separate "mark rested" step. The 24-hour wait before bagging stays, measured from that roast time.
- Existing batches with no rest start use their stored roast time, so they are not stuck waiting for a manual mark.
- Capture green receipt as a date only. Do not ask for or store a time of day.
- Show weights in grams, except lot weight received in pounds, the personal reserve setting in pounds, and bag size in ounces. Unmet reserve after a roast is grams: 1 lb reserved minus 300 g roasted is about 154 g still reserved.
- Assumption: green remaining, roasted stock, and coffee weight inside a bag display in grams. Only the bag size stays in ounces. Roast logging keeps a date and time because that time is the rest start. Stored amounts stay in grams.

## Capabilities

### New Capabilities

- `weight-display`: How operator-facing weights are shown and entered. Received lots in pounds, reserve setting in pounds, bag size in ounces, every other weight in grams.

### Modified Capabilities

- `resting-and-packaging`: Rest starts at the batch roast time. Bagging no longer requires a separate rest mark. The 24-hour rule still applies.
- `roasting`: Recording a roast stores that roast time as the batch rest start.
- `inventory`: Green receipt records a calendar date and does not store a time of day.

## Impact

Roast logging, pack-bags rest controls, receive-lot date field, and weight labels on the dashboard, history, roast, pack, and sale screens. No change to inventory math, the 24-hour minimum, or bag-size settings.

# Proposal

## Why

The dashboard spec already requires a full batch or lot history: green receipt, roast with profile, rest, bagging, then sale. That trail is only partly visible. `/history` is an unordered-looking decimal list, opens empty from the dashboard "View all" links, and a lot with more than one batch is not shown as one ordered trail.

## What Changes

- Make the history view a clear timeline of the stages that have happened, in order: green receipt → roast (with profile) → rest → bagging → sale(s).
- Show a batch trail or a lot trail as soon as the operator selects that subject, including when they open it from the dashboard.
- Keep a lot trail to every batch on that lot, in the same stage order, with each event tied to its batch.
- Do not invent stages that have not happened. Do not change how roasts, rests, bags, or sales are recorded.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `dashboard`: Full History Trail must be a visible ordered timeline for the selected batch or lot, not a plain list that stays empty until a second choice.

## Impact

- History page and its timeline presentation.
- Dashboard links into a specific batch or lot trail.
- Derived trail ordering for lots. No new stored fields, and no change to inventory, roast, rest, bag, or sale rules.

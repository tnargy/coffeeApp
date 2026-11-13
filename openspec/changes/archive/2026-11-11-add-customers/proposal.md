# Add a customer directory

## Why
Buyers were tracked outside the app, and sale notes were the only place a name or grind showed up. Those two lists drifted, and grind could not be counted or reused.

## What changes
- A Customers page for name, grind preference (`ground`, `whole`, or `unknown`), and optional notes.
- Derived status and totals from linked sales that are not void.
- Record Sale can link a customer or leave the sale unlinked. Records shows the customer name.
- Existing unlinked sales are matched from their notes once, without rewriting the note.
- A separate JSON file can add customers. It never runs automatically.
- Backup format version becomes 3 and includes customers. Format 2 still imports.

## Non-goals
No customer delete, contact info, bean preference, storefront, or changes to P&L, tax, or void rules. No customer names are hard-coded.

## Source
GitHub issue #1. The change folder was not in the repository when implementation started, so this archive was written from that issue and the behavior that shipped.

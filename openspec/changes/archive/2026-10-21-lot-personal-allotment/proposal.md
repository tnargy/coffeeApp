# Proposal

## Why

The dashboard shows one roasted total and compares all green on hand to a fixed monthly target. That does not say how much of each lot is personal use, so roasting the allotment does not show that the rest is fair to sell. A new lot should raise the allotment, and the operator should set the reserve on that lot.

## What Changes

- Track roasted stock beside green, split into personal use and for sale.
- Give each green lot an adjustable personal-use reserve. Receiving a lot adds that reserve to the allotment.
- Default a new lot's reserve to the existing personal-use setting (about 1 lb), capped at the weight received. The operator can set a different amount when receiving the lot and change it later.
- Count a lot's allotment as green weight charged to internal/personal-use roasts from that lot. When that charged weight covers the lot's reserve, remaining green on the lot and roasted stock classified for sale are marked fair to sell. Roasted stock from personal-use batches stays marked personal use.
- **BREAKING:** Replace the "all green on hand versus a monthly target" warning with this per-lot allotment. It still does not block roasts or sales.
- Assumption: lots already on hand start with a reserve of 0 until the operator sets one, so existing stock is not silently reserved.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `inventory`: Each lot has an adjustable personal reserve. Receiving green changes the allotment. The reserve warning becomes that per-lot allotment, not total green versus a fixed monthly target.
- `dashboard`: Show green and roasted stock with personal use marked, and show when a lot's allotment is roasted so the rest is fair to sell.

## Impact

Receive-lot form, lot editing, dashboard stock and reserve display, and derived allotment totals. No change to roast, rest, bag, or sale recording rules. Existing lots need a reserve value; unset means 0.

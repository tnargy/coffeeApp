# Inventory

## Purpose
Show green lots and their margin, cost trend, and forward margin.

## Requirements

### Requirement: Lot rows show margin, cost trend, and forward margin
Each lot row on Inventory and on History MUST show $/kg, total cost, break-even status (`covered`, `not covered`, or `no cost` for a $0 lot), bags to break even, and forward margin (expected bags, expected revenue, expected whole-lot profit left), using the same definitions as the Dashboard margin table. The cost-trend flag MUST be shown on the lot row when it applies. The Inventory and History margin lists MUST include all lots, including depleted ones (remaining green 0 g). A $0 lot shows status `no cost` and no break-even line.

This sentence is qualified from "The margin list MUST include all lots" so it cannot be read as covering the Dashboard's margin table, which filters finished lots behind a toggle (see the dashboard spec's Finished-lots toggle requirement). Inventory and History behaviour is unchanged; only the wording is scoped. All scenarios under this requirement are unchanged.

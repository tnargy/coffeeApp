# How inventory moves

CoffeeApp is a local ledger. Nothing is deleted when you correct a mistake. A void marks the record and puts the weight back. Tax is stored if you type it. The app does not calculate or file tax.

Weights are grams. Money is a recorded amount, not a checkout.

## Operator path

```mermaid
flowchart LR
  receive["Receive a green lot"] --> roast["Log a roast"]
  profiles["Save a profile"] -.-> roast
  roast --> pack["Pack bags"]
  pack --> sale["Record a sale"]
  sale --> records["Records"]
  roast --> records
  pack --> records
  records --> history["History trail"]
```

Inventory is not in the top bar. Open it from the dashboard green-inventory card. Finished lots stay there after they leave the dashboard list.

## Where weight lives

```mermaid
flowchart TD
  lot["Green lot\nweight remaining"] --> roast["Roast batch"]
  roast --> personal["Personal pool"]
  roast --> forSale["For-sale pool"]
  personal --> personalBags["Personal bags"]
  forSale --> saleBags["For-sale bags"]
  saleBags --> sold["Sold bags"]
  sold --> sale["Sale\namount, tax, paid, notes"]
```

A roast always has two pools. If you do not set a personal amount, the whole yield is for sale. A personal amount of the whole yield makes the roast internal. Either amount may be zero. A personal amount below zero or above the roasted yield is refused.

## Personal allotment

Each lot has a personal-use reserve. If you leave it blank on receipt, it defaults to the settings target, capped at the weight received. The default target is 1 lb.

The allotment is covered when personal green already charged from that lot is at least the reserve. Charged personal green is the green equivalent of personal roasted weight still in the pool plus personal bags already packed. For-sale roasted weight from a lot is fair to sell only after that lot's allotment is covered. This is a warning on the dashboard. It does not block a roast or a sale.

## Packing

You choose personal use or for sale for the pack. The packed weight is taken from the opposite pool first, then from the chosen pool. Unpacked weight stays in its pool. A pack that exceeds the selected roasts' remaining weight is refused.

```mermaid
flowchart TD
  start["Pack N bags of a chosen purpose"] --> order["Draw batches in the order you selected"]
  order --> opposite{"Opposite pool has weight?"}
  opposite -->|yes| takeOpposite["Take from the opposite pool first"]
  opposite -->|no| takeChosen["Take from the chosen pool"]
  takeOpposite --> takeChosen
  takeChosen --> bag["Each bag stores its purpose and its sources"]
```

One bagging is the set of bags that share an anchor batch and the same `createdAt`. For a pack from several batches, the anchor is the first batch that supplied weight. That pair is how Records groups the bagging. It is not the only source. `sources` on each bag says how many grams came from each batch. Those grams sum to the bag's weight. A single-batch bag omits `sources` and came wholly from its anchor.

Personal bags are not offered for sale. A sale that includes one is refused, and stock does not change.

## Sales and money

A sale records an amount, an optional tax amount, a date, notes, and paid or unpaid. Leaving paid unset stores the sale as paid. Only an explicit unpaid sale counts on the dashboard unpaid card.

The Records sales list shows paid or unpaid on every sale, and shows notes when they are not blank.

P&L uses live sales only:

- Revenue is the sum of sale amounts. Voided sales are left out.
- Cost of goods is the green-lot cost of sold bags that are not void, split by each source batch's share of the bag.
- Gross profit is revenue minus that cost.
- Tax is not part of P&L.

## Corrections

Edits and voids require a note. The record stays. The change log on Records keeps the note and the old and new values.

Void from the outside in. A roast with a live bagging cannot be voided. A bagging that is on a live sale cannot be voided.

```mermaid
flowchart TD
  sale["Void the sale"] --> bags["Its bags become available again"]
  bags --> bagging["Void the bagging"]
  bagging --> pools["Each source batch gets its grams back in the bag's purpose pool"]
  pools --> roast["Void the roast"]
  roast --> green["Green weight returns to the lot"]
```

A voided record stays in the list, marked with its reason. It does not count toward green weight, roasted weight, bags ready, sales totals, P&L, or the personal allotment.

## Save path

Pages do not write IndexedDB themselves. A change goes through `src/domain/rules.ts`, which returns a new state or an error and leaves the previous state unchanged. `src/data/repository.ts` runs those changes one at a time and, on success, replaces the Dexie tables in one transaction.

```mermaid
flowchart LR
  page["Page"] --> rules["domain/rules.ts"]
  rules --> repo["repository queue"]
  repo --> dexie["IndexedDB\nCoffeeRoasterDB"]
  dexie --> hook["useAppState"]
  hook --> page
```

Settings can export that state as JSON and replace it with an import. Import replaces the current data. It does not merge.

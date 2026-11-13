# Revisions — v1 → v2 → v3 (Goldfish review fixes)

Date: 2026-11-11
Review v1: zero-context Goldfish review, verdict NO-GO, 6 blockers,
8 majors, 6 minors. Report: `../../goldfish-review-2026-11-11.md`
Re-review v2: zero-context Goldfish re-review, verdict NO-GO
narrowly, 1 new blocker, 3 new majors, 7 new minors. Report:
`../../goldfish-rereview-2026-11-11.md`

## Decisions on the Goldfish's 3 questions

1. **Standard price does NOT apply retroactively.** `Sale.standardPriceAtSale`
   is stored at record time. Changing `Settings.standardBagPrice`
   affects future sales and forward margin only.
2. **"Personal cost" = green-equivalent cost of live personal roasted
   stock** (live internal bags + unpacked personal remaining), computed
   per bag / pool like `costOfBag`. NOT `personalYield` alone.
   Fixture: $18.13 (internal bags), vs $10.13 (personalYield alone).
3. **Cost-trend comparator = most recent earlier paid lot received on
   an earlier UTC calendar day**, regardless of origin. Lots received
   on the same day share the comparator. No comparator → never flagged.
   This flags both Nov 9 lots against Oct 26 (+25.7%).

## Blockers fixed

- **B1 — Peru flag contradiction.** Old rule ("previous lot for the
  same origin") could never flag Peru, the first Peru lot, yet the
  tasks required it flagged. New comparator (above) flags both Nov 9
  lots, and "same origin" is no longer used.
- **B2 — Personal cost ambiguous ($10.13 vs $18.13).** Defined as
  exactly one quantity (live personal stock, see above). Corrected
  $18.12 → $18.13. Rewrote the reconciliation: sold COGS + personal
  cost = green cost consumed (±$0.02); remaining-green cost is stated
  separately, not double-counted.
- **B3 — Forward formula ambiguous, misses packed bags.** One
  explicit formula with units in Design, using `unmetReserve` from
  the existing `lotAllotment` helper (no double-counted reserve),
  plus `forSaleRoastedRemaining` and `weightOfAvailableForSaleBags`.
- **B4 — "Covered" vs bags to break even contradicted.** Both now
  use the standard-price basis: `covered` when
  `standardRevenue >= totalCost`, and `bagsToBreakEven =
  ceil(max(0, totalCost − standardRevenue) / currentStandardPrice)`.
  Added the mixed overpay scenario ($50 lot, 4 bags at $20: not
  covered, 1 bag to break even).
- **B5 — Standard price retroactivity undefined.** Decided (see
  above): stored at sale time, history never recomputes. Added a
  scenario for changing the setting after sales exist.
- **B6 — Fractional bags / cents undefined.** Bags sold is a decimal
  to one place; money is rounded per lot with `roundMoney` after
  summing source-weighted amounts; tolerance ±$0.02 stated.

## Majors fixed

- **M1 — "About" with no tolerance, 1¢ errors.** Replaced "about"
  with exact values and ±$0.02 tolerance. Corrected forward revenue
  $82.76 → $82.77 and forward profit $32.76 → $32.77. Note the
  exact figure: $82.77 requires the exact loss ratio 13.707%
  (1 − 4,178.6/4,842.3); at a literal rounded 13.71% loss the
  revenue is $82.76. The design states to use the exact ratio,
  not the rounded %, and v3 repeats that rule in tasks 1.3.

## v2 → v3 (Goldfish re-review fixes)

- **N1 — Fixture dropped every bag's `sources` array, so it
  contradicted the spec's own numbers.** The fixture was
  regenerated from the original export with `sources` restored
  in full (batch ids and weights only — nothing sensitive), and
  its `expected` block was regenerated from the fixture data:
  per-lot COGS $27.24 / $18.70 / $18.44 now reproduce from the
  fixture itself. Added a `syntheticCases` section with hand-built
  cases the export does not exercise: a voided sale, a
  below-standard sale ($10 at a $12 standard), an available
  for-sale bag, unpacked personal remaining, and a cross-lot
  combined bag. Tasks 5.1 now says those tests use the synthetic
  cases, not the export data.
- **N2 — What-if "forward profit per lot" had no formula.**
  Defined as the whole-lot profit left recomputed at the what-if
  price: `forwardProfitPerLot = forwardBags × whatIfPrice +
  actualRevenueToDate − totalCost`. Worked example: $13 → $39.66
  per lot, $14 → $46.56 per lot. The design now also states that
  `forwardBags × forwardProfitPerBag` ($49.66 at $13) is the
  future-bags margin only, not the per-lot figure, because the
  reserve's green cost is already inside `totalCost`.
- **N3 — Forward revenue rounding order undefined.** Stated:
  forward revenue, forward profit, and the reserve what-if line
  are computed from exact (unrounded) forward bags; the 1-decimal
  figure is display only (6.9 × $12 = $82.80, not $82.77).
- **N4 — `availableForSaleBagWeight` attribution undefined for
  combined bags.** Defined as the source-weighted portion per
  lot, never the full bag weight for both lots.
- **n5 — Cost-trend comparator tie-break undefined.** Added:
  ties broken by latest `dateReceived`, then highest `id`.
- **n6 — `updateSettings` plumbing not named.** Task 2.1 now
  names `updateSettings` in `src/domain/rules.ts` and says its
  Pick must be extended to include `standardBagPrice`.
- **n7 — Standard revenue for a non-8oz bag undefined.** Defined
  the denominator: bag weight fraction is bag weight divided by
  the packed bag weight for the default bag size (227 g for 8 oz),
  so a whole 4oz bag is $6 at a $12 standard.
- **n8 — Multi-lot overpay/shortfall split undefined.** Defined:
  split in proportion to each lot's standard-revenue share of
  that sale; overpay/shortfall are floored per sale on exact
  amounts, then rounded per lot after summing.
- **n9 — REVISIONS.md's $82.77 justification was wrong.**
  Corrected above (exact 13.707% ratio, not literal 13.71%).
- **n10 — "Omit depleted lots" never scoped.** The dashboard
  delta now states the omit-depleted rule applies to the
  green-inventory list only, not the per-lot margin table.
- **n11 — Hybrid price-basis consequence unstated.** Noted in
  Design: after a price change, `bagsSold + bagsToBreakEven`
  need not equal `breakEvenBags`; that is expected, not a bug.
- **M2 — No inventory delta; margin table vs depleted lots.**
  Added `specs/inventory/spec.md`. Stated the margin table lists
  all lots, including depleted ones, with a scenario for a depleted
  lot.
- **M3 — No validation for price settings.** `standardBagPrice`
  must be > $0 (refused in `SettingsPage.tsx`, previous value stays);
  what-if price must be > $0 (ignored, reverts to standard).
  `SettingsPage.tsx` is now named in the tasks.
- **M4 — Test fixture quoted but not in the repo.** Added
  `fixtures/nov10-export-fixture.json` — a sanitised fixture
  (lots, batches, bags, sales with amounts and dates, no customer
  names or notes) with expected values. Tasks 1.1–1.4 and 5.1 now
  verify against it.
- **M5 — Monthly grouping undefined.** Defined as UTC month of
  `sale.date`, empty months omitted, table lives in the Dashboard
  P&L section below the per-lot table.
- **M6 — Forward bag weight ambiguous.** Defined as
  `round(defaultBagSizeOz × 28.349523125)` grams — 227 g for 8 oz —
  not hard-coded and not 226.8 g.
- **M7 — Below-standard sales make the split not sum.** Added an
  explicit `shortfall` field (standard − actual, floored at 0 per
  sale) and the identity `actual = standard + overpay − shortfall`.
- **M8 — What-if scope stated two ways.** Gave the per-bag formula
  (`costPerBag = (bagWeight / (1 − loss)) / 1000 × costPerKg`;
  `forwardProfitPerBag = whatIfPrice − costPerBag`) and stated it
  does not change break-even bags, standard revenue, or any stored
  value.

## Minors fixed

- **m1 — "Up 27%" baseline.** Stated: $17.35/kg (first Guatemala)
  → $22.05/kg = +27.1%.
- **m2 — "Overall average loss" undefined.** Defined as
  green-weighted loss (1 − sum roastedYield / sum greenWeightCharged).
- **m3 — Loss wording inverted.** Fixed: loss is 1 minus the
  yield ratio, not the ratio itself.
- **m4 — $0 lots "covered" by definition.** $0 lots now have
  status `no cost` and no break-even line.
- **m5 — Field naming inconsistent.** One name everywhere:
  "bags to break even".
- **m6 — "Profit for my time" asserted, not measured.** Labelled
  "profit left after the lot cost" throughout; time tracking stays
  out of v1.

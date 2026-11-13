# Delta for Sales

## ADDED Requirements

### Requirement: Standard revenue, overpay, and shortfall are shown separately in the margin view
In the margin view, each sale's contribution MUST be split into
standard revenue (bags sold × that sale's stored `standardPriceAtSale`),
overpay (actual sale amount minus standard revenue for that sale,
floored at 0 per sale), and shortfall (standard revenue minus actual
sale amount for that sale, floored at 0 per sale). Overpay and
shortfall are computed per sale on exact amounts; for a sale
spanning two lots, the sale's overpay / shortfall is split between
the lots in proportion to each lot's standard-revenue share of
that sale. The identity
`actual = standard + overpay − shortfall` MUST hold per lot, per
month, and overall. The split MUST be shown per lot and per month.
A sale recorded before this change, with no `standardPriceAtSale`
field, MUST be treated as $12 for that sale. Sale recording, sale
amounts, Records, voids, and P&L totals MUST NOT change.

#### Scenario: Papua New Guinea overpay is separated
- **GIVEN** 4.0 Papua New Guinea bags sold for $66.00 actual
- **WHEN** the operator views the margin view
- **THEN** it shows $48.00 standard revenue and $18.00 overpay
- **AND** its standard margin is shown as 61.6%, not 72.1%

#### Scenario: Sale below standard price has a shortfall, not negative overpay
- **GIVEN** a sale below the standard bag price
- **WHEN** the operator views the margin view
- **THEN** that sale contributes 0 overpay
- **AND** it contributes a shortfall equal to standard revenue minus the actual amount
- **AND** the shortfall is shown alongside overpay

#### Scenario: Voided sale is excluded
- **GIVEN** a voided sale
- **WHEN** the operator views the margin view or monthly history
- **THEN** that sale contributes no revenue, standard revenue, overpay, shortfall, or bags sold

### Requirement: Standard price is stored at sale time
`Sale.standardPriceAtSale` MUST be set at record time to the
current `Settings.standardBagPrice` (or $12 if missing), and MUST
never be changed afterwards. Changing `Settings.standardBagPrice`
MUST NOT recompute past sales' standard revenue, overpay,
shortfall, or monthly history; it affects only future sales and
forward / remaining break-even calculations that use the current
standard price.

#### Scenario: Changing the standard price does not rewrite history
- **GIVEN** sales recorded at a $12 standard price, including Papua New Guinea with $18.00 overpay
- **WHEN** the operator changes the standard price in Settings to $13
- **THEN** those sales still show $48.00 standard revenue and $18.00 overpay for Papua New Guinea
- **AND** a sale recorded after the change uses $13 as its stored standard price

# Sales

## Purpose
Record limited sales of bagged coffee for cost-offset purposes, capturing sale amounts and associated costs for later manual profit calculation. No automated tax calculation or filing.

## Requirements

### Requirement: Record a Sale
When the operator records a sale of one or more bagged units, the system reduces bagged inventory, records the sale (including any tax amount), and updates the sales history. The system MUST NOT offer a personal-use bag for sale. A sale that includes a personal-use bag MUST be refused, and inventory MUST stay unchanged.

#### Scenario: Sell one bag
- GIVEN bagged units exist
- WHEN the operator records a sale of one bag with a sale amount
- THEN bagged inventory decreases and the sale is recorded

#### Scenario: Personal bag is not sold
- **GIVEN** an available personal-use bag and an available for-sale bag
- **WHEN** the operator records a sale
- **THEN** the personal-use bag is not offered
- **AND** a sale that includes it is refused
- **AND** that bag stays available

### Requirement: Simple Cost Basis Tracking
The system captures sale amounts and associated bean costs so profit can be calculated manually later. No automated tax calculation or filing.

#### Scenario: Sale linked to source
- GIVEN a bag from a known batch
- WHEN the sale is recorded
- THEN the sale can be traced back to its batch and green lot for cost basis

#### Scenario: Sale records cost context
- GIVEN a bag originating from a known green lot and roast
- WHEN the sale is recorded
- THEN the sale is linked to the source batch/lot so cost basis can be derived later

### Requirement: No Public Storefront
The system must not provide a public storefront, customer-facing catalog, or online checkout.

#### Scenario: No customer-facing features
- GIVEN the application is in use
- WHEN any operator views the app
- THEN only internal recording and viewing functions are available

### Requirement: Void a sale
When the operator voids a sale, the system MUST return its bags to available, and MUST leave the sale out of the sales history, sales total, and P&L.

#### Scenario: Voided sale returns its bags
- **GIVEN** a sale of one bag
- **WHEN** the operator voids that sale
- **THEN** the bag is available again
- **AND** the sale is no longer counted in sales total or P&L

#### Scenario: Voided sale stays in the record list
- **GIVEN** a sale that has been voided
- **WHEN** the operator opens the records list
- **THEN** the sale is listed, marked void with its reason

### Requirement: Cost basis follows a bag's source batches
For a bag that took weight from more than one batch, the system MUST compute that bag's cost from each source batch's share, using that batch's green lot cost. A sale of such a bag MUST be traceable to every source batch and green lot.

#### Scenario: Cost of a bag from two lots
- **GIVEN** a bag of 200 g with 100 g from a batch on a cheaper lot and 100 g from a batch on a dearer lot
- **WHEN** the bag is sold
- **THEN** the bag's cost equals the cost of 100 g of roast from each lot's batch added together
- **AND** the P&L cost of goods uses that amount

#### Scenario: Sale shows every source
- **GIVEN** a sold bag that took weight from batch A and batch B
- **WHEN** the operator views the sale's sources
- **THEN** both batches and their green lots are shown

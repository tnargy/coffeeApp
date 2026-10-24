# Delta for Sales

## ADDED Requirements

### Requirement: Record a Sale
When the operator records a sale of one or more bagged units, the system reduces bagged inventory, records the sale (including any tax amount), and updates the sales history.

#### Scenario: Sell one bag
- GIVEN bagged units exist
- WHEN the operator records a sale of one bag with a sale amount
- THEN bagged inventory decreases and the sale is recorded

### Requirement: Simple Cost Basis Tracking
The system captures sale amounts and associated bean costs so profit can be calculated manually later. No automated tax calculation or filing.

#### Scenario: Sale linked to source
- GIVEN a bag from a known batch
- WHEN the sale is recorded
- THEN the sale can be traced back to its batch and green lot for cost basis

# Delta for Inventory

## MODIFIED Requirements

### Requirement: Receive Green Beans
When the operator records receipt of green beans (origin, weight, date, cost), the system increases green inventory by that weight and records the lot. The receipt MUST capture a calendar date and MUST NOT ask for or store a time of day.

#### Scenario: Record a new green lot
- GIVEN green inventory is 5 kg
- WHEN the operator records receipt of 2 kg of a new green lot
- THEN green inventory becomes 7 kg
- AND the new lot is recorded with origin, weight, date, and cost

#### Scenario: Receipt date has no time
- **GIVEN** the operator is receiving a green lot
- **WHEN** they enter a receipt date
- **THEN** the lot stores that calendar date
- **AND** no time of day is requested or stored

# Delta for Inventory

## MODIFIED Requirements

### Requirement: Receive Green Beans
When the operator records receipt of green beans (origin, weight, date, cost), the system increases green inventory by that weight and records the lot. The lot MUST include a personal-use reserve. If the operator does not set one, the reserve MUST default to the personal-use setting, capped at the weight received. The allotment MUST increase by that reserve.

#### Scenario: Record a new green lot
- GIVEN green inventory is 5 kg
- WHEN the operator records receipt of 2 kg of a new green lot
- THEN green inventory becomes 7 kg
- AND the new lot is recorded with origin, weight, date, and cost

#### Scenario: New lot raises the allotment
- **GIVEN** the personal-use setting is 1 lb and green inventory has no lots
- **WHEN** the operator receives a 5 lb lot and does not enter a reserve
- **THEN** that lot's reserve is 1 lb
- **AND** the allotment increases by 1 lb

#### Scenario: Operator sets the lot reserve
- **GIVEN** the operator is receiving a 5 lb lot
- **WHEN** they set that lot's personal reserve to 8 oz
- **THEN** the lot is stored with an 8 oz reserve
- **AND** the allotment increases by 8 oz, not by the default setting

### Requirement: View Inventory Dashboard
When the operator views the inventory dashboard, the system MUST display current green weight remaining, roasted weight available split into personal use and for sale, each lot's personal reserve, and whether that lot's remaining stock is fair to sell.

#### Scenario: Dashboard shows current stock and reserve
- GIVEN green inventory exists and a personal-use reserve is configured
- WHEN the operator opens the dashboard
- THEN current green weight, roasted weight split by personal use and for sale, and each lot's reserve status are displayed

## ADDED Requirements

### Requirement: Adjust lot reserve
The system MUST let the operator change a lot's personal-use reserve after receipt. The reserve MUST NOT exceed that lot's received weight. A missing reserve MUST be treated as 0. Changing the reserve MUST NOT change past roast classifications.

#### Scenario: Raise or lower a lot reserve
- **GIVEN** a lot with a 1 lb reserve
- **WHEN** the operator changes that reserve to 12 oz
- **THEN** the lot's allotment is 12 oz
- **AND** earlier roast classifications are unchanged

#### Scenario: Existing lot starts unreserved
- **GIVEN** a lot recorded before per-lot reserves existed
- **WHEN** the operator views it before setting a reserve
- **THEN** its reserve is 0
- **AND** its remaining green is fair to sell

#### Scenario: Reserve cannot exceed the lot
- **GIVEN** a lot received as 2 lb
- **WHEN** the operator sets its reserve above 2 lb
- **THEN** the system rejects the change
- **AND** the stored reserve is unchanged

### Requirement: Allotment covered
A lot's allotment is covered when green weight charged to internal/personal-use roasts from that lot is at least its reserve. Until then, green still needed for that reserve MUST NOT be marked fair to sell. Covering the allotment MUST NOT block a roast or a sale.

#### Scenario: Roast the allotment
- **GIVEN** a lot with a 1 lb reserve and no personal-use roast yet
- **WHEN** the operator roasts 1 lb of that lot as internal/personal use
- **THEN** the lot's allotment is covered
- **AND** the roast is recorded

#### Scenario: Unmet reserve is not fair to sell
- **GIVEN** a lot with 5 lb remaining and a 1 lb reserve that has not been roasted
- **WHEN** the operator views that lot
- **THEN** 1 lb is still reserved
- **AND** only the other 4 lb of remaining green is fair to sell

## REMOVED Requirements

### Requirement: Personal-Use Reserve Warning
**Reason**: A fixed comparison of all green on hand to a monthly target does not change when a new lot arrives, and it does not show when a lot's personal allotment has been roasted.
**Migration**: Use each lot's personal reserve and whether that allotment is covered. Roasts and sales stay non-blocking.

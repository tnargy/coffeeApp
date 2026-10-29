# Inventory

## Purpose
Track green coffee bean lots, current stock levels, personal-use reserve targets, and prevent negative inventory.

## Requirements

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
When the operator views the inventory dashboard, the system MUST display current green weight remaining, roasted weight available split into personal use and for sale, and, for each lot that still has remaining weight, that lot's personal reserve and whether its remaining stock is fair to sell. A lot whose remaining weight is zero or less MUST NOT appear in the dashboard lot list. Dashboard totals and the allotment warning MUST still include every lot.

#### Scenario: Dashboard shows current stock and reserve
- GIVEN green inventory exists and a personal-use reserve is configured
- WHEN the operator opens the dashboard
- THEN current green weight, roasted weight split by personal use and for sale, and each listed lot's reserve status are displayed
- AND a lot with no remaining weight is not in the dashboard lot list

#### Scenario: Depleted lot leaves the dashboard list
- GIVEN one lot still has green weight and another has none
- WHEN the operator opens the dashboard
- THEN only the lot with remaining weight appears in the green-inventory list
- AND the depleted lot is not deleted

#### Scenario: Hidden lot still counts toward the allotment
- GIVEN a lot with no remaining weight still has an unmet personal reserve
- WHEN the operator opens the dashboard
- THEN that lot is not in the green-inventory list
- AND the allotment warning still includes that lot's unmet reserve

#### Scenario: Lot returns when weight comes back
- GIVEN a lot is hidden because its remaining weight is zero
- WHEN its remaining weight becomes greater than zero
- THEN the lot appears in the dashboard lot list again

### Requirement: Personal-Use Reserve Warning
When green inventory falls below the configured personal-use reserve threshold, the system displays a non-blocking warning; it does not prevent the operator from recording further roasts.

#### Scenario: Roast reduces stock below reserve
- GIVEN green inventory is 0.6 kg and personal-use reserve target is 0.45 kg
- WHEN the operator records a roast of 0.2 kg green classified as internal/personal use
- THEN the roast succeeds
- AND the dashboard shows a non-blocking warning

### Requirement: No Negative Stock
When any inventory adjustment would result in negative stock, the system rejects the action and informs the operator of the shortfall.

#### Scenario: Attempt to roast more green than available
- GIVEN green inventory is 800 g
- WHEN the operator attempts to record a roast of 1 kg green weight
- THEN the system rejects the action and leaves inventory unchanged

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
A lot's allotment is covered when the green share of personal-use roasted weight from that lot is at least its reserve. Personal-use roasted weight is unpacked personal weight plus the weight of live personal bags. The green share of a roast is its green weight charged times that personal roasted weight, divided by the roast's roasted yield. A roast with no yield contributes nothing. Until the allotment is covered, green still needed for that reserve MUST NOT be marked fair to sell. Covering the allotment MUST NOT block a roast or a sale.

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

#### Scenario: A split roast covers only its personal share
- **GIVEN** a lot with a 600 g reserve
- **WHEN** the operator roasts 600 g green to 500 g and sets 250 g of that yield as personal use
- **THEN** 300 g of green counts toward the allotment
- **AND** the allotment is not covered

#### Scenario: Packing personal use covers more of the allotment
- **GIVEN** that split roast still has 250 g for sale unpacked
- **WHEN** the operator packs that 250 g as personal use
- **THEN** the whole 600 g of green charged counts toward the allotment
- **AND** the allotment is covered

### Requirement: Inventory page lists every lot
The system SHALL provide an Inventory page that lists every recorded green lot, including lots whose remaining weight is zero or less. The dashboard Green bean inventory "View all" link SHALL open that page. Inventory MUST NOT be a top-navigation item. Each listed lot SHALL show its name and remaining weight. Opening the page MUST NOT remove or change a lot.

#### Scenario: View all opens Inventory
- GIVEN the dashboard shows the green-inventory card
- WHEN the operator follows View all
- THEN the Inventory page opens
- AND Inventory is not a top-navigation item

#### Scenario: Depleted lot is listed
- GIVEN one lot still has green weight and another has none
- WHEN the operator opens the Inventory page
- THEN both lots are listed
- AND the depleted lot shows no remaining weight

#### Scenario: History still has the depleted lot
- GIVEN a lot has no remaining weight
- WHEN the operator opens History
- THEN that lot is still listed
- AND its trail can still be opened

#### Scenario: Log roast still offers the depleted lot
- GIVEN a lot has no remaining weight
- WHEN the operator opens Log Roast
- THEN that lot is still in the lot picker

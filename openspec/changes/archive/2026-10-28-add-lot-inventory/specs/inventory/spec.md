## MODIFIED Requirements

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

## ADDED Requirements

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

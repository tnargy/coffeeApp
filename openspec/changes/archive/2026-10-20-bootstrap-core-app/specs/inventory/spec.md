# Delta for Inventory

## ADDED Requirements

### Requirement: Receive Green Beans
When the operator records receipt of green beans (origin, weight, date, cost), the system increases green inventory by that weight and records the lot.

#### Scenario: Record a new green lot
- GIVEN green inventory is 5 kg
- WHEN the operator records receipt of 2 kg of a new green lot
- THEN green inventory becomes 7 kg
- AND the new lot is recorded with origin, weight, date, and cost

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

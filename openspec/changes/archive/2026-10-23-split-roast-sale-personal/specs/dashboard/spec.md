# Spec Delta

## ADDED Requirements

### Requirement: Split roast stock
When one roast still has both personal-use and for-sale roasted weight, the dashboard MUST count each pool in the matching roasted total.

#### Scenario: One roast contributes to both totals
- **GIVEN** one roast has unpacked personal weight and unpacked for-sale weight
- **WHEN** the operator opens the dashboard
- **THEN** the personal total includes the personal weight
- **AND** the for-sale total includes the for-sale weight

### Requirement: Bags ready excludes personal bags
Bags ready MUST count available for-sale bags only. An available personal-use bag MUST NOT be included.

#### Scenario: Personal bags are not ready to sell
- **GIVEN** one available personal-use bag and one available for-sale bag
- **WHEN** the operator opens the dashboard
- **THEN** bags ready is 1

## MODIFIED Requirements

### Requirement: Fair to sell
When a lot's personal allotment is covered, the dashboard MUST mark that lot's remaining green and its for-sale roasted stock as fair to sell. For-sale roasted stock includes the for-sale pool of a split roast. Personal-use roasted stock MUST stay marked personal use and MUST NOT be marked fair to sell. If the allotment is not covered, the dashboard MUST show how much of that lot is still reserved and MUST NOT mark that reserved green as fair to sell.

#### Scenario: Allotment roasted
- **GIVEN** a lot whose personal reserve has been fully charged to internal/personal-use roasts
- **WHEN** the operator opens the dashboard
- **THEN** that lot's remaining green is marked fair to sell
- **AND** roasted weight from for-sale batches of that lot is marked fair to sell
- **AND** roasted weight from personal-use batches is marked personal use

#### Scenario: Allotment still open
- **GIVEN** a lot whose personal reserve is not yet covered
- **WHEN** the operator opens the dashboard
- **THEN** the unmet reserve is shown
- **AND** that unmet amount is not marked fair to sell

#### Scenario: Split roast is fair only on its for-sale pool
- **GIVEN** a covered lot and one roast with both unpacked personal weight and unpacked for-sale weight
- **WHEN** the operator opens the dashboard
- **THEN** the for-sale pool is marked fair to sell
- **AND** the personal pool is not

# Weight Display

## Purpose
Show coffee weights in the unit the operator uses for that amount, so a pound reserved and a gram roasted can be read together.

## Requirements

### Requirement: Gram weights
The system MUST show operator-facing coffee weights in grams, except lot weight received, the personal reserve setting, and bag size.

#### Scenario: Roasted and remaining stock
- **GIVEN** a batch with roasted weight remaining
- **WHEN** the operator views that weight on the dashboard, history, roast, pack, or sale screen
- **THEN** it is shown in grams

#### Scenario: Green remaining
- **GIVEN** a lot has green weight remaining
- **WHEN** the operator views remaining green
- **THEN** it is shown in grams

### Requirement: Pound exceptions
The system MUST show lot weight received and the personal reserve setting in pounds. Inputs for those amounts MUST be in pounds.

#### Scenario: Received lot
- **GIVEN** a lot received as 5 lb
- **WHEN** the operator views the received weight
- **THEN** it is shown in pounds

#### Scenario: Reserve setting
- **GIVEN** the operator is setting a lot reserve
- **WHEN** they enter 1 lb
- **THEN** the reserve setting is shown in pounds

### Requirement: Bag size in ounces
The system MUST show bag size in ounces. Coffee weight packed into a bag MUST still be shown in grams.

#### Scenario: Bag size
- **GIVEN** the default bag size is 8 oz
- **WHEN** the operator views or edits bag size
- **THEN** it is shown in ounces

### Requirement: Unmet reserve in grams
After a personal-use roast, the system MUST show the still-unreserved remainder in grams.

#### Scenario: One pound reserved and 300 g roasted
- **GIVEN** a lot reserve of 1 lb
- **WHEN** the operator roasts 300 g of that lot as personal use
- **THEN** the amount still reserved is shown in grams
- **AND** that amount is about 154 g

# Resting and Packaging

## Purpose
Enforce a minimum rest period before bagging and track packaging into bags of a configurable default size.

## Requirements

### Requirement: Bagging
When the operator records bagging of a rested batch, the system defaults to the configured bag size (starting at 8 oz) and reduces the available roasted weight of that batch by the total bagged weight, creating the corresponding bagged inventory units. The operator MUST choose a purpose for that pack, personal use or for sale. Each bag MUST store that purpose. The packed weight MUST be taken from the opposite-purpose pool first, then from the chosen-purpose pool. Unpacked weight not included in the pack MUST stay in its pool. The system MUST reject a pack that exceeds the roast's total remaining roasted weight.

#### Scenario: Bag a rested batch
- GIVEN a rested batch with remaining roasted weight
- WHEN the operator bags a quantity into finished bags
- THEN roasted weight decreases and bagged units are created

#### Scenario: Bag a rested batch into default bags
- GIVEN a rested batch of 1.2 kg classified as for sale
- WHEN the operator bags 400 g into two 200 g bags (or equivalent of the configured bag size)
- THEN roasted weight of the batch decreases by 400 g
- AND two bagged units appear in inventory

#### Scenario: Bag entire remaining roasted weight
- GIVEN 450 g roasted remains on a batch
- WHEN the operator bags 450 g into finished bags
- THEN roasted weight for that batch becomes zero
- AND bagged inventory increases correctly
- AND the batch is no longer offered for further bagging

#### Scenario: Pack personal bags from a for-sale roast
- **GIVEN** a rested roast whose remaining weight is all for sale
- **WHEN** the operator packs part of it as personal use
- **THEN** those bags are personal use
- **AND** the unpacked remainder stays for sale

#### Scenario: Pack more than remains
- **GIVEN** a rested roast with remaining roasted weight
- **WHEN** the operator packs more than that remaining weight
- **THEN** the system rejects the pack
- **AND** roasted weight and bags are unchanged

### Requirement: Configurable Bag Size
The default bag size starts at 8 oz and is adjustable by the operator.

#### Scenario: Change default bag size
- GIVEN the default is 8 oz
- WHEN the operator updates the setting to a different size
- THEN subsequent bagging operations default to the new size

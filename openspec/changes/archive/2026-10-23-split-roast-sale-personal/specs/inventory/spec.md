# Spec Delta

## MODIFIED Requirements

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

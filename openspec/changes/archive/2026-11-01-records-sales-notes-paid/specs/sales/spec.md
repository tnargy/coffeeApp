# Delta for Sales

## ADDED Requirements

### Requirement: Records sales list shows payment and notes
On the records page sales section, each listed sale MUST show whether it is paid or unpaid, and MUST show its notes when notes are present. A sale with no notes MUST NOT show an empty notes line. A sale with no stored paid value MUST be listed as paid. A voided sale MUST still show payment status and notes, and MUST still be marked void.

#### Scenario: Paid sale with notes
- **GIVEN** a paid sale with notes
- **WHEN** the operator opens the records sales section
- **THEN** that sale is listed as paid
- **AND** its notes are listed

#### Scenario: Unpaid sale without notes
- **GIVEN** an unpaid sale with no notes
- **WHEN** the operator opens the records sales section
- **THEN** that sale is listed as unpaid
- **AND** no empty notes line is shown

#### Scenario: Missing paid value is paid
- **GIVEN** a sale that has no stored paid value
- **WHEN** the operator opens the records sales section
- **THEN** that sale is listed as paid

#### Scenario: Voided sale still shows payment and notes
- **GIVEN** a voided unpaid sale with notes
- **WHEN** the operator opens the records sales section
- **THEN** the sale is listed as unpaid
- **AND** its notes are listed
- **AND** it is marked void with its reason

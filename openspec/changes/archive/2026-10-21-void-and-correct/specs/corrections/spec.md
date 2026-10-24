# Spec Delta

## Purpose

Let the operator correct a recorded roast, bagging, or sale without losing the record of what happened.

## ADDED Requirements

### Requirement: Edit a record
The system MUST let the operator edit a roast, a bagging, or a sale. Every edit MUST require a note explaining the change. The system MUST leave the record and its history intact otherwise.

#### Scenario: Correct a sale amount
- **GIVEN** a recorded sale of 18.00
- **WHEN** the operator changes it to 15.00 with a note
- **THEN** the sale shows 15.00
- **AND** the change log records the old amount, the new amount, and the note

#### Scenario: Edit without a note is refused
- **GIVEN** a recorded sale
- **WHEN** the operator submits an edit with no note
- **THEN** the system refuses the edit
- **AND** the sale is unchanged

### Requirement: Void a record
The system MUST let the operator void a roast, a bagging, or a sale. A void MUST require a note. A void MUST NOT delete the record. The system MUST refuse to void a record that still has live records under it and MUST say which record to void first.

#### Scenario: Void a roast
- **GIVEN** a recorded roast with no live bagging under it
- **WHEN** the operator voids it with a note
- **THEN** the roast is kept and marked void with the note
- **AND** it no longer counts toward roasted stock or the green it consumed

#### Scenario: Void refused while a child record is live
- **GIVEN** a recorded roast that still has a live bagging
- **WHEN** the operator tries to void the roast
- **THEN** the system refuses the void
- **AND** it says the bagging must be voided first

#### Scenario: Void is recorded once
- **GIVEN** a record that is already void
- **WHEN** the operator views it
- **THEN** it shows as void with the original reason
- **AND** voiding it again is not possible

### Requirement: Change log
The system MUST keep a change log of every edit and void. Each entry MUST show when it happened, which record it applies to, what changed, and the note.

#### Scenario: Read the change log
- **GIVEN** an edited sale and a voided roast
- **WHEN** the operator opens the change log
- **THEN** it shows both entries, newest first
- **AND** each entry names the record, the change, and the note

#### Scenario: Log entries are never removed
- **GIVEN** a record with two edits
- **WHEN** the operator voids the record
- **THEN** the change log still shows both earlier edits and the void

### Requirement: Voided records are kept out of current figures
A voided record MUST NOT count toward green weight, roasted weight, bags ready, sales totals, P&L, or the personal allotment. It MUST still be visible where records are listed, marked as void.

#### Scenario: Voided sale leaves the figures
- **GIVEN** a sale of 18.00 that has been voided
- **WHEN** the operator views the dashboard
- **THEN** the sale total and P&L do not include it
- **AND** the record is still listed, marked void

### Requirement: Records can be reviewed and corrected
The system MUST offer a place to list roasts, baggings, and sales, including voided ones, and to start an edit or a void from there.

#### Scenario: Find a record to correct
- **GIVEN** a recorded roast, a bagging, and a sale
- **WHEN** the operator opens the records list
- **THEN** each of them is listed
- **AND** the operator can start an edit or a void for it

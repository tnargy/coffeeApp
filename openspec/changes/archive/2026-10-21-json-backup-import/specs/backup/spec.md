# Spec Delta

## Purpose

Let the operator download a complete JSON backup and restore it on this browser or another.

## ADDED Requirements

### Requirement: Export backup
The system MUST let the operator download a JSON file containing lots, profiles, batches, bags, sales, and settings, plus a format version and export time.

#### Scenario: Download current data
- **GIVEN** lots, batches, and settings exist
- **WHEN** the operator exports a backup
- **THEN** the file includes those collections, a format version, and an export time

### Requirement: Import replaces local data
The system MUST replace local data with a valid backup after the operator confirms. It MUST NOT merge the file with data already stored.

#### Scenario: Restore on another browser
- **GIVEN** a valid backup from another browser
- **WHEN** the operator confirms import
- **THEN** local lots, profiles, batches, bags, sales, and settings match the file

#### Scenario: Cancel leaves data unchanged
- **GIVEN** local data exists
- **WHEN** the operator starts an import and does not confirm
- **THEN** local data is unchanged

### Requirement: Invalid import is rejected
The system MUST reject a file that is not JSON or is missing a backup collection, and MUST leave current data unchanged.

#### Scenario: Missing collections
- **GIVEN** local data exists
- **WHEN** the operator imports a JSON object that has no lots collection
- **THEN** the import fails
- **AND** local data is unchanged

#### Scenario: Older export still imports
- **GIVEN** a backup with the required collections and no format version
- **WHEN** the operator confirms import
- **THEN** the data is restored

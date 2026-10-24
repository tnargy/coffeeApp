# appearance Specification

## Purpose

Let the operator choose a light or mocha dark appearance and keep that choice across visits.

## Requirements

### Requirement: Theme choice
The system SHALL offer a Settings control that selects either the light theme or the mocha dark theme.

#### Scenario: Choose mocha
- **WHEN** the operator selects mocha in Settings
- **THEN** the app uses the mocha dark theme on every page

#### Scenario: Choose light
- **WHEN** the operator selects light in Settings
- **THEN** the app uses the current light theme on every page

### Requirement: Theme persists
The system SHALL store the selected theme and restore it on the next visit.

#### Scenario: Theme survives reload
- **WHEN** the operator selects mocha and later reopens the app
- **THEN** the app is still using the mocha dark theme

### Requirement: Light is the default
When no theme has been saved, the system SHALL use the light theme.

#### Scenario: Fresh settings
- **WHEN** the operator opens the app before choosing a theme
- **THEN** the app uses the light theme

### Requirement: Theme applies without other settings
The system SHALL apply a theme change without requiring the operator to save reserve or bag-size settings.

#### Scenario: Swap theme only
- **WHEN** the operator selects mocha and does not save reserve or bag size
- **THEN** the mocha theme is applied and those other settings stay unchanged

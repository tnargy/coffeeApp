## ADDED Requirements

### Requirement: Prefill log-roast form from URL
When the operator navigates to the log-roast page with recognized query parameters, the system SHALL pre-fill the corresponding form fields. All parameters are optional. Invalid or missing values MUST be ignored. Pre-filled values MUST remain editable before the roast is submitted.

#### Scenario: Prefill from a shareable link
- GIVEN the operator opens `/roast?beans=Guatemala&green=500&charge=176.2&total=14:37&fc=11:57&drop=194.2&dtr=18.2`
- WHEN the log-roast page loads
- THEN the form shows those values
- AND the operator can edit any field before submitting

#### Scenario: Partial or invalid parameters
- GIVEN the operator opens `/roast?charge=176.2&total=not-a-time`
- WHEN the page loads
- THEN charge temperature is pre-filled
- AND total time remains empty
- AND the rest of the form is unchanged

#### Scenario: No parameters
- GIVEN the operator navigates to `/roast` with no query string
- WHEN the page loads
- THEN the form is empty as usual

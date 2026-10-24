# Proposal

## Why

The operator packages sale coffee in one-way-vented bags and personal coffee in valved tins, so the app's rest timer and 24-hour wait no longer fit the workflow. Rest can continue physically without being recorded or enforced in the app.

## What Changes

- Remove rest-start tracking and all rest elapsed-time displays.
- Remove the 24-hour bagging gate so any roast with remaining weight can be packed immediately.
- Remove resting as a batch status and as a dashboard, activity, and batch/lot history event.
- Keep roast, bagging, and sale dates and history.
- Ignore rest timestamps on existing local records and backups; imports remain compatible.
- **BREAKING:** Roasts become available for bagging immediately after logging, and the app no longer records rest timing.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `roasting`: Logging a roast no longer records a rest start.
- `resting-and-packaging`: Remove the minimum-rest requirement and allow bagging as soon as roasted weight is available.
- `dashboard`: Remove resting from dashboard activity and from batch/lot history timelines.

## Impact

Roast batch fields and status, bagging validation and form, dashboard activity, batch/lot history, and compatibility with local data and backup files containing legacy rest timestamps. Roast, bagging, and sale date tracking remains.

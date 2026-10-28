# Proposal: Add Roast Timing Fields

## Why
The current roast profile captures charge temperature, batch size, DTR, and weight loss, but not the absolute times that make a roast reproducible. Total roast time, first-crack time, and drop temperature are the three most useful additional numbers from a HiBean (or any) curve. Adding them as optional fields keeps the required profile small while making history more useful.

## What Changes
- Add three optional fields to roast profiles and the profile snapshot stored on each batch:
  - Total roast time (displayed and entered as mm:ss)
  - First-crack time (displayed and entered as mm:ss from charge)
  - Drop temperature (°C)
- Show the new fields on the log-roast form, profile library, and history views.
- Existing profiles and batches continue to work; the new fields may be left blank.
- No change to inventory math, packing, sales, or required validation.

## Capabilities
### New Capabilities
None

### Modified Capabilities
- roasting

## Impact
Small additive change to the profile data model and UI. Times are stored internally as seconds but always presented and accepted as mm:ss. No migration required beyond the new optional fields. Existing batches keep working with null values for the new fields.

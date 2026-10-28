# Proposal: Roast Form URL Prefill

## Why
Operators often have roast data in a screenshot or external tool (e.g. HiBean). Because the app is local-first with no API, the simplest way to move that data in is a shareable URL that pre-fills the log-roast form. This avoids re-typing charge temp, times, DTR, bean name, and green weight.

## What Changes
- Log-roast page reads optional query parameters on load and pre-fills matching form fields.
- Supported parameters (all optional):
  - `beans` — bean / profile name
  - `green` — green weight charged (g)
  - `charge` — charge temperature (°C)
  - `total` — total roast time (mm:ss)
  - `fc` — first-crack time (mm:ss)
  - `drop` — drop temperature (°C)
  - `dtr` — DTR (%)
- Pre-filled values remain editable before submit.
- No new required fields, no change to persistence or validation rules.

## Capabilities
### New Capabilities
None

### Modified Capabilities
- roasting

## Impact
Tiny additive change to the log-roast page only. Existing direct navigation to `/roast` continues to show an empty form. Compatible with the optional timing fields from the add-roast-timing-fields change.

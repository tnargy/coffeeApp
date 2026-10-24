# Proposal

## Why

The dashboard already shows the post-roast numbers, but it still reads as a dense stack: a heavy page title, duplicate reserve warning, gram-stuffed stat notes, and required secondary lists competing with the scan path in the mockup. Operators need the same information to be easier to scan, not new calculations.

## What Changes

- Refine dashboard spacing, card chrome, type scale, and section alignment toward the existing mockup (`openspec/changes/polish-dashboard/dashboard.jpg`) without adding metrics.
- Show the personal-use reserve warning once, in the right rail, still non-blocking. Remove the duplicate banner.
- Keep stat cards, green-lot progress, activity, P&L, unpaid indicator, quick actions, recent profiles, and the rested/bagged/sold trail. Make profiles and the trail visually secondary so they do not dominate the first screen.
- Shorten stat secondary labels. Keep gram detail available, but not in the primary subtitle.
- Make the JSON export control quieter so it does not compete with the summary.
- Do not add period-over-period deltas or a suggestions engine that invents margin advice.
- Do not change inventory, roast, pack, or sale rules, and do not restyle other pages' forms.
- Assumption: shared navigation and the app serif font stay. The mockup's user chip is out of scope because this app has no accounts.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This is presentation only. Existing dashboard and inventory requirements already require the weights, reserve warning, profiles, activity, trail, and quick actions to be shown. `skip_specs: true` is set because no requirement text changes.

## Impact

- `src/pages/Dashboard.tsx` and dashboard rules in `src/index.css`.
- No data model, repository, or route changes.
- Other pages keep the current form and nav styling.

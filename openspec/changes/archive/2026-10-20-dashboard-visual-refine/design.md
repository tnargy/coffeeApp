# Design

## Context

See proposal.md for why. The dashboard page in `src/pages/Dashboard.tsx` already renders the mockup sections from existing domain helpers (`dashboardSummary`, `pnl`, `unpaidBalance`). Styling is global CSS in `src/index.css`. Shared classes (`.card`, `.stats`, `.bar`, `.topbar`, `.page`) are also used by other routes. The visual target is `openspec/changes/polish-dashboard/dashboard.jpg`.

## Goals / Non-Goals

**Goals:**

- Make the first screen scan in the mockup order: stat cards, inventory and activity, one reserve alert, quick actions, then P&L.
- Keep every required fact on the page: green and roasted weights, bags ready, unpaid total, lot progress, activity, reserve status, profiles, trail, and the three quick-action routes.
- Limit style edits to dashboard-specific classes so other pages keep their current forms and nav.

**Non-Goals:**

- New calculations, period comparisons, or a suggestions engine.
- A user chip, account menu, or topbar redesign.
- Changing the app font family.
- Hiding or relocating history trails off the dashboard.

## Decisions

1. **Scope styles under a dashboard wrapper.** Add a root class on the dashboard stack and put refine rules under that class. Do not change global `.card` padding, `.topbar`, or form styles. Alternative: edit shared classes in place. Rejected because Receive, Roast, Pack, and Sale share them.

2. **One reserve warning, on the rail card.** Move `role="status"` to the existing rail alert and delete the top `.warning` banner. Keep the non-blocking sentence (remaining vs target, does not block roasts). The tablet rule already sets `.dash-rail { order: -1 }` below 980px, so the only warning stays above the inventory list. Alternative: keep both surfaces. Rejected because it is the density the proposal is removing.

3. **Short stat subtitles, grams as a quieter line.** Primary subtitle is the short mockup phrase only ("Total green coffee on hand", "Total roasted coffee", bag-size note, "No balance due" / outstanding count). Gram amounts stay in a third muted line, not concatenated onto the subtitle. Alternative: drop grams. Rejected because the app stores grams and the current page already exposes them.

4. **Demote, do not remove, profiles and the trail.** Leave both sections in the page, below the board, inside a secondary group with less shadow and smaller type. History links stay. Alternative: collapse them behind a disclosure. Rejected because the main specs require those lists to be displayed, not one click away.

5. **Quiet export.** Keep the same download behavior. Render the control as a text button (`.linkish`) in the page head instead of a filled secondary button. Alternative: move it into Settings. Rejected because the control already lives on the dashboard and this change is visual.

6. **No suggestions column and no fake deltas.** The right rail is the reserve card plus quick actions. P&L stays all-time revenue, cost of goods, gross profit, and the already-derived margin, labeled "All recorded sales". Alternative: add the mockup's suggestion card and up/down arrows with placeholder copy. Rejected because those figures are not computed and would look like real advice.

## Risks / Trade-offs

- [Rail-only warning is missed on a short laptop if the rail sits low] → Keep the rail in the first board row, and keep `order: -1` below 980px so tablet widths show it first.
- [Dashboard CSS leaks onto other pages] → New rules are descendants of the dashboard root class. Do not edit shared component classes except where they are already dashboard-only (`.stat-card`, `.dash-board`, `.quick-action`).
- [Secondary sections look removed] → Keep their headings and links; only reduce weight.
- [Mockup still will not match pixel-for-pixel] → Accepted. Shared nav, serif type, and missing suggestion/period widgets stay.

## Migration Plan

No data migration. Rollback is reverting the dashboard page and the dashboard-scoped CSS.

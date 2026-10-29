# Design

## Context

See proposal.md for why. `src/pages/Dashboard.tsx` renders a Recent activity card from `dashboardSummary().activity` and a Quick actions card from `QUICK_ACTIONS` in `src/routes.ts`. Those sit beside the allotment card. Recent profiles, bagged-and-sold, stock cards, green inventory, and P&L are separate sections.

## Goals / Non-Goals

**Goals:**

- Stop rendering those two cards.
- Leave `recentActivity`, `QUICK_ACTIONS`, and the card markup in the codebase so showing them again is a one-line change.

**Non-Goals:**

- Deleting the activity builder, the quick-action list, or their tests.
- Hiding History, recent profiles, bagged-and-sold, or the top navigation.
- Adding a settings toggle.

## Decisions

### Hide with a local flag, do not delete the markup

In `Dashboard.tsx`, gate both cards with one constant, `showActivityAndActions = false`. When it is false, neither section is rendered. The JSX, imports, and data calls stay so flipping the constant restores both cards together.

Alternative: delete the sections. Rejected because the operator asked to keep them built.

Alternative: a settings switch. Rejected because this is a temporary hide, not a user preference.

### Do not stop computing activity

`dashboardSummary` may still include `activity`. Hiding the card does not change history or other summaries. Avoid a domain change unless an unused import must be dropped; if the flag keeps the JSX, the import stays.

## Risks / Trade-offs

- [Unused-looking UI code] → The flag and a short name make the intent obvious. Do not add a comment unless the flag name is unclear.
- [Specs still say the cards are visible until archive] → This change's delta is the new contract. Implementation follows the delta, not the old main-spec sentences.

## Migration Plan

None. Rollback is setting the flag to true.

# Tasks

## 1. Hide the cards

- [x] 1.1 Gate the Recent activity and Quick actions sections in `Dashboard.tsx` with `showActivityAndActions = false`, leaving the markup in place, and verify both headings are rendered only when that flag is true
- [x] 1.2 Keep `QUICK_ACTIONS` and `recentActivity` / `dashboardSummary().activity` in the codebase, and verify a unit test still finds Log Roast, Pack Bags, and Record Sale in `QUICK_ACTIONS` and an activity event for a recorded roast

## 2. Leave the rest of the dashboard

- [x] 2.1 Do not remove stock cards, green inventory, allotment, P&L, recent profiles, bagged-and-sold, or the top navigation, and verify those sections and `APP_ROUTES` entries for `/roast`, `/pack`, `/sale`, and `/history` are still present

## 3. Integration check

- [x] 3.1 Run `npm test`, `npm run lint`, and `npm run typecheck`, and verify all three succeed

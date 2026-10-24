# Tasks

## 1. Dashboard structure

- [x] 1.1 Add a dashboard root class, move `role="status"` onto the rail reserve card, and remove the top warning banner. Verify the page has one status region and still says the shortfall does not block roasts.
- [x] 1.2 Shorten stat subtitles to the mockup phrases and move gram amounts to a quieter line in the same card. Verify the primary subtitle no longer concatenates grams, and the gram text is still rendered.
- [x] 1.3 Place recent profiles and the rested/bagged/sold trail in a secondary group below the board. Verify both headings remain and each row still links to `/history?batch=`.
- [x] 1.4 Render JSON export as a text button in the page head. Verify it still calls the existing download helper and is not a filled button.

## 2. Scoped styling

- [x] 2.1 Add dashboard-root rules for lighter card chrome, stat number size, and section spacing. Verify those rules are descendants of the dashboard root and global `.card`, `.topbar`, and form styles are unchanged.
- [x] 2.2 Keep the rail first below 980px. Verify the existing `order: -1` rule still applies to `.dash-rail` at that breakpoint.

## 3. Integration check

- [x] 3.1 Run `npm test` and confirm the existing dashboard summary and unpaid-sale tests still pass. Verify no domain, route, or sale-field files were edited.

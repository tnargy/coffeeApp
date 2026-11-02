# Design

## Context

See proposal.md for why. The Records sales list in `src/pages/Records.tsx` already prints amount, bag count, date, and appends ` · unpaid` only when `sale.paid === false`. `Sale.notes` and `Sale.paid` are already stored and editable on that page. Domain code treats only `paid === false` as unpaid (`unpaidBalance` in `src/domain/rules.ts`). Profile notes elsewhere render as a paragraph when present.

## Goals / Non-Goals

**Goals:**

- Show an explicit paid or unpaid label on every sales-list row.
- Show notes on that row when `notes` is a non-blank string.

**Non-Goals:**

- Changing Record Sale, the edit form, the dashboard unpaid card, or storage.
- Showing tax, buyer, or a new filter.

## Decisions

### Label both states on the existing summary line

Keep the current summary line and always append ` · paid` or ` · unpaid`. Use `sale.paid === false` for unpaid and everything else for paid, including a missing `paid` field. Do not invent a third "unknown" state.

Alternative: show unpaid only, as today. Rejected because the operator asked to list paid and unpaid.

### Notes on their own line, omitted when blank

When `sale.notes` is a non-empty string after trim, render it in a paragraph under the summary, same pattern as profile notes. Do not append notes to the summary line. Blank or missing notes render nothing.

Alternative: always show a "Notes: none" line. Rejected so empty sales stay as compact as they are now.

### Leave void marking alone

The existing void paragraph stays. Payment and notes are additional lines, not a replacement for the void marker.

## Risks / Trade-offs

- [Long notes stretch a card] → Show the stored text as-is. Do not truncate; notes are short operator reminders.
- [Older sales omit `paid`] → Treat them as paid, matching `unpaidBalance`. No migration.

## Migration Plan

None. Rollback is reverting the sales-list markup in `Records.tsx`.

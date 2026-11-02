# Proposal

## Why

The Records sales list shows amount, bag count, and date, and only appends "unpaid" when a sale is unpaid. Notes are stored and editable, but the operator cannot see them, or a clear paid status, without opening the edit form.

## What Changes

- On the Records page Sales section, each sale lists its payment status as paid or unpaid.
- On that same list, each sale lists its notes when notes are present.
- A sale with no notes does not show an empty notes line.
- A sale with no stored `paid` value is listed as paid, matching the existing rule that only `paid === false` is unpaid.
- Voided sales stay listed and still show payment status and notes, plus the existing void marker.
- Do not change the sale form, edit form, dashboard unpaid card, data model, or how payment and notes are stored.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `sales`: The records sales list must show each sale's notes and an explicit paid or unpaid status.

## Impact

- Sales list markup in `src/pages/Records.tsx`.
- No API, schema, or dependency change. `Sale.notes` and `Sale.paid` already exist.

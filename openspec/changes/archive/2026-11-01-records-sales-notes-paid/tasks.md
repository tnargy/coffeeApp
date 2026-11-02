# Tasks

## 1. Sales list

- [x] 1.1 In the Sales section of `src/pages/Records.tsx`, always append ` · paid` or ` · unpaid` on the existing summary line. Treat only `sale.paid === false` as unpaid. Verify a paid sale, an unpaid sale, and a sale with no `paid` field each show the matching label, and amount, bag count, and date stay on that line.
- [x] 1.2 Under that summary, show `sale.notes` in a paragraph only when the trimmed notes are non-empty. Verify a sale with notes lists them, and a sale with blank or missing notes has no notes paragraph.
- [x] 1.3 Leave the void marker, the sale edit form, Record Sale, and the dashboard unpaid card unchanged. Verify a voided unpaid sale with notes still shows unpaid, its notes, and the existing void reason.

## 2. Integration check

- [x] 2.1 Run `npm test`, `npm run lint`, and `npm run typecheck`, and verify all three succeed.

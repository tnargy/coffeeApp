# Proposal

## Why

One roast is classified entirely as personal use or entirely for sale. The operator often keeps part of a roast and sells the rest, and that split is sometimes known at logging and sometimes only when bagging. Today that requires a second roast, or misclassifying the whole batch.

## What Changes

- One roast keeps two roasted pools, personal and for sale. They sum to the roasted yield. Either pool may be zero, so an all-one-purpose roast still works.
- When logging, the operator sets how much of the yield is personal. The rest is for sale. The default remains all for sale.
- When packing, the operator chooses the purpose of the bags in that pack, even if the roast was logged as one purpose. Only the packed weight moves. Unpacked weight stays in its pool.
- Each bag stores its purpose. Personal bags are not offered for sale and do not count as bags ready.
- The lot allotment counts the green share of roasted weight assigned to personal use, loose or bagged, in proportion to green charged. Fair-to-sell roasted weight is only the for-sale pool, and only when that lot's allotment is covered.
- A roast edit can change the unbagged split. It does not reclassify bags already packed. Voiding a bagging returns that weight to the pool those bags came from.
- Roasts and bags already stored with no pool fields keep their current classification. Older backups still import.
- **BREAKING:** A sale that includes a personal bag is refused. Bags ready no longer includes personal bags. Allotment coverage uses the personal share of a roast, not only roasts classified entirely as internal.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `roasting`: A roast may split its yield between personal use and for sale instead of one classification for the whole batch.
- `resting-and-packaging`: Packing chooses a purpose for the bags and draws that weight from the roast, including from the other pool when the chosen pool is short.
- `sales`: Personal bags cannot be sold.
- `inventory`: Personal charged is the green share of personal roasted weight on a lot, including a split roast.
- `dashboard`: Roasted personal and for-sale figures include both pools of one roast. Bags ready excludes personal bags. Fair to sell uses the for-sale pool.
- `corrections`: Editing the unbagged split does not change packed bags. Voiding a bagging returns weight to that bagging's purpose.
- `backup`: A backup without pool fields still imports, and those roasts and bags keep a single purpose.

## Impact

Log-roast and pack forms, sale bag list, roast edit, dashboard roasted split and bags ready, allotment math, history labels, and backup import of older roasts. No change to rest start, green receipt, or lot reserve editing. Existing all-one-purpose roasts stay valid.

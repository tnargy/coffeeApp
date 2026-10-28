# Design: Roast Form URL Prefill

## Technical Approach
On mount of the log-roast page, read `useSearchParams()` (React Router). If recognized keys are present, parse them and set the corresponding form state. All parameters are optional and ignored when absent or unparsable.

## Key Changes
- **Query parameters**
  | Param   | Maps to              | Format          |
  |---------|----------------------|-----------------|
  | `beans` | profile beans name   | string          |
  | `green` | green weight charged | number (g)      |
  | `charge`| charge temperature   | number (°C)     |
  | `total` | total roast time     | mm:ss           |
  | `fc`    | first-crack time     | mm:ss           |
  | `drop`  | drop temperature     | number (°C)     |
  | `dtr`   | DTR                  | number (%)      |

- **Parsing**
  - Times use the same `parseTime` helper as the timing-fields change (mm:ss → seconds).
  - Invalid values are silently ignored (form stays empty for that field).
- **UI**
  - Pre-filled fields are normal controlled inputs; operator can edit or clear them.
  - No banner or special mode; the form simply arrives pre-populated.
- **Routing**
  - Example: `/roast?beans=Guatemala&green=500&charge=176.2&total=14:37&fc=11:57&drop=194.2&dtr=18.2`

## Out of Scope
- Image upload or OCR inside the app.
- Writing the pre-filled values to IndexedDB before the user submits.
- Deep links that also select a green lot or classification.
- Changing any validation rules.

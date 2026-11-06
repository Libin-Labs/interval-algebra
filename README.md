# @lp-labs/interval-algebra

Independent numeric interval-set operations with explicit open/closed boundaries. Zero runtime or peer dependencies. Useful for scheduling availability, range filters and timeline coverage.

## Install

```sh
npm install @lp-labs/interval-algebra
```

Node 18+ or ES2022 browsers. ESM/CommonJS and declarations included.

## Quick start

```js
import { interval, subtract, measure } from '@lp-labs/interval-algebra';
const available = [interval(9, 17)];
const busy = [interval(12, 13), interval(15, 16)];
const free = subtract(available, busy);
console.log(free.map((value) => [value.start, value.end])); // [[9, 12], [13, 15], [16, 17]]
console.log(measure(free)); // 6
```

CommonJS: `const { interval, subtract } = require('@lp-labs/interval-algebra');`.

## Boundary model

`Interval` is `{ readonly start: number; readonly end: number; readonly startClosed: boolean; readonly endClosed: boolean }`.

`interval(start, end, options?)` creates a frozen value. Defaults are `[start,end)`: inclusive finite start, exclusive end. Infinite start defaults open. Specify `{ startClosed, endClosed }` for other boundary combinations.

- Endpoints must be numeric, non-NaN and ordered.
- Start may be negative infinity, end may be positive infinity; infinite endpoints must be open.
- `[x,x]` is a singleton. Other equal-endpoint combinations are empty.
- Inputs represent intervals over real-valued JavaScript numbers, not discrete integer sets. There is no epsilon tolerance or automatic endpoint rounding.
- Dates must be converted to numeric timestamps in consistent units. This package does not interpret calendars, time zones or daylight saving.

## API reference

Runtime exports: `interval`, `normalize`, `contains`, `union`, `intersect`, `subtract`, `complement`, `measure`.

Type export: `Interval`.

| API | Behavior |
|---|---|
| `normalize(intervals)` | Validate, copy, sort and merge overlapping/continuously touching intervals; remove empty intervals. |
| `contains(interval, point)` | Test a finite numeric point against exact boundary rules. |
| `union(left, right)` | Normalized union of two sets. |
| `intersect(left, right)` | Normalized intersection, including singleton contacts when both sides include the point. |
| `subtract(left, right)` | Normalized points in left but not right. |
| `complement(values, universe)` | Subtract values from one explicit universe interval. |
| `measure(values)` | Sum lengths after normalization; singletons have zero measure, unbounded coverage yields Infinity. |

Set functions take readonly arrays and return new arrays of frozen intervals without modifying inputs. For large inputs, normalize once in your application when possible; public operations defensively normalize again.

```js
import { interval, intersect, complement } from '@lp-labs/interval-algebra';
const a = interval(0, 1, { endClosed: true });
const b = interval(1, 2, { endClosed: true });
console.log(intersect([a], [b])); // singleton [1,1]
const outside = complement([a], interval(-Infinity, Infinity));
// (-Infinity,0) and (1,Infinity)
```

Touching intervals merge only if at least one includes their shared endpoint. `(0,1)` plus `(1,2)` retains the excluded point and remains two intervals. Subtraction flips removed endpoint inclusion precisely.

## Customization, performance and errors

Choose units, convert domain values and decide rounding before calling this library. Use explicit universe bounds for complements; no application-wide domain is assumed.

Normalization is O(n log n). Intersection scans normalized inputs; subtraction walks candidate overlaps. Memory scales with input/output intervals. No interval-count cap is imposed: bound untrusted workloads yourself.

Malformed arrays/points throw TypeError; invalid interval bounds/flags throw RangeError. Forged interval objects are revalidated. Numeric length calculations may overflow to Infinity, and ordinary floating-point precision still applies. There are no mutable indexes, calendar recurrence rules, persistence, sibling dependencies or UI components.

The generated boundary regression tests verify pointwise union/intersection/subtraction semantics; they are not a formal mathematical proof or a performance certification.

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.

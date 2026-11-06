import {
  interval,
  normalize,
  union,
  intersect,
  subtract,
  complement,
  measure,
  contains,
} from '@lp-labs/interval-algebra';
import type { Interval } from '@lp-labs/interval-algebra';
const values: Interval[] = normalize([interval(0, 10)]);
const result: Interval[] = subtract(values, [interval(2, 4)]);
union(result, intersect(values, result));
complement(values, interval(-Infinity, Infinity));
const size: number = measure(result);
const inside: boolean = contains(values[0]!, 1);
void size;
void inside;
// @ts-expect-error numeric endpoints only
interval('0', 1);
// @ts-expect-error immutable bounds
values[0]!.start = 2;

export interface Interval {
  readonly start: number;
  readonly end: number;
  readonly startClosed: boolean;
  readonly endClosed: boolean;
}
export function interval(
  start: number,
  end: number,
  options: { startClosed?: boolean; endClosed?: boolean } = {},
): Interval {
  const startClosed = options.startClosed ?? Number.isFinite(start);
  const endClosed = options.endClosed ?? false;
  if (
    typeof start !== 'number' ||
    typeof end !== 'number' ||
    Number.isNaN(start) ||
    Number.isNaN(end) ||
    start > end ||
    start === Infinity ||
    end === -Infinity ||
    typeof startClosed !== 'boolean' ||
    typeof endClosed !== 'boolean' ||
    (start === -Infinity && startClosed) ||
    (end === Infinity && endClosed)
  ) {
    throw new RangeError(
      'Invalid interval bounds or boundary flags; infinite endpoints must be open.',
    );
  }
  return Object.freeze({ start, end, startClosed, endClosed });
}
function checked(value: Interval): Interval {
  if (!value || typeof value !== 'object') throw new TypeError('Expected an interval.');
  return interval(value.start, value.end, {
    startClosed: value.startClosed,
    endClosed: value.endClosed,
  });
}
function empty(value: Interval): boolean {
  return value.start === value.end && !(value.startClosed && value.endClosed);
}
function lower(a: Interval, b: Interval): number {
  return a.start < b.start
    ? -1
    : a.start > b.start
      ? 1
      : Number(b.startClosed) - Number(a.startClosed);
}
export function normalize(values: readonly Interval[]): Interval[] {
  if (!Array.isArray(values)) throw new TypeError('Expected an array of intervals.');
  const sorted = values
    .map(checked)
    .filter((value) => !empty(value))
    .sort(lower);
  const result: Interval[] = [];
  for (const value of sorted) {
    const previous = result[result.length - 1];
    if (
      !previous ||
      value.start > previous.end ||
      (value.start === previous.end && !value.startClosed && !previous.endClosed)
    ) {
      result.push(value);
      continue;
    }
    const end = Math.max(previous.end, value.end);
    result[result.length - 1] = interval(previous.start, end, {
      startClosed: previous.startClosed,
      endClosed:
        previous.end === value.end
          ? previous.endClosed || value.endClosed
          : previous.end > value.end
            ? previous.endClosed
            : value.endClosed,
    });
  }
  return result;
}
export function contains(value: Interval, point: number): boolean {
  const item = checked(value);
  if (typeof point !== 'number' || !Number.isFinite(point))
    throw new TypeError('point must be a finite number.');
  return (
    (point > item.start || (point === item.start && item.startClosed)) &&
    (point < item.end || (point === item.end && item.endClosed))
  );
}
function overlap(a: Interval, b: Interval): Interval | undefined {
  const start = Math.max(a.start, b.start),
    end = Math.min(a.end, b.end);
  if (start > end) return;
  const startClosed =
    a.start === b.start
      ? a.startClosed && b.startClosed
      : a.start > b.start
        ? a.startClosed
        : b.startClosed;
  const endClosed =
    a.end === b.end ? a.endClosed && b.endClosed : a.end < b.end ? a.endClosed : b.endClosed;
  const value = interval(start, end, { startClosed, endClosed });
  return empty(value) ? undefined : value;
}
export function union(left: readonly Interval[], right: readonly Interval[]): Interval[] {
  return normalize([...normalize(left), ...normalize(right)]);
}
export function intersect(left: readonly Interval[], right: readonly Interval[]): Interval[] {
  const a = normalize(left),
    b = normalize(right),
    result: Interval[] = [];
  let i = 0,
    j = 0;
  while (i < a.length && j < b.length) {
    const first = a[i]!,
      second = b[j]!,
      value = overlap(first, second);
    if (value) result.push(value);
    if (
      first.end < second.end ||
      (first.end === second.end && !first.endClosed && second.endClosed)
    )
      i++;
    else j++;
  }
  return normalize(result);
}
export function subtract(left: readonly Interval[], right: readonly Interval[]): Interval[] {
  const a = normalize(left),
    b = normalize(right),
    result: Interval[] = [];
  let j = 0;
  for (const original of a) {
    let remaining: Interval | undefined = original;
    while (
      j < b.length &&
      (b[j]!.end < original.start ||
        (b[j]!.end === original.start && !(b[j]!.endClosed && original.startClosed)))
    )
      j++;
    for (let k = j; remaining && k < b.length; k++) {
      const cut = b[k]!;
      if (
        cut.start > remaining.end ||
        (cut.start === remaining.end && !(cut.startClosed && remaining.endClosed))
      )
        break;
      const common = overlap(remaining, cut);
      if (!common) continue;
      if (
        remaining.start < common.start ||
        (remaining.start === common.start && remaining.startClosed && !common.startClosed)
      ) {
        const head = interval(remaining.start, common.start, {
          startClosed: remaining.startClosed,
          endClosed: !common.startClosed,
        });
        if (!empty(head)) result.push(head);
      }
      if (
        common.end < remaining.end ||
        (common.end === remaining.end && remaining.endClosed && !common.endClosed)
      ) {
        remaining = interval(common.end, remaining.end, {
          startClosed: !common.endClosed,
          endClosed: remaining.endClosed,
        });
      } else remaining = undefined;
    }
    if (remaining) result.push(remaining);
  }
  return normalize(result);
}
export function complement(values: readonly Interval[], universe: Interval): Interval[] {
  return subtract([checked(universe)], values);
}
export function measure(values: readonly Interval[]): number {
  return normalize(values).reduce((sum, value) => sum + (value.end - value.start), 0);
}

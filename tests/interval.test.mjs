import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import {
  interval,
  normalize,
  union,
  intersect,
  subtract,
  complement,
  measure,
  contains,
} from '../dist/esm/index.js';
const closed = (a, b) => interval(a, b, { endClosed: true });
test('default intervals are half-open and immutable', () => {
  const value = interval(1, 3);
  assert.equal(contains(value, 1), true);
  assert.equal(contains(value, 3), false);
  assert.equal(Object.isFrozen(value), true);
  assert.deepEqual(normalize([interval(1, 1)]), []);
  assert.deepEqual(normalize([closed(1, 1)]), [closed(1, 1)]);
});
test('normalization merges touching coverage but preserves excluded shared points', () => {
  assert.deepEqual(normalize([interval(2, 4), interval(0, 2)]), [interval(0, 4)]);
  assert.equal(normalize([interval(0, 2), interval(2, 4, { startClosed: false })]).length, 2);
  assert.deepEqual(normalize([closed(0, 2), interval(2, 4, { startClosed: false })]), [
    interval(0, 4),
  ]);
});
test('intersection respects singleton endpoints and open boundaries', () => {
  assert.deepEqual(intersect([closed(0, 1)], [closed(1, 2)]), [closed(1, 1)]);
  assert.deepEqual(intersect([interval(0, 1)], [interval(1, 2)]), []);
});
test('subtraction splits ranges and toggles removed endpoint inclusivity', () => {
  assert.deepEqual(subtract([closed(0, 10)], [closed(3, 7)]), [
    interval(0, 3),
    interval(7, 10, { startClosed: false, endClosed: true }),
  ]);
  assert.deepEqual(subtract([closed(0, 10)], [interval(0, 10, { startClosed: false })]), [
    closed(0, 0),
    closed(10, 10),
  ]);
  assert.deepEqual(subtract([closed(1, 1)], [closed(0, 2)]), []);
});
test('infinite bounds support complements without including infinity', () => {
  const all = interval(-Infinity, Infinity);
  assert.deepEqual(complement([closed(0, 1)], all), [
    interval(-Infinity, 0),
    interval(1, Infinity, { startClosed: false }),
  ]);
  assert.equal(measure([all]), Infinity);
  assert.equal(measure([closed(0, 0)]), 0);
});
test('measure avoids double counting and empty inputs remain empty', () => {
  assert.equal(measure([interval(0, 5), interval(2, 10)]), 10);
  assert.deepEqual(union([], []), []);
  assert.deepEqual(intersect([], [closed(0, 1)]), []);
  assert.deepEqual(subtract([closed(0, 1)], []), [closed(0, 1)]);
  assert.equal(measure([interval(0, 1e308), closed(1.5e308, 1.5e308)]), 1e308);
});
test('multi-range differences preserve all coverage and gaps', () => {
  const left = [closed(-2, 1), interval(2, 5), closed(6, 8)];
  const right = [interval(-1, 0), closed(1, 2), interval(3, 7, { startClosed: false })];
  const result = subtract(left, right);
  for (let point = -3; point <= 9; point += 0.25) {
    assert.equal(
      result.some((value) => contains(value, point)),
      left.some((value) => contains(value, point)) &&
        !right.some((value) => contains(value, point)),
    );
  }
});
test('invalid bounds, flags and membership points fail explicitly', () => {
  for (const [a, b] of [
    [NaN, 1],
    [2, 1],
    [Infinity, Infinity],
    [-Infinity, -Infinity],
    ['1', 2],
  ])
    assert.throws(() => interval(a, b));
  assert.throws(() => interval(-Infinity, 1, { startClosed: true }), RangeError);
  assert.throws(() => interval(0, Infinity, { endClosed: true }), RangeError);
  assert.throws(() => contains(interval(0, 1), Infinity), TypeError);
});
test('generated set operations agree with pointwise membership', () => {
  const cases = [];
  for (let start = -2; start <= 2; start++)
    for (let end = start; end <= 2; end++) {
      for (const startClosed of [false, true])
        for (const endClosed of [false, true]) {
          cases.push(interval(start, end, { startClosed, endClosed }));
        }
    }
  const member = (values, point) => values.some((value) => contains(value, point));
  for (const a of cases)
    for (const b of cases) {
      const u = union([a], [b]),
        i = intersect([a], [b]),
        s = subtract([a], [b]);
      for (let point = -2.5; point <= 2.5; point += 0.5) {
        const left = contains(a, point),
          right = contains(b, point);
        assert.equal(member(u, point), left || right);
        assert.equal(member(i, point), left && right);
        assert.equal(member(s, point), left && !right);
      }
    }
});
test('normalized inputs are not mutated', () => {
  const values = Object.freeze([Object.freeze(closed(2, 4)), Object.freeze(closed(0, 3))]);
  assert.deepEqual(normalize(values), [closed(0, 4)]);
  assert.equal(values[0].start, 2);
});
test('CommonJS supports the same algebra', () => {
  const cjs = createRequire(import.meta.url)('../dist/cjs/index.js');
  assert.equal(cjs.measure([cjs.interval(0, 5)]), 5);
});

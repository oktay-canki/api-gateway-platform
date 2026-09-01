import { describe, expect, it } from 'vitest';

import { computeSpecificity } from '../../../src/route-matching/compute-specificity.js';

describe('computeSpecificity', () => {
  it('scores static segments as most specific', () => {
    expect(computeSpecificity('/users/profile')).toBe(200);
  });

  it('scores named parameters as less specific than static segments', () => {
    expect(computeSpecificity('/users/:id')).toBe(110);
  });

  it('scores wildcards as least specific', () => {
    expect(computeSpecificity('/users/*')).toBe(101);
  });

  it('combines scores across different segment types', () => {
    expect(computeSpecificity('/users/:id/posts/*')).toBe(211);
  });
});

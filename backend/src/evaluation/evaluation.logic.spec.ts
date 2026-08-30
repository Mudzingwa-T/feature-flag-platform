import { bucketOf, resolveFlag, FlagConfig } from './evaluation.logic';

describe('bucketOf', () => {
  it('is deterministic for the same seed', () => {
    expect(bucketOf('new-checkout:user-1')).toBe(bucketOf('new-checkout:user-1'));
  });

  it('produces values within [0, 100)', () => {
    for (let i = 0; i < 1000; i++) {
      const b = bucketOf(`flag:${i}`);
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThan(100);
    }
  });

  it('spreads users roughly uniformly (within tolerance)', () => {
    let inBucket = 0;
    const N = 10000;
    for (let i = 0; i < N; i++) if (bucketOf(`dark-mode:user-${i}`) < 30) inBucket++;
    const ratio = inBucket / N;
    expect(ratio).toBeGreaterThan(0.26);
    expect(ratio).toBeLessThan(0.34);
  });

  it('decorrelates the same user across different flags', () => {
    const a = bucketOf('flag-a:user-42');
    const b = bucketOf('flag-b:user-42');
    expect(a).not.toBe(b); // not guaranteed in general, but true for this pair
  });
});

describe('resolveFlag', () => {
  const base: FlagConfig = {
    key: 'new-checkout',
    enabled: true,
    strategy: 'PERCENTAGE_ROLLOUT',
    rolloutPercentage: 20,
    constraints: { includeCities: ['Harare'], excludeInternal: true },
  };

  it('returns FLAG_DISABLED when the flag is off, regardless of strategy', () => {
    expect(resolveFlag({ ...base, enabled: false }, { userId: 'u1' })).toEqual({
      enabled: false,
      reason: 'FLAG_DISABLED',
    });
  });

  it('BOOLEAN strategy is on when enabled', () => {
    expect(resolveFlag({ ...base, strategy: 'BOOLEAN' }, {})).toEqual({
      enabled: true,
      reason: 'BOOLEAN_ENABLED',
    });
  });

  it('excludes internal staff before bucketing', () => {
    const r = resolveFlag(base, { userId: 'u1', attributes: { city: 'Harare', internal: true } });
    expect(r).toEqual({ enabled: false, reason: 'EXCLUDED_INTERNAL' });
  });

  it('excludes users outside the allowed cities', () => {
    const r = resolveFlag(base, { userId: 'u1', attributes: { city: 'Bulawayo' } });
    expect(r).toEqual({ enabled: false, reason: 'CITY_NOT_INCLUDED' });
  });

  it('0% rollout enables nobody; 100% enables everybody (constraints permitting)', () => {
    const all = { ...base, constraints: null, rolloutPercentage: 100 };
    const none = { ...base, constraints: null, rolloutPercentage: 0 };
    for (let i = 0; i < 200; i++) {
      expect(resolveFlag(all, { userId: `u${i}` }).enabled).toBe(true);
      expect(resolveFlag(none, { userId: `u${i}` }).enabled).toBe(false);
    }
  });

  it('keeps a given user consistently in/out across repeated evaluations', () => {
    const ctx = { userId: 'stable-user', attributes: { city: 'Harare' } };
    const first = resolveFlag(base, ctx);
    for (let i = 0; i < 50; i++) expect(resolveFlag(base, ctx)).toEqual(first);
  });
});

import { buildConstraints } from './flag-rules';

describe('buildConstraints', () => {
  it('returns null when there is nothing to constrain', () => {
    expect(buildConstraints('', false)).toBeNull();
    expect(buildConstraints('   ', false)).toBeNull();
  });

  it('parses a comma-separated city list, trimming and dropping empties', () => {
    expect(buildConstraints('Harare, Bulawayo', false)).toEqual({
      includeCities: ['Harare', 'Bulawayo'],
    });
    expect(buildConstraints('Harare, , Gweru,', false)).toEqual({
      includeCities: ['Harare', 'Gweru'],
    });
  });

  it('includes excludeInternal only when true', () => {
    expect(buildConstraints('', true)).toEqual({ excludeInternal: true });
    expect(buildConstraints('Harare', true)).toEqual({
      includeCities: ['Harare'],
      excludeInternal: true,
    });
  });
});

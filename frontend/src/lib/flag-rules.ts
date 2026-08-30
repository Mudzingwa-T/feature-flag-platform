// Pure helpers for turning form inputs into the constraints shape the API expects.
// Kept dependency-free so they can be unit-tested in isolation and reused.

export interface Constraints {
  includeCities?: string[];
  excludeInternal?: boolean;
}

/**
 * Build the constraints object from raw form inputs.
 * Returns null when there is nothing to constrain, so callers can omit the field
 * rather than send an empty object.
 */
export function buildConstraints(citiesInput: string, excludeInternal: boolean): Constraints | null {
  const includeCities = citiesInput
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);

  const c: Constraints = {};
  if (includeCities.length) c.includeCities = includeCities;
  if (excludeInternal) c.excludeInternal = true;

  return Object.keys(c).length ? c : null;
}

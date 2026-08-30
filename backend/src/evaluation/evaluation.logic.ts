import { createHash } from 'crypto';

export type Strategy = 'BOOLEAN' | 'PERCENTAGE_ROLLOUT';

export interface FlagConfig {
  key: string;
  enabled: boolean;
  strategy: Strategy;
  rolloutPercentage: number;
  constraints?: {
    includeCities?: string[];
    excludeInternal?: boolean;
  } | null;
}

export interface UserContext {
  userId?: string;
  attributes?: {
    city?: string;
    internal?: boolean;
    [k: string]: unknown;
  };
}

export type EvalReason =
  | 'FLAG_DISABLED'
  | 'BOOLEAN_ENABLED'
  | 'EXCLUDED_INTERNAL'
  | 'CITY_NOT_INCLUDED'
  | 'IN_ROLLOUT'
  | 'OUT_OF_ROLLOUT';

export interface EvalResult {
  enabled: boolean;
  reason: EvalReason;
  bucket?: number;
}

/**
 * Map an arbitrary string to a stable bucket in [0, 100).
 *
 * The same input always yields the same bucket, which is the whole point: a user
 * must stay consistently inside or outside a rollout across requests and across
 * instances. We hash `${flagKey}:${userId}` so the same user lands in different
 * buckets for different flags (no correlation between unrelated rollouts).
 *
 * SHA-256 gives a well-distributed value; we take the first 4 bytes and mod 100.
 */
export function bucketOf(seed: string): number {
  const hex = createHash('sha256').update(seed).digest('hex').slice(0, 8);
  return parseInt(hex, 16) % 100;
}

const lc = (s: string) => s.trim().toLowerCase();

/** Pure evaluation: given a flag config and a user context, decide the result. */
export function resolveFlag(flag: FlagConfig, ctx: UserContext): EvalResult {
  if (!flag.enabled) return { enabled: false, reason: 'FLAG_DISABLED' };

  if (flag.strategy === 'BOOLEAN') return { enabled: true, reason: 'BOOLEAN_ENABLED' };

  // PERCENTAGE_ROLLOUT
  const c = flag.constraints ?? {};

  if (c.excludeInternal && ctx.attributes?.internal === true) {
    return { enabled: false, reason: 'EXCLUDED_INTERNAL' };
  }

  if (Array.isArray(c.includeCities) && c.includeCities.length > 0) {
    const city = ctx.attributes?.city ? lc(String(ctx.attributes.city)) : undefined;
    const allowed = c.includeCities.map(lc);
    if (!city || !allowed.includes(city)) {
      return { enabled: false, reason: 'CITY_NOT_INCLUDED' };
    }
  }

  const bucket = bucketOf(`${flag.key}:${ctx.userId ?? 'anonymous'}`);
  const inRollout = bucket < flag.rolloutPercentage;
  return { enabled: inRollout, reason: inRollout ? 'IN_ROLLOUT' : 'OUT_OF_ROLLOUT', bucket };
}

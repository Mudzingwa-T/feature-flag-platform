import { Injectable } from '@nestjs/common';
import { RuleProvider } from './rule-provider.interface';

// Common Zimbabwean cities we can recognise offline. Extendable.
const KNOWN_CITIES = ['harare', 'bulawayo', 'gweru', 'mutare', 'masvingo', 'kwekwe', 'chitungwiza', 'victoria falls', 'kadoma'];

/**
 * Deterministic, dependency-free provider. It parses a rollout request with simple
 * heuristics. It exists so the whole feature works with NO API key and NO network,
 * and it doubles as the graceful fallback when a real provider is unavailable.
 */
@Injectable()
export class MockRuleProvider implements RuleProvider {
  readonly name = 'mock-heuristic';

  async propose(prompt: string): Promise<unknown> {
    const text = prompt.toLowerCase();

    const pctMatch = text.match(/(\d{1,3})\s*%/);
    const rolloutPercentage = pctMatch ? Math.min(100, parseInt(pctMatch[1], 10)) : 0;
    const strategy = pctMatch ? 'PERCENTAGE_ROLLOUT' : 'BOOLEAN';

    const includeCities = KNOWN_CITIES
      .filter((c) => text.includes(c))
      .map((c) => c.replace(/\b\w/g, (m) => m.toUpperCase()));

    const excludeInternal = /internal/.test(text) && /(except|exclude|not|but not|no )/.test(text);

    const enabled = !/(disable|turn off|switch off)/.test(text);

    const constraints: Record<string, unknown> = {};
    if (includeCities.length) constraints.includeCities = includeCities;
    if (excludeInternal) constraints.excludeInternal = true;

    return {
      enabled,
      strategy,
      rolloutPercentage,
      ...(Object.keys(constraints).length ? { constraints } : {}),
    };
  }
}

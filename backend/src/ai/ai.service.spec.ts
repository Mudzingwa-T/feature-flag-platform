import { AiService } from './ai.service';
import { MockRuleProvider } from './providers/mock-rule.provider';
import { RuleProvider } from './providers/rule-provider.interface';

// A stub primary provider whose behaviour we control per-test.
class StubProvider implements RuleProvider {
  readonly name = 'stub-llm';
  constructor(private impl: (p: string) => Promise<unknown>) {}
  propose(prompt: string) {
    return this.impl(prompt);
  }
}

describe('AiService', () => {
  const fallback = new MockRuleProvider();

  it('returns a validated proposal from the primary provider when output is well-formed', async () => {
    const primary = new StubProvider(async () => ({
      enabled: true,
      strategy: 'PERCENTAGE_ROLLOUT',
      rolloutPercentage: 20,
      constraints: { includeCities: ['Harare'], excludeInternal: true },
    }));
    const service = new AiService(primary, fallback);

    const res = await service.propose({ prompt: 'enable for 20% in Harare except internal' });

    expect(res.provider).toBe('stub-llm');
    expect(res.warnings).toHaveLength(0);
    expect(res.proposal.strategy).toBe('PERCENTAGE_ROLLOUT');
    expect(res.proposal.rolloutPercentage).toBe(20);
    expect(res.proposal.constraints?.excludeInternal).toBe(true);
  });

  it('falls back to the offline heuristic when the provider throws', async () => {
    const primary = new StubProvider(async () => {
      throw new Error('429 rate limited');
    });
    const service = new AiService(primary, fallback);

    const res = await service.propose({ prompt: 'roll out to 35% of users in Bulawayo' });

    expect(res.provider).toBe('mock-heuristic');
    expect(res.warnings.join(' ')).toMatch(/unavailable/i);
    expect(res.proposal.rolloutPercentage).toBe(35);
    expect(res.proposal.constraints?.includeCities).toContain('Bulawayo');
  });

  it('never surfaces invalid model output — it regenerates deterministically', async () => {
    const primary = new StubProvider(async () => ({
      enabled: true,
      strategy: 'PERCENTAGE_ROLLOUT',
      rolloutPercentage: 150, // out of range -> must fail validation
    }));
    const service = new AiService(primary, fallback);

    const res = await service.propose({ prompt: 'enable for 10% of users' });

    expect(res.provider).toBe('mock-heuristic');
    expect(res.warnings.join(' ')).toMatch(/failed validation/i);
    expect(res.proposal.rolloutPercentage).toBeLessThanOrEqual(100);
  });
});

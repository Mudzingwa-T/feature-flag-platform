import { Inject, Injectable, Logger, UnprocessableEntityException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PRIMARY_RULE_PROVIDER, RuleProvider } from './providers/rule-provider.interface';
import { MockRuleProvider } from './providers/mock-rule.provider';
import { RuleProposalDto } from './dto/rule-proposal.dto';
import { GenerateRuleDto } from './dto/generate-rule.dto';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    @Inject(PRIMARY_RULE_PROVIDER) private readonly primary: RuleProvider,
    private readonly fallback: MockRuleProvider,
  ) {}

  /**
   * Produce a PROPOSED rule from natural language. This never persists anything.
   * Order of operations:
   *   1. Ask the primary provider. If it fails, fall back to the offline heuristic.
   *   2. Validate the raw output against RuleProposalDto (the deterministic gate).
   *   3. If validation fails, regenerate with the heuristic and validate again.
   *   4. If it still fails, refuse — we never surface an invalid rule.
   */
  async propose(dto: GenerateRuleDto) {
    const warnings: string[] = [];
    let provider = this.primary.name;
    let raw: unknown;

    try {
      raw = await this.primary.propose(dto.prompt);
    } catch (e: any) {
      warnings.push(`AI provider '${this.primary.name}' unavailable (${e.message}); used offline heuristic.`);
      provider = this.fallback.name;
      raw = await this.fallback.propose(dto.prompt);
    }

    let proposal = await this.validate(raw);
    if (!proposal) {
      warnings.push('AI output failed validation; regenerated with the offline heuristic.');
      provider = this.fallback.name;
      raw = await this.fallback.propose(dto.prompt);
      proposal = await this.validate(raw);
    }
    if (!proposal) {
      throw new UnprocessableEntityException('Could not produce a valid rule proposal from that request.');
    }

    return {
      provider,
      proposal,
      raw, // shown in the UI so a reviewer sees exactly what the model returned
      warnings,
      note: 'Proposal only. Review the structured rule and save it explicitly to apply it.',
    };
  }

  private async validate(raw: unknown): Promise<RuleProposalDto | null> {
    if (!raw || typeof raw !== 'object') return null;
    const dto = plainToInstance(RuleProposalDto, raw, { enableImplicitConversion: true });
    const errors = await validate(dto, { whitelist: true });
    if (errors.length) return null;
    if (dto.strategy === 'PERCENTAGE_ROLLOUT' && (dto.rolloutPercentage == null || dto.rolloutPercentage <= 0)) {
      return null;
    }
    return dto;
  }
}

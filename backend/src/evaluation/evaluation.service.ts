import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { resolveFlag, FlagConfig, UserContext } from './evaluation.logic';

@Injectable()
export class EvaluationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  /**
   * Resolve a flag for a user context.
   *
   * Hot-path shape: read the flag's config from cache (Redis) and, on a miss,
   * from Postgres, then cache it. The per-user bucket decision is pure CPU
   * (a hash), so evaluation stays fast and needs no per-user storage.
   */
  async evaluate(flagKey: string, environmentKey: string, context: UserContext = {}) {
    const cacheKey = CacheService.flagKey(environmentKey, flagKey);

    let config = await this.cache.get<FlagConfig>(cacheKey);
    if (!config) {
      const flag = await this.prisma.flag.findFirst({
        where: { key: flagKey, environment: { key: environmentKey } },
      });
      if (!flag) throw new NotFoundException(`Flag '${flagKey}' not found in '${environmentKey}'`);
      config = {
        key: flag.key,
        enabled: flag.enabled,
        strategy: flag.strategy as FlagConfig['strategy'],
        rolloutPercentage: flag.rolloutPercentage,
        constraints: (flag.constraints as FlagConfig['constraints']) ?? null,
      };
      await this.cache.set(cacheKey, config);
    }

    const result = resolveFlag(config, context);
    return {
      flagKey,
      environmentKey,
      ...result,
      evaluatedAt: new Date().toISOString(),
    };
  }
}

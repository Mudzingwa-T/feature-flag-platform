import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Strategy } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { AuditService } from '../audit/audit.service';
import { CreateFlagDto } from './dto/create-flag.dto';
import { UpdateFlagDto } from './dto/update-flag.dto';
import { QueryFlagsDto } from './dto/query-flags.dto';

// The subset of a flag we record in the audit trail (drops noisy timestamps).
function snapshot(flag: any) {
  return {
    enabled: flag.enabled,
    strategy: flag.strategy,
    rolloutPercentage: flag.rolloutPercentage,
    constraints: flag.constraints ?? null,
    description: flag.description ?? null,
    version: flag.version,
  };
}

@Injectable()
export class FlagsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly audit: AuditService,
  ) {}

  private async environmentOrThrow(key: string) {
    const env = await this.prisma.environment.findUnique({ where: { key } });
    if (!env) throw new BadRequestException(`Unknown environment '${key}'`);
    return env;
  }

  async create(dto: CreateFlagDto, actor: string) {
    const env = await this.environmentOrThrow(dto.environmentKey);

    if (dto.strategy === Strategy.PERCENTAGE_ROLLOUT && dto.rolloutPercentage == null) {
      throw new BadRequestException('rolloutPercentage is required for PERCENTAGE_ROLLOUT');
    }

    try {
      const flag = await this.prisma.flag.create({
        data: {
          key: dto.key,
          description: dto.description,
          enabled: dto.enabled ?? false,
          strategy: dto.strategy ?? Strategy.BOOLEAN,
          rolloutPercentage: dto.rolloutPercentage ?? 0,
          constraints: (dto.constraints ?? undefined) as any,
          environmentId: env.id,
          updatedBy: actor,
        },
      });

      await this.audit.record({
        actor,
        action: 'CREATE',
        flagKey: flag.key,
        environmentKey: env.key,
        previousValue: null,
        newValue: snapshot(flag),
      });
      await this.cache.del(CacheService.flagKey(env.key, flag.key));
      return this.withEnvironmentKey(flag, env.key);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException(`Flag '${dto.key}' already exists in '${env.key}'`);
      }
      throw e;
    }
  }

  async findAll(query: QueryFlagsDto) {
    const { page, pageSize } = query;
    const where: Prisma.FlagWhereInput = query.environment
      ? { environment: { key: query.environment } }
      : {};
    const [rows, total] = await Promise.all([
      this.prisma.flag.findMany({
        where,
        include: { environment: true },
        orderBy: [{ key: 'asc' }, { environment: { key: 'asc' } }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.flag.count({ where }),
    ]);
    return {
      items: rows.map((f) => this.withEnvironmentKey(f, f.environment.key)),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string) {
    const flag = await this.prisma.flag.findUnique({ where: { id }, include: { environment: true } });
    if (!flag) throw new NotFoundException('Flag not found');
    return this.withEnvironmentKey(flag, flag.environment.key);
  }

  /**
   * Optimistic-concurrency update.
   *
   * We scope the UPDATE to the id AND the version the client last saw. If another
   * writer changed the row in the meantime the WHERE matches nothing, Prisma raises
   * P2025, and we translate that into a 409 so the client can reload and retry.
   * On success the version is incremented in the same statement.
   */
  async update(id: string, dto: UpdateFlagDto, actor: string) {
    const current = await this.prisma.flag.findUnique({ where: { id }, include: { environment: true } });
    if (!current) throw new NotFoundException('Flag not found');

    if (current.strategy === Strategy.PERCENTAGE_ROLLOUT || dto.strategy === Strategy.PERCENTAGE_ROLLOUT) {
      const pct = dto.rolloutPercentage ?? current.rolloutPercentage;
      if (pct == null) throw new BadRequestException('rolloutPercentage is required for PERCENTAGE_ROLLOUT');
    }

    const data: Prisma.FlagUpdateInput = {
      version: { increment: 1 },
      updatedBy: actor,
    };
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.enabled !== undefined) data.enabled = dto.enabled;
    if (dto.strategy !== undefined) data.strategy = dto.strategy;
    if (dto.rolloutPercentage !== undefined) data.rolloutPercentage = dto.rolloutPercentage;
    if (dto.constraints !== undefined) data.constraints = (dto.constraints ?? Prisma.JsonNull) as any;

    try {
      const updated = await this.prisma.flag.update({
        where: { id, version: dto.expectedVersion },
        data,
      });

      await this.audit.record({
        actor,
        action: 'UPDATE',
        flagKey: updated.key,
        environmentKey: current.environment.key,
        previousValue: snapshot(current),
        newValue: snapshot(updated),
      });
      await this.cache.del(CacheService.flagKey(current.environment.key, updated.key));
      return this.withEnvironmentKey(updated, current.environment.key);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new ConflictException(
          `Stale update: flag was modified by someone else. Expected version ${dto.expectedVersion}, current is ${current.version}. Reload and try again.`,
        );
      }
      throw e;
    }
  }

  async remove(id: string, actor: string) {
    const flag = await this.prisma.flag.findUnique({ where: { id }, include: { environment: true } });
    if (!flag) throw new NotFoundException('Flag not found');

    await this.prisma.flag.delete({ where: { id } });
    await this.audit.record({
      actor,
      action: 'DELETE',
      flagKey: flag.key,
      environmentKey: flag.environment.key,
      previousValue: snapshot(flag),
      newValue: null,
    });
    await this.cache.del(CacheService.flagKey(flag.environment.key, flag.key));
    return { deleted: true, id };
  }

  private withEnvironmentKey(flag: any, environmentKey: string) {
    const { environment, environmentId, ...rest } = flag;
    return { ...rest, environmentKey };
  }
}

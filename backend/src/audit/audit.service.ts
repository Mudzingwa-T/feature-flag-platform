import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface AuditInput {
  actor: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  flagKey: string;
  environmentKey: string;
  previousValue?: unknown;
  newValue?: unknown;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /** Append a single immutable audit record. Never updates or deletes rows. */
  record(input: AuditInput) {
    return this.prisma.auditLog.create({
      data: {
        actor: input.actor,
        action: input.action,
        flagKey: input.flagKey,
        environmentKey: input.environmentKey,
        previousValue: (input.previousValue ?? null) as any,
        newValue: (input.newValue ?? null) as any,
      },
    });
  }

  async list(params: { page: number; pageSize: number; flagKey?: string }) {
    const { page, pageSize, flagKey } = params;
    const where = flagKey ? { flagKey } : {};
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }
}

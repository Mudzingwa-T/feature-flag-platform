import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma, Strategy } from '@prisma/client';
import { FlagsService } from './flags.service';

// Lightweight fakes so the test exercises the service logic without a real DB/Redis.
function makeService() {
  const prisma: any = {
    environment: { findUnique: jest.fn() },
    flag: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  };
  const cache: any = { del: jest.fn().mockResolvedValue(undefined) };
  const audit: any = { record: jest.fn().mockResolvedValue(undefined) };
  const service = new FlagsService(prisma, cache, audit);
  return { service, prisma, cache, audit };
}

const currentFlag = {
  id: 'flag-1',
  key: 'new-checkout',
  enabled: false,
  strategy: Strategy.BOOLEAN,
  rolloutPercentage: 0,
  constraints: null,
  description: null,
  version: 3,
  environment: { key: 'PROD' },
};

describe('FlagsService optimistic locking', () => {
  it('rejects a stale update with 409 Conflict', async () => {
    const { service, prisma } = makeService();
    prisma.flag.findUnique.mockResolvedValue(currentFlag);
    // Simulate the WHERE {id, version} matching no row because someone else advanced the version.
    prisma.flag.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('no record', { code: 'P2025', clientVersion: '5' } as any),
    );

    await expect(
      service.update('flag-1', { expectedVersion: 3, enabled: true }, 'admin@ff.local'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('increments version, writes an audit record and invalidates cache on success', async () => {
    const { service, prisma, cache, audit } = makeService();
    prisma.flag.findUnique.mockResolvedValue(currentFlag);
    prisma.flag.update.mockResolvedValue({ ...currentFlag, enabled: true, version: 4 });

    const result = await service.update('flag-1', { expectedVersion: 3, enabled: true }, 'admin@ff.local');

    expect(prisma.flag.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'flag-1', version: 3 } }),
    );
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'UPDATE', flagKey: 'new-checkout', environmentKey: 'PROD' }),
    );
    expect(cache.del).toHaveBeenCalledWith('flag:PROD:new-checkout');
    expect(result.version).toBe(4);
  });

  it('404s when the flag does not exist', async () => {
    const { service, prisma } = makeService();
    prisma.flag.findUnique.mockResolvedValue(null);
    await expect(
      service.update('missing', { expectedVersion: 1 }, 'admin@ff.local'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

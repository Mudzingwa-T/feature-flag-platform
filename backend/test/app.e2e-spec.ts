import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * API-level integration test. Requires a reachable Postgres (DATABASE_URL) with
 * migrations + seed applied — see README "Running tests". It exercises the real
 * HTTP stack: login, an authorised evaluation, and role enforcement.
 */
describe('Feature Flags API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  async function tokenFor(email: string, password: string) {
    const res = await request(app.getHttpServer()).post('/auth/login').send({ email, password });
    return res.body.accessToken as string;
  }

  it('rejects login with bad credentials', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@ff.local', password: 'wrong-password' })
      .expect(401);
  });

  it('evaluates a seeded flag for a user context', async () => {
    const token = await tokenFor('viewer@ff.local', 'viewer123');
    const res = await request(app.getHttpServer())
      .post('/evaluate')
      .set('Authorization', `Bearer ${token}`)
      .send({ flagKey: 'new-checkout', environmentKey: 'PROD', context: { userId: 'u-1', attributes: { city: 'Harare' } } })
      .expect(201);
    expect(res.body).toHaveProperty('enabled');
    expect(res.body).toHaveProperty('reason');
  });

  it('forbids a VIEWER from creating a flag', async () => {
    const token = await tokenFor('viewer@ff.local', 'viewer123');
    await request(app.getHttpServer())
      .post('/flags')
      .set('Authorization', `Bearer ${token}`)
      .send({ key: 'blocked-flag', environmentKey: 'DEV' })
      .expect(403);
  });
});

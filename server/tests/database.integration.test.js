import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import request from 'supertest';

const databaseTestsEnabled = process.env.RUN_DATABASE_INTEGRATION_TESTS === 'true';

test('registration and forekast creation commit durable records', {
  skip: !databaseTestsEnabled,
}, async () => {
  const [{ app }, { default: prisma }] = await Promise.all([
    import('../index.js'),
    import('../prisma.js'),
  ]);
  const uniqueId = randomUUID().slice(0, 8);
  let userId;

  try {
    const registration = await request(app).post('/api/auth/register').send({
      username: `dbtest_${uniqueId}`,
      email: `dbtest_${uniqueId}@example.com`,
      password: 'integration-test-password',
    });

    assert.equal(registration.status, 201);
    assert.ok(registration.body.token);
    userId = registration.body.user.id;

    const creation = await request(app)
      .post('/api/forecasts')
      .set('Authorization', `Bearer ${registration.body.token}`)
      .send({
        statement: 'This database-backed forekast will be stored atomically.',
        category: 'TECHNOLOGY',
        targetDate: new Date(Date.now() + 86_400_000).toISOString(),
      });

    assert.equal(creation.status, 201);

    const [storedForecast, storedEvent] = await Promise.all([
      prisma.forecast.findUnique({ where: { id: creation.body.id } }),
      prisma.analyticsEvent.findFirst({
        where: {
          eventName: 'prediction_created',
          userId,
          entityId: creation.body.id,
        },
      }),
    ]);

    assert.equal(storedForecast?.statement, creation.body.statement);
    assert.equal(storedForecast?.userId, userId);
    assert.ok(storedEvent, 'the transaction should persist its analytics event');
  } finally {
    if (userId) {
      await prisma.$transaction([
        prisma.analyticsEvent.deleteMany({ where: { userId } }),
        prisma.user.delete({ where: { id: userId } }),
      ]);
    }
    await prisma.$disconnect();
  }
});

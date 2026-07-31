import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ||= 'postgresql://forekast:forekast@localhost:5432/forekast';
process.env.JWT_SECRET ||= 'test-secret-that-is-long-enough-for-contract-tests';

const { app } = await import('../index.js');
const { analyticsEventData } = await import('../analytics.js');
const { commentSchema, forecastSchema, profileSchema } = await import('../validation.js');

test('health endpoint reports a healthy API', async () => {
  const response = await request(app).get('/api/health');
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { ok: true });
  assert.equal(response.headers['x-powered-by'], undefined);
});

test('unknown endpoints return a consistent JSON error', async () => {
  const response = await request(app).get('/api/not-a-real-route');
  assert.equal(response.status, 404);
  assert.match(response.body.error, /Route not found/);
});

test('registration rejects malformed input before touching the database', async () => {
  const response = await request(app).post('/api/auth/register').send({
    username: 'x',
    email: 'not-an-email',
    password: 'short',
  });
  assert.equal(response.status, 400);
  assert.equal(response.body.error, 'Validation failed');
  assert.ok(response.body.details.length >= 3);
});

test('protected forecast creation requires a token', async () => {
  const response = await request(app).post('/api/forecasts').send({
    statement: 'This request should not be accepted',
    targetDate: '2030-01-01',
  });
  assert.equal(response.status, 401);
});

test('analytics accepts only the privacy-limited event vocabulary', () => {
  assert.deepEqual(analyticsEventData('prediction_created', 'user-1', 'forecast-1'), {
    eventName: 'prediction_created',
    userId: 'user-1',
    entityId: 'forecast-1',
  });
  assert.throws(() => analyticsEventData('email_captured', 'user-1'), /Unsupported analytics event/);
});

test('comment, repost, and profile writes require authentication', async () => {
  const [comment, repost, profile] = await Promise.all([
    request(app).post('/api/forecasts/example-id/comments').send({ content: 'A thoughtful reply' }),
    request(app).post('/api/forecasts/example-id/repost'),
    request(app).patch('/api/users/me').send({ bio: 'Updated biography' }),
  ]);

  assert.equal(comment.status, 401);
  assert.equal(repost.status, 401);
  assert.equal(profile.status, 401);
});

test('newer content schemas keep their documented limits', () => {
  assert.equal(commentSchema.safeParse({ content: 'A concise comment' }).success, true);
  assert.equal(commentSchema.safeParse({ content: '' }).success, false);
  assert.equal(profileSchema.safeParse({ bio: 'Interested in measurable claims.', avatarUrl: '' }).success, true);
  assert.equal(forecastSchema.safeParse({
    statement: 'A fiction adaptation will lead streaming charts.',
    category: 'FICTION_MEDIA',
    targetDate: new Date(Date.now() + 86_400_000).toISOString(),
  }).success, true);
});

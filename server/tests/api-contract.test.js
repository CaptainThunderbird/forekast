import assert from 'node:assert/strict';
import test from 'node:test';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ||= 'postgresql://forekast:forekast@localhost:5432/forekast';
process.env.JWT_SECRET ||= 'test-secret-that-is-long-enough-for-contract-tests';

const { app } = await import('../index.js');

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

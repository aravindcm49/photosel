// @vitest-environment node

import { describe, it, expect } from 'vitest';
import { createApp } from '../../server/app';
import request from 'supertest';

describe('API Health Endpoint', () => {
  it('GET /api/health returns 200 with status ok', async () => {
    const app = createApp();
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

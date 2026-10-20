import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { apiRequest, closeTestServer, closeTestDatabase } from './testHelper.js';
import { connectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';

describe('Authentication & Security Suite', () => {
  before(async () => {
    await connectDB();
    await User.deleteMany({ email: /@testresearch\.ai$/ });
  });

  after(async () => {
    await User.deleteMany({ email: /@testresearch\.ai$/ });
    await closeTestServer();
    await closeTestDatabase();
  });

  const testUser = {
    name: 'Research Scientist',
    email: `scientist_${Date.now()}@testresearch.ai`,
    password: 'SecureResearchPassword123!',
  };

  test('POST /api/v1/auth/register - successfully registers user and sets cookie', async () => {
    const res = await apiRequest('/api/v1/auth/register', {
      method: 'POST',
      body: testUser,
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.user.email, testUser.email);
    assert.ok(res.body.token, 'Should return JWT token');

    const setCookie = res.headers.get('set-cookie');
    assert.ok(setCookie, 'Should include Set-Cookie header');
    assert.ok(setCookie.includes('token='), 'Cookie should contain token');
    assert.ok(setCookie.toLowerCase().includes('httponly'), 'Cookie must be HttpOnly');
  });

  test('POST /api/v1/auth/register - rejects duplicate email registration', async () => {
    const res = await apiRequest('/api/v1/auth/register', {
      method: 'POST',
      body: testUser,
    });

    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);
    assert.match(res.body.error, /already exists/i);
  });

  test('POST /api/v1/auth/login - rejects invalid credentials', async () => {
    const res = await apiRequest('/api/v1/auth/login', {
      method: 'POST',
      body: {
        email: testUser.email,
        password: 'WrongPassword!',
      },
    });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test('POST /api/v1/auth/login - succeeds with correct credentials', async () => {
    const res = await apiRequest('/api/v1/auth/login', {
      method: 'POST',
      body: {
        email: testUser.email,
        password: testUser.password,
      },
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.user.email, testUser.email);
  });

  test('POST /api/v1/auth/google - enables Google Sign-In', async () => {
    const googlePayload = {
      email: `goog_${Date.now()}@testresearch.ai`,
      name: 'Google Researcher',
      googleId: `goog_sub_${Date.now()}`,
      avatar: 'https://example.com/photo.jpg',
    };

    const res = await apiRequest('/api/v1/auth/google', {
      method: 'POST',
      body: googlePayload,
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.user.email, googlePayload.email);
  });

  test('GET /api/v1/auth/me - rejects unauthenticated requests', async () => {
    const res = await apiRequest('/api/v1/auth/me', {
      method: 'GET',
    });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  test('GET /api/v1/auth/me - authenticates with Bearer token header', async () => {
    const loginRes = await apiRequest('/api/v1/auth/login', {
      method: 'POST',
      body: {
        email: testUser.email,
        password: testUser.password,
      },
    });

    const token = loginRes.body.token;

    const meRes = await apiRequest('/api/v1/auth/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    assert.equal(meRes.status, 200);
    assert.equal(meRes.body.success, true);
    assert.equal(meRes.body.user.email, testUser.email);
  });
});

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { apiRequest, closeTestServer, closeTestDatabase } from './testHelper.js';
import { connectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Project } from '../src/models/Project.js';

describe('Project Multi-Tenant Isolation & Ownership Suite', () => {
  let userAToken = '';
  let userBToken = '';
  let projectAId = '';

  before(async () => {
    await connectDB();
    await User.deleteMany({ email: /@isolation\.ai$/ });

    // Register User A
    const resA = await apiRequest('/api/v1/auth/register', {
      method: 'POST',
      body: {
        name: 'User A',
        email: `usera_${Date.now()}@isolation.ai`,
        password: 'Password123!',
      },
    });
    userAToken = resA.body.token;

    // Register User B
    const resB = await apiRequest('/api/v1/auth/register', {
      method: 'POST',
      body: {
        name: 'User B',
        email: `userb_${Date.now()}@isolation.ai`,
        password: 'Password123!',
      },
    });
    userBToken = resB.body.token;
  });

  after(async () => {
    await User.deleteMany({ email: /@isolation\.ai$/ });
    if (projectAId) {
      await Project.deleteOne({ _id: projectAId });
    }
    await closeTestServer();
    await closeTestDatabase();
  });

  test('POST /api/v1/projects - User A creates a research project', async () => {
    const res = await apiRequest('/api/v1/projects', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userAToken}` },
      body: {
        title: 'Quantum Machine Learning',
        topic: 'Investigating variational quantum algorithms and quantum neural networks for optimization problems.',
        researchSettings: {
          chunkSize: 500,
          chunkOverlap: 100,
          webSearchEnabled: true,
        },
      },
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.project.title, 'Quantum Machine Learning');
    projectAId = res.body.project._id;
  });

  test('GET /api/v1/projects/:id - User A can read their own project', async () => {
    const res = await apiRequest(`/api/v1/projects/${projectAId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${userAToken}` },
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.project._id, projectAId);
  });

  test('GET /api/v1/projects/:id - User B is DENIED access to User A project (Data Isolation)', async () => {
    const res = await apiRequest(`/api/v1/projects/${projectAId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${userBToken}` },
    });

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
    assert.match(res.body.error, /not found or access denied/i);
  });

  test('PATCH /api/v1/projects/:id - User B cannot modify User A project', async () => {
    const res = await apiRequest(`/api/v1/projects/${projectAId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${userBToken}` },
      body: {
        title: 'Hacked Title By User B',
      },
    });

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);

    // Verify title was untouched
    const freshProj = await Project.findById(projectAId);
    assert.equal(freshProj.title, 'Quantum Machine Learning');
  });

  test('DELETE /api/v1/projects/:id - User B cannot delete User A project', async () => {
    const res = await apiRequest(`/api/v1/projects/${projectAId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userBToken}` },
    });

    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);

    const exists = await Project.findById(projectAId);
    assert.ok(exists, 'Project should still exist');
  });

  test('DELETE /api/v1/projects/:id - User A can safely delete their project', async () => {
    const res = await apiRequest(`/api/v1/projects/${projectAId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${userAToken}` },
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);

    const check = await Project.findById(projectAId);
    assert.equal(check, null);
  });
});

import http from 'http';
import dns from 'node:dns';
import mongoose from 'mongoose';
import app from '../src/app.js';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Ignore
}

let testServer = null;
let baseUrl = '';

export async function getTestServer() {
  if (!testServer) {
    testServer = http.createServer(app);
    await new Promise((resolve) => testServer.listen(0, resolve));
    const port = testServer.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
  }
  return { testServer, baseUrl };
}

export async function closeTestServer() {
  if (testServer) {
    await new Promise((resolve) => testServer.close(resolve));
    testServer = null;
  }
}

export async function closeTestDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

export async function apiRequest(path, { method = 'GET', headers = {}, body = null } = {}) {
  const { baseUrl } = await getTestServer();
  const requestHeaders = { ...headers };

  let requestBody = null;
  if (body) {
    if (typeof body === 'object') {
      requestBody = JSON.stringify(body);
      requestHeaders['Content-Type'] = 'application/json';
    } else {
      requestBody = body;
    }
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: requestHeaders,
    body: requestBody,
  });

  const responseBody = await response.json().catch(() => null);
  return {
    status: response.status,
    headers: response.headers,
    body: responseBody,
  };
}

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import fs from 'fs';
import { validateSafeUrl } from '../src/utils/ssrfGuard.js';
import { extractPdfWithPages } from '../src/services/ingestion/pdfExtractor.js';
import { chunkDocuments } from '../src/services/ingestion/chunker.js';

describe('Ingestion & SSRF Security Suite', () => {
  test('SSRF Guard - blocks localhost and loopback IPv4', async () => {
    const res1 = await validateSafeUrl('http://127.0.0.1:8080/admin');
    assert.equal(res1.isValid, false);
    assert.match(res1.error, /restricted|private/i);

    const res2 = await validateSafeUrl('http://localhost/api/v1/keys');
    assert.equal(res2.isValid, false);
  });

  test('SSRF Guard - blocks Cloud Metadata Service (169.254.169.254)', async () => {
    const res = await validateSafeUrl('http://169.254.169.254/latest/meta-data/');
    assert.equal(res.isValid, false);
    assert.match(res.error, /restricted|private/i);
  });

  test('SSRF Guard - blocks Private Class A, B, and C subnets', async () => {
    const private10 = await validateSafeUrl('http://10.0.0.5/internal');
    assert.equal(private10.isValid, false);

    const private172 = await validateSafeUrl('http://172.16.5.10/dashboard');
    assert.equal(private172.isValid, false);

    const private192 = await validateSafeUrl('http://192.168.1.1/router');
    assert.equal(private192.isValid, false);
  });

  test('SSRF Guard - rejects non-HTTP(S) schemes (file://, ftp://, gopher://)', async () => {
    const resFile = await validateSafeUrl('file:///etc/passwd');
    assert.equal(resFile.isValid, false);

    const resFtp = await validateSafeUrl('ftp://example.com/data');
    assert.equal(resFtp.isValid, false);
  });

  test('Chunking Engine - preserves pageNumber, section, and overlapping bounds', () => {
    const mockItems = [
      {
        text: 'This is the first page of the research paper discussing deep neural networks. ' +
              'It has multiple sentences describing transformers, self-attention mechanisms, and residual connections. '.repeat(10),
        pageNumber: 1,
        section: 'Abstract & Introduction',
      },
      {
        text: 'Moving to the second page of the study, empirical results demonstrate a 25 percent improvement in BLEU scores. ' +
              'Extensive ablation studies confirm the effectiveness of multi-head attention. '.repeat(10),
        pageNumber: 2,
        section: 'Results & Benchmark',
      },
    ];

    const chunks = chunkDocuments(mockItems, { chunkSize: 300, chunkOverlap: 60 });

    assert.ok(chunks.length > 2, 'Should produce multiple overlapping chunks');

    // Verify chunk 0 preserves page 1 and section
    assert.equal(chunks[0].pageNumber, 1);
    assert.equal(chunks[0].section, 'Abstract & Introduction');
    assert.equal(chunks[0].chunkIndex, 0);

    // Verify last chunk preserves page 2 and section
    const lastChunk = chunks[chunks.length - 1];
    assert.equal(lastChunk.pageNumber, 2);
    assert.equal(lastChunk.section, 'Results & Benchmark');
    assert.ok(lastChunk.text.length > 0);
  });

  test('PDF Extraction - extracts text with actual page-level metadata', async () => {
    // Check if an existing sample PDF is available in server/uploads
    const uploadDir = path.resolve(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const files = fs.readdirSync(uploadDir).filter((f) => f.endsWith('.pdf'));

    if (files.length > 0) {
      const samplePdfPath = path.join(uploadDir, files[0]);
      const result = await extractPdfWithPages(samplePdfPath);

      assert.ok(result.pageCount >= 1, 'PDF should have at least 1 page');
      assert.ok(Array.isArray(result.pages), 'Pages should be an array');
      assert.equal(result.pages[0].pageNumber, 1, 'First page should be 1-indexed');
      assert.ok(typeof result.pages[0].text === 'string');
    }
  });
});

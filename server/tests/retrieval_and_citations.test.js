import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import { closeTestServer, closeTestDatabase } from './testHelper.js';
import { User } from '../src/models/User.js';
import { Project } from '../src/models/Project.js';
import { Source } from '../src/models/Source.js';
import { Chunk } from '../src/models/Chunk.js';
import { validateAndEnrichCitations } from '../src/services/citations/citationValidator.js';
import { generateGroundedAnswer } from '../src/services/research/llmService.js';
import { retrieveEvidence } from '../src/services/retrieval/hybridRetriever.js';
import { generateEmbedding } from '../src/services/retrieval/embeddingService.js';

describe('Retrieval, Citations & Evaluation Dataset Suite', () => {
  let testUser;
  let testProject;
  let pdfSource;
  let webSource;

  before(async () => {
    await connectDB();

    testUser = await User.create({
      name: 'Evaluation Researcher',
      email: `eval_${Date.now()}@evalresearch.ai`,
      passwordHash: 'dummyhash123',
    });

    testProject = await Project.create({
      userId: testUser._id,
      title: 'CRISPR & Gene Editing Ethics',
      topic: 'Genomic engineering, therapeutic efficacy, off-target mutations, and bioethics.',
    });

    // Seed PDF Source with 2 pages
    pdfSource = await Source.create({
      projectId: testProject._id,
      userId: testUser._id,
      type: 'pdf',
      title: 'Clinical Advances in Cas9 Therapies',
      pageCount: 2,
      status: 'indexed',
    });

    // Seed Web Source
    webSource = await Source.create({
      projectId: testProject._id,
      userId: testUser._id,
      type: 'url',
      title: 'Global Bioethics Treaty on Germline Modification',
      url: 'https://nature.com/articles/bioethics-crispr-2026',
      status: 'indexed',
    });

    // Create Chunks for Evaluation Dataset
    const chunk1Text = 'Clinical trials of CRISPR-Cas9 achieved an 88 percent reduction in sickle hemoglobin levels on Page 1.';
    const chunk2Text = 'Off-target indel mutations occurred at a rate below 0.1 percent across 500 patient loci analyzed on Page 2.';
    const chunk3Text = 'The Global Bioethics Treaty stipulates that germline gene modifications require multilateral international oversight.';

    const [emb1, emb2, emb3] = await Promise.all([
      generateEmbedding(chunk1Text),
      generateEmbedding(chunk2Text),
      generateEmbedding(chunk3Text),
    ]);

    await Chunk.create([
      {
        sourceId: pdfSource._id,
        projectId: testProject._id,
        userId: testUser._id,
        chunkIndex: 0,
        pageNumber: 1,
        section: 'Page 1 - Clinical Results',
        text: chunk1Text,
        embedding: emb1,
      },
      {
        sourceId: pdfSource._id,
        projectId: testProject._id,
        userId: testUser._id,
        chunkIndex: 1,
        pageNumber: 2,
        section: 'Page 2 - Safety & Off-Target Profiling',
        text: chunk2Text,
        embedding: emb2,
      },
      {
        sourceId: webSource._id,
        projectId: testProject._id,
        userId: testUser._id,
        chunkIndex: 2,
        pageNumber: 1,
        section: 'Article - Global Regulatory Framework',
        text: chunk3Text,
        embedding: emb3,
      },
    ]);
  });

  after(async () => {
    if (testUser) await User.deleteOne({ _id: testUser._id });
    if (testProject) await Project.deleteOne({ _id: testProject._id });
    if (pdfSource) await Source.deleteOne({ _id: pdfSource._id });
    if (webSource) await Source.deleteOne({ _id: webSource._id });
    await Chunk.deleteMany({ projectId: testProject?._id });
    await closeTestServer();
    await closeTestDatabase();
  });

  test('Hybrid Retrieval - retrieves relevant supporting page for known query', async () => {
    const evidence = await retrieveEvidence({
      projectId: testProject._id,
      userId: testUser._id,
      query: 'What was the sickle hemoglobin reduction in Cas9 clinical trials?',
      topK: 3,
    });

    assert.ok(evidence.length > 0, 'Should retrieve evidence');
    const topResult = evidence[0];
    assert.match(topResult.text, /88 percent reduction/i);
    assert.equal(topResult.pageNumber, 1, 'Should map to Page 1');
    assert.equal(topResult.sourceTitle, 'Clinical Advances in Cas9 Therapies');
  });

  test('Citation Validator - validates legitimate citations and attaches actual page metadata', () => {
    const mockRetrieved = [
      {
        sourceId: pdfSource._id,
        chunkId: new mongoose.Types.ObjectId(),
        sourceTitle: 'Clinical Advances in Cas9 Therapies',
        sourceType: 'pdf',
        pageNumber: 2,
        section: 'Page 2',
        text: 'Off-target indel mutations occurred at a rate below 0.1 percent.',
      },
      {
        sourceId: webSource._id,
        chunkId: new mongoose.Types.ObjectId(),
        sourceTitle: 'Global Bioethics Treaty on Germline Modification',
        sourceType: 'url',
        sourceUrl: 'https://nature.com/articles/bioethics-crispr-2026',
        pageNumber: 1,
        section: 'Regulatory Framework',
        text: 'The Global Bioethics Treaty stipulates that germline gene modifications require oversight.',
      },
    ];

    const rawAIAnswer = 'Off-target rates were kept below 0.1% [1, p. 2]. International regulation mandates multilateral oversight [2].';

    const { cleanedAnswer, citations, rejectedCount } = validateAndEnrichCitations(
      rawAIAnswer,
      mockRetrieved
    );

    assert.equal(rejectedCount, 0, 'Should reject 0 legitimate citations');
    assert.equal(citations.length, 2, 'Should validate 2 citations');

    // Check Citation 1 (PDF)
    assert.equal(citations[0].citationIndex, 1);
    assert.equal(citations[0].pageNumber, 2);
    assert.equal(citations[0].type, 'pdf');
    assert.match(citations[0].passage, /off-target indel/i);

    // Check Citation 2 (Web)
    assert.equal(citations[1].citationIndex, 2);
    assert.equal(citations[1].type, 'url');
    assert.equal(citations[1].url, 'https://nature.com/articles/bioethics-crispr-2026');
  });

  test('Citation Validator - strictly REJECTS and STRIPS fabricated / hallucinated citations', () => {
    const mockRetrieved = [
      {
        sourceId: pdfSource._id,
        sourceTitle: 'Clinical Advances in Cas9 Therapies',
        sourceType: 'pdf',
        pageNumber: 1,
        text: 'Sickle cell reduction achieved 88 percent.',
      },
    ];

    // LLM generated a fake citation [55, p. 900] and [2] when only 1 chunk was retrieved
    const hallucinatedText = 'Gene therapy cured patients [1, p. 1]. Space exploration benefits [55, p. 900] and alien life exists [2].';

    const { cleanedAnswer, citations, rejectedCount } = validateAndEnrichCitations(
      hallucinatedText,
      mockRetrieved
    );

    assert.equal(citations.length, 1, 'Only 1 citation should be approved');
    assert.equal(rejectedCount, 2, 'Should reject 2 fabricated citation indices');
    assert.ok(!cleanedAnswer.includes('[55'), 'Fabricated citation [55] must be stripped');
    assert.ok(!cleanedAnswer.includes('[2]'), 'Fabricated citation [2] must be stripped');
  });

  test('Insufficient Evidence Handling - explicitly withholds speculation on unsupported questions', async () => {
    const emptyEvidence = [];
    const answer = await generateGroundedAnswer(
      'What is the average temperature on Neptune during winter solstice?',
      emptyEvidence
    );

    assert.match(answer, /insufficient evidence/i, 'Must acknowledge insufficient evidence');
  });
});

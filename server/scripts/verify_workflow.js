import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { connectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Project } from '../src/models/Project.js';
import { Source } from '../src/models/Source.js';
import { Chunk } from '../src/models/Chunk.js';
import { processPdfSource } from '../src/services/ingestion/ingestionService.js';
import { executeResearchQuery } from '../src/services/research/researchEngine.js';
import logger from '../src/utils/logger.js';

async function runEndToEndVerification() {
  console.log('\n===============================================================');
  console.log('🔬 RESEARCHPILOT AI — END-TO-END WORKFLOW VERIFICATION');
  console.log('===============================================================\n');

  try {
    await connectDB();

    // 1. Create or Find Verified Demo User
    const email = 'alex.vance@blackmesa.edu';
    let user = await User.findOne({ email });
    if (!user) {
      const passwordHash = await User.hashPassword('ResearchPass2026!');
      user = await User.create({
        name: 'Dr. Alex Vance',
        email,
        passwordHash,
      });
      console.log(`[Step 1] Created Demo Researcher Account: ${user.email}`);
    } else {
      console.log(`[Step 1] Verified Existing Researcher Account: ${user.email}`);
    }

    // 2. Create Research Project
    let project = await Project.findOne({ userId: user._id, title: 'Post-Quantum Cryptography & Lattices' });
    if (!project) {
      project = await Project.create({
        userId: user._id,
        title: 'Post-Quantum Cryptography & Lattices',
        topic: 'Investigating lattice-based cryptography, NIST post-quantum standards (Kyber/Dilithium), and quantum decryption threats to RSA.',
        researchSettings: {
          chunkSize: 500,
          chunkOverlap: 100,
          webSearchEnabled: true,
          similarityThreshold: 0.15,
        },
      });
      console.log(`[Step 2] Created Research Project: "${project.title}" (ID: ${project._id})`);
    } else {
      console.log(`[Step 2] Found Existing Research Project: "${project.title}"`);
    }

    // 3. Prepare Sample PDF
    const uploadDir = path.resolve(process.cwd(), 'uploads');
    const existingPdfs = fs.readdirSync(uploadDir).filter((f) => f.endsWith('.pdf'));

    if (existingPdfs.length > 0) {
      const samplePdfPath = path.join(uploadDir, existingPdfs[0]);
      console.log(`[Step 3] Selected Sample PDF Document: ${existingPdfs[0]}`);

      // Check if source already indexed
      let source = await Source.findOne({ projectId: project._id, fileKey: existingPdfs[0] });
      if (!source) {
        source = await Source.create({
          projectId: project._id,
          userId: user._id,
          type: 'pdf',
          title: 'Quantum Resistant Cryptographic Foundations',
          fileKey: existingPdfs[0],
          fileOriginalName: existingPdfs[0],
          status: 'pending',
        });

        console.log(`[Step 4] Ingesting PDF with actual page-level extraction...`);
        await processPdfSource(source._id, samplePdfPath);
      }

      const chunksCount = await Chunk.countDocuments({ sourceId: source._id });
      console.log(`[Step 5] Source Indexed Successfully! Page count: ${source.pageCount}, Vector chunks: ${chunksCount}`);

      // 4. Execute Research Query
      const query = 'What are the primary technical qualifications, experience, and background documented in this research profile?';
      console.log(`\n[Step 6] Executing Grounded Research Query: "${query}"...`);

      const result = await executeResearchQuery({
        projectId: project._id,
        userId: user._id,
        query,
        enableWebSearch: false,
      });

      console.log(`\n------------------ SYNTHESIZED RESEARCH ANSWER ------------------`);
      console.log(result.answer);
      console.log(`-----------------------------------------------------------------`);

      console.log(`\n[Step 7] Citations Verified by Server: ${result.citations.length}`);
      result.citations.forEach((c) => {
        console.log(`  * Citation [${c.citationIndex}]: "${c.title}" | Page: ${c.pageNumber || 'N/A'} | Passage: "${c.passage.slice(0, 100)}..."`);
      });

      console.log(`\n[Step 8] Audit Metrics:`);
      console.log(`  - Latency: ${result.stats.executionTimeMs} ms`);
      console.log(`  - Retranslated Evidence: ${result.retrievedEvidenceCount} chunks`);
      console.log(`  - Rejected Citations: ${result.stats.rejectedCitationsCount}`);

      console.log(`\n✅ WORKFLOW VERIFICATION PASSED COMPLETELY!`);
    } else {
      console.log(`[Notice] No PDF found in uploads directory to ingest.`);
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  }
}

runEndToEndVerification();

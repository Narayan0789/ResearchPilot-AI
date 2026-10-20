import logger from '../../utils/logger.js';

/**
 * Validates and normalizes citations generated in an AI answer against ground-truth retrieved evidence.
 *
 * Ground rules:
 * 1. Strict server-side validation: only citation indices that map to actual retrieved passages are accepted.
 * 2. Fabricated indices (e.g. [99] when only 3 passages exist) are rejected or stripped.
 * 3. Supports formats: [1], [1, p. 4], [Passage 1, p. 4], [Passage 1, p. 1; Passage 3, p. 1].
 * 4. Actual PDF page numbers and canonical URLs from ground-truth evidence chunk are verified and injected.
 * 5. Extracts supporting passage snippet for interactive citation drawer.
 *
 * @param {string} rawAnswerText - The raw synthesized answer text containing citation tags
 * @param {Array<object>} retrievedEvidence - Array of retrieved chunk objects with metadata
 * @returns {{ cleanedAnswer: string, citations: Array<object>, rejectedCount: number }}
 */
export function validateAndEnrichCitations(rawAnswerText, retrievedEvidence = []) {
  if (!rawAnswerText || typeof rawAnswerText !== 'string') {
    return { cleanedAnswer: '', citations: [], rejectedCount: 0 };
  }

  const validCitationsMap = new Map();
  let rejectedCount = 0;

  // Match any bracketed block: [ ... ]
  const bracketBlockRegex = /\[([^\]]+)\]/g;

  const cleanedAnswer = rawAnswerText.replace(bracketBlockRegex, (fullBracketMatch, innerContent) => {
    // If it's a note or alert tag like [!NOTE], leave it untouched
    if (innerContent.startsWith('!')) {
      return fullBracketMatch;
    }

    // Split multiple citations separated by semicolons (e.g. "Passage 1, p. 1; Passage 3, p. 1")
    const segments = innerContent.split(';');
    const replacementTags = [];

    for (const segment of segments) {
      // Extract citation number and optional page number
      // Matches: "1", "Passage 1", "Passage 1, p. 4", "1, p. 4", "1, page 12"
      const itemMatch = segment.match(/(?:(?:Passage|Source)\s*)?(\d+)(?:,\s*(?:p\.?|page)\s*(\d+))?/i);
      if (!itemMatch) {
        continue;
      }

      const citationIndex = parseInt(itemMatch[1], 10);
      const pageStr = itemMatch[2];

      // Verify index is within range of retrieved evidence (1-indexed)
      if (citationIndex < 1 || citationIndex > retrievedEvidence.length) {
        logger.warn(`Rejected invalid / fabricated citation index: [${citationIndex}] (Only ${retrievedEvidence.length} chunks retrieved)`);
        rejectedCount++;
        continue;
      }

      const groundEvidence = retrievedEvidence[citationIndex - 1];
      const actualPage = groundEvidence.pageNumber || (pageStr ? parseInt(pageStr, 10) : 1);

      if (!validCitationsMap.has(citationIndex)) {
        validCitationsMap.set(citationIndex, {
          citationIndex,
          sourceId: groundEvidence.sourceId,
          chunkId: groundEvidence.chunkId,
          title: groundEvidence.sourceTitle || 'Retrieved Source',
          type: groundEvidence.sourceType || 'pdf',
          url: groundEvidence.sourceUrl || null,
          pageNumber: groundEvidence.sourceType === 'pdf' ? actualPage : null,
          section: groundEvidence.section || null,
          passage: groundEvidence.text ? groundEvidence.text.slice(0, 400).trim() : '',
          retrievalTimestamp: new Date().toISOString(),
        });
      }

      // Standardize clean format
      if (groundEvidence.sourceType === 'pdf') {
        replacementTags.push(`[${citationIndex}, p. ${actualPage}]`);
      } else {
        replacementTags.push(`[${citationIndex}]`);
      }
    }

    if (replacementTags.length === 0) {
      // If none of the segments were valid, return empty string to strip hallucinated bracket
      return '';
    }

    return replacementTags.join(' ');
  });

  // Convert map to sorted citations array
  const citations = Array.from(validCitationsMap.values()).sort(
    (a, b) => a.citationIndex - b.citationIndex
  );

  logger.info(`Validated citations: ${citations.length} approved, ${rejectedCount} rejected`);

  return {
    cleanedAnswer: cleanedAnswer.replace(/\s{2,}/g, ' ').trim(),
    citations,
    rejectedCount,
  };
}

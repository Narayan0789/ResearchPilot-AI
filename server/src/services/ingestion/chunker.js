/**
 * Chunks text while preserving page numbers, section metadata, and sequence index.
 * Uses a sliding window with sentence/paragraph awareness.
 *
 * @param {Array<{ text: string, pageNumber?: number, section?: string }>} items
 * @param {object} options
 * @param {number} options.chunkSize - Maximum characters per chunk (default: 600)
 * @param {number} options.chunkOverlap - Overlapping characters between consecutive chunks (default: 120)
 * @returns {Array<{ chunkIndex: number, text: string, pageNumber: number, section: string }>}
 */
export function chunkDocuments(items, options = {}) {
  const chunkSize = Math.max(200, options.chunkSize || 600);
  const chunkOverlap = Math.max(0, Math.min(options.chunkOverlap || 120, Math.floor(chunkSize / 2)));

  const chunks = [];
  let globalChunkIndex = 0;

  for (const item of items) {
    const rawText = item.text || '';
    if (!rawText.trim()) continue;

    const pageNumber = item.pageNumber !== undefined ? item.pageNumber : 1;
    const section = item.section || 'General';

    // If item text is within chunk size, push as a single chunk
    if (rawText.length <= chunkSize) {
      chunks.push({
        chunkIndex: globalChunkIndex++,
        text: rawText.trim(),
        pageNumber,
        section,
      });
      continue;
    }

    // Split text into paragraphs/sentences for clean breaks
    let start = 0;
    while (start < rawText.length) {
      let end = start + chunkSize;

      // If not at the very end of the text, try to find a natural boundary
      if (end < rawText.length) {
        // Look for paragraph break, period, newline, or semicolon within last 80 chars of the window
        const lookbackWindow = rawText.slice(Math.max(start, end - 80), end);
        const match = lookbackWindow.search(/[\.\n\?!;](\s|$)/);
        if (match !== -1) {
          end = Math.max(start, end - 80) + match + 1;
        } else {
          // Fall back to space boundary
          const lastSpace = lookbackWindow.lastIndexOf(' ');
          if (lastSpace !== -1) {
            end = Math.max(start, end - 80) + lastSpace;
          }
        }
      }

      const chunkText = rawText.slice(start, end).trim();
      if (chunkText.length > 20) {
        chunks.push({
          chunkIndex: globalChunkIndex++,
          text: chunkText,
          pageNumber,
          section,
        });
      }

      // Slide window forward with overlap
      const step = end - start - chunkOverlap;
      if (step <= 0) {
        start = end; // prevent infinite loop if overlap >= slice
      } else {
        start += step;
      }
    }
  }

  return chunks;
}

import fs from 'fs';
import pdf from 'pdf-parse';
import logger from '../../utils/logger.js';

/**
 * Extracts text from a PDF buffer or file path, preserving actual page numbers.
 * @param {Buffer|string} input - PDF buffer or absolute file path
 * @returns {Promise<{ pageCount: number, pages: Array<{ pageNumber: number, text: string }>, fullText: string, metadata: object }>}
 */
export async function extractPdfWithPages(input) {
  try {
    let dataBuffer;
    if (typeof input === 'string') {
      dataBuffer = await fs.promises.readFile(input);
    } else if (Buffer.isBuffer(input)) {
      dataBuffer = input;
    } else {
      throw new Error('Invalid input to extractPdfWithPages: expected Buffer or string path');
    }

    const pages = [];

    // Custom pagerender callback to capture text per page with 1-based page index
    function renderPage(pageData) {
      const renderOptions = {
        normalizeWhitespace: true,
        disableCombineTextItems: false,
      };

      return pageData.getTextContent(renderOptions).then(function (textContent) {
        let lastY;
        let pageText = '';
        for (const item of textContent.items) {
          if (lastY === item.transform[5] || !lastY) {
            pageText += item.str;
          } else {
            pageText += '\n' + item.str;
          }
          lastY = item.transform[5];
        }

        const cleanText = pageText.trim();
        pages.push({
          pageNumber: pageData.pageIndex + 1,
          text: cleanText,
        });

        return pageText;
      });
    }

    const parsed = await pdf(dataBuffer, {
      pagerender: renderPage,
    });

    // If pagerender didn't populate pages for any reason, provide reliable fallback
    if (pages.length === 0) {
      const rawText = parsed.text || '';
      // Try splitting by form-feed character (\f) which pdf-parse uses between pages
      const rawPages = rawText.split(/\f/g);
      if (rawPages.length > 1) {
        rawPages.forEach((txt, idx) => {
          if (txt.trim()) {
            pages.push({
              pageNumber: idx + 1,
              text: txt.trim(),
            });
          }
        });
      } else {
        pages.push({
          pageNumber: 1,
          text: rawText.trim(),
        });
      }
    }

    // Sort pages sequentially by pageNumber
    pages.sort((a, b) => a.pageNumber - b.pageNumber);

    logger.info(`Extracted PDF: ${pages.length} pages, ${parsed.numpages || pages.length} total declared pages`);

    return {
      pageCount: parsed.numpages || pages.length,
      pages,
      fullText: parsed.text || pages.map((p) => p.text).join('\n\n'),
      metadata: parsed.info || {},
    };
  } catch (error) {
    logger.error(`PDF extraction failed: ${error.message}`);
    throw new Error(`Failed to extract PDF content: ${error.message}`);
  }
}

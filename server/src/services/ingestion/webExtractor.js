import * as cheerio from 'cheerio';
import { validateSafeUrl } from '../../utils/ssrfGuard.js';
import logger from '../../utils/logger.js';

/**
 * Extracts and cleans web page content from a validated URL.
 * Preserves canonical URL, title, metadata, and sections.
 * @param {string} rawUrl
 * @returns {Promise<{ title: string, canonicalUrl: string, description: string, sections: Array<{ section: string, text: string }>, fullText: string, metadata: object }>}
 */
export async function extractWebContent(rawUrl) {
  // 1. SSRF Safety Check
  const safety = await validateSafeUrl(rawUrl);
  if (!safety.isValid) {
    throw new Error(`SSRF Security Error: ${safety.error}`);
  }

  const validatedUrl = safety.parsedUrl.href;
  logger.info(`Fetching web page content from safe URL: ${validatedUrl}`);

  // 2. Fetch with strict timeout and size limit
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 second timeout

  let html;
  try {
    const response = await fetch(validatedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'ResearchPilot-Bot/1.0 (+https://researchpilot.ai; personal research assistant)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }

    // Verify response URL hasn't been redirected to a private address
    const finalUrlCheck = await validateSafeUrl(response.url);
    if (!finalUrlCheck.isValid) {
      throw new Error(`SSRF Security Error on redirect destination: ${finalUrlCheck.error}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
      throw new Error(`Unsupported content type: ${contentType}. Expected HTML.`);
    }

    // Limit download size to 5MB to prevent memory exhaustion
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > 5 * 1024 * 1024) {
      throw new Error('Web page exceeds maximum allowable size (5MB)');
    }

    const decoder = new TextDecoder('utf-8');
    html = decoder.decode(buffer);
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Web page request timed out (12s limit exceeded)');
    }
    throw err;
  }

  // 3. Cheerio extraction & DOM cleaning
  const $ = cheerio.load(html);

  // Strip non-content and potentially dangerous elements
  $('script, style, noscript, iframe, svg, nav, footer, header, aside, .ad, .ads, .advertisement, [aria-hidden="true"]').remove();

  // Extract Metadata
  const title =
    $('meta[property="og:title"]').attr('content') ||
    $('title').text().trim() ||
    $('h1').first().text().trim() ||
    'Untitled Web Document';

  const canonicalUrl =
    $('link[rel="canonical"]').attr('href') ||
    $('meta[property="og:url"]').attr('content') ||
    validatedUrl;

  const description =
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') ||
    '';

  const author =
    $('meta[name="author"]').attr('content') ||
    $('meta[property="article:author"]').attr('content') ||
    null;

  const publishedDate =
    $('meta[property="article:published_time"]').attr('content') ||
    $('time').first().attr('datetime') ||
    null;

  // Extract structured sections based on headings
  const sections = [];
  let currentSection = 'Introduction';
  let currentParagraphs = [];

  // Iterate over content containers or main article
  const contentRoot = $('main, article, #content, .content, body').first();

  contentRoot.find('h1, h2, h3, h4, p, li').each((_, el) => {
    const tagName = el.tagName.toLowerCase();
    const text = $(el).text().replace(/\s+/g, ' ').trim();

    if (!text || text.length < 5) return;

    if (['h1', 'h2', 'h3', 'h4'].includes(tagName)) {
      if (currentParagraphs.length > 0) {
        sections.push({
          section: currentSection,
          text: currentParagraphs.join('\n\n'),
        });
        currentParagraphs = [];
      }
      currentSection = text;
    } else {
      currentParagraphs.push(text);
    }
  });

  // Flush remaining paragraphs
  if (currentParagraphs.length > 0) {
    sections.push({
      section: currentSection,
      text: currentParagraphs.join('\n\n'),
    });
  }

  // If no sections were built, fallback to main text body
  if (sections.length === 0) {
    const rawBody = contentRoot.text().replace(/\s+/g, ' ').trim();
    if (rawBody) {
      sections.push({
        section: 'Main Content',
        text: rawBody,
      });
    }
  }

  const fullText = sections.map((s) => `### ${s.section}\n${s.text}`).join('\n\n');

  logger.info(`Web page extracted: "${title}", ${sections.length} sections, canonical: ${canonicalUrl}`);

  return {
    title,
    canonicalUrl,
    description,
    author,
    publishedDate,
    sections,
    fullText,
    metadata: {
      url: validatedUrl,
      finalUrl: canonicalUrl,
      title,
      description,
      author,
      publishedDate,
    },
  };
}

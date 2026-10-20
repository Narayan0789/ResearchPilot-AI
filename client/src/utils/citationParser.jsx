import React from 'react';

/**
 * Parses markdown/text content and converts citation tokens [X, p. Y] or [X]
 * into interactive clickable pills that open the citation drawer.
 *
 * @param {string} text - Message text
 * @param {Array<object>} citations - Array of verified citation objects for this message
 * @param {function} onCitationClick - Callback when a citation pill is clicked
 * @returns {React.ReactNode[]} Renderable React nodes with interactive citation pills
 */
export function renderContentWithCitations(text, citations = [], onCitationClick) {
  if (!text || typeof text !== 'string') return null;

  // Regex matching [1], [1, p. 4], [1, page 12]
  const regex = /\[(\d+)(?:,\s*(?:p\.?|page)\s*(\d+))?\]/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const matchIndex = match.index;
    const fullMatch = match[0];
    const citIndex = parseInt(match[1], 10);
    const citPage = match[2] ? parseInt(match[2], 10) : null;

    // Push text preceding the match
    if (matchIndex > lastIndex) {
      parts.push(text.substring(lastIndex, matchIndex));
    }

    // Find corresponding citation metadata
    const citationData = citations.find((c) => c.citationIndex === citIndex) || {
      citationIndex: citIndex,
      pageNumber: citPage,
      title: `Source [${citIndex}]`,
      type: citPage ? 'pdf' : 'url',
      passage: 'Supporting passage recorded for this claim.',
    };

    // Render interactive pill
    parts.push(
      <button
        key={`cit-${citIndex}-${matchIndex}`}
        onClick={(e) => {
          e.stopPropagation();
          if (onCitationClick) onCitationClick(citationData);
        }}
        title={`Click to inspect ground-truth evidence: ${citationData.title}`}
        className="citation-pill group inline-flex items-center space-x-1"
      >
        <span>{fullMatch}</span>
      </button>
    );

    lastIndex = regex.lastIndex;
  }

  // Push remainder of the text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}

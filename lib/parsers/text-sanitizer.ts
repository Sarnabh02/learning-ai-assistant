/**
 * Cleans raw text extracted from PDFs or PPTX files before sending to Claude.
 * Collapses whitespace, strips control characters, removes junk lines.
 */
export function sanitizeText(raw: string): string {
  return raw
    // Collapse runs of whitespace within lines (except newlines)
    .replace(/[^\S\n]+/g, ' ')
    // Remove null bytes and non-printable control characters (keep \n and \t)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Collapse 3+ consecutive newlines into double newline
    .replace(/\n{3,}/g, '\n\n')
    // Remove lines that are only 1-2 characters (page numbers, stray symbols)
    .split('\n')
    .filter(line => line.trim().length > 2)
    .join('\n')
    .trim();
}

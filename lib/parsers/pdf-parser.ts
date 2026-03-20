export interface ParseResult {
  text: string;
  pageCount: number;
  error?: string;
}

/**
 * Extracts text from a PDF ArrayBuffer using pdfjs-dist (legacy Node-safe build).
 * Worker is disabled for server-side use.
 */
export async function parsePdfBuffer(buffer: ArrayBuffer): Promise<ParseResult> {
  try {
    // Dynamic import to avoid issues with Next.js bundling
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs' as string);

    // Disable worker for server-side / API route usage
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (pdfjs as any).GlobalWorkerOptions.workerSrc = '';

    const loadingTask = (pdfjs as any).getDocument({ data: new Uint8Array(buffer) });
    const doc = await loadingTask.promise;
    const pageCount: number = doc.numPages;
    const textParts: string[] = [];

    for (let i = 1; i <= pageCount; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const pageText = (content.items as Array<{ str?: string }>)
        .filter(item => typeof item.str === 'string')
        .map(item => item.str!)
        .join(' ');

      if (pageText.trim()) {
        textParts.push(`[Page ${i}]\n${pageText.trim()}`);
      }
    }

    const text = textParts.join('\n\n');
    return { text, pageCount };
  } catch (err) {
    return {
      text: '',
      pageCount: 0,
      error: `Failed to parse PDF: ${err instanceof Error ? err.message : 'Unknown error'}`,
    };
  }
}

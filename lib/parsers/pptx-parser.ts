import { unzipSync } from 'fflate';

export interface ParseResult {
  text: string;
  slideCount: number;
  error?: string;
}

/**
 * Extracts text from a PPTX ArrayBuffer.
 * PPTX files are ZIP archives containing DrawingML XML slides.
 * Text is stored in <a:t> elements within each slide XML.
 */
export async function parsePptxBuffer(buffer: ArrayBuffer): Promise<ParseResult> {
  try {
    const uint8 = new Uint8Array(buffer);
    const unzipped = unzipSync(uint8);

    // Find all slide XML files and sort numerically
    const slideKeys = Object.keys(unzipped)
      .filter(k => /^ppt\/slides\/slide\d+\.xml$/.test(k))
      .sort((a, b) => {
        const numA = parseInt(a.match(/(\d+)/)![1]);
        const numB = parseInt(b.match(/(\d+)/)![1]);
        return numA - numB;
      });

    if (slideKeys.length === 0) {
      return { text: '', slideCount: 0, error: 'No slides found in PPTX file' };
    }

    const decoder = new TextDecoder('utf-8');
    let fullText = '';

    for (const key of slideKeys) {
      const xmlStr = decoder.decode(unzipped[key]);
      // Extract all <a:t> text nodes (DrawingML text runs)
      const textMatches = xmlStr.match(/<a:t[^>]*>([^<]+)<\/a:t>/g) ?? [];
      const slideText = textMatches
        .map(m => m.replace(/<[^>]+>/g, '').trim())
        .filter(Boolean)
        .join(' ');

      if (slideText) {
        const slideNum = key.match(/(\d+)/)?.[1];
        fullText += `\n[Slide ${slideNum}]\n${slideText}\n`;
      }
    }

    return {
      text: fullText.trim(),
      slideCount: slideKeys.length,
    };
  } catch (err) {
    return {
      text: '',
      slideCount: 0,
      error: `Failed to parse PPTX: ${err instanceof Error ? err.message : 'Unknown error'}`,
    };
  }
}

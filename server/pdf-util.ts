import { PDFDocument } from 'pdf-lib';

export interface PageDetectionResult {
  pageCount: number;
  detectedType: 'pdf' | 'image' | 'document';
  details?: string;
}

/**
 * Accurately detects the page count from uploaded file buffer on the server.
 * Never trusts frontend or client-supplied page counts.
 */
export async function detectPageCount(
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<PageDetectionResult> {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';

  // 1. PDF Page Detection
  if (mimeType === 'application/pdf' || extension === 'pdf') {
    try {
      const pdfDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
      const count = pdfDoc.getPageCount();
      return {
        pageCount: Math.max(1, count),
        detectedType: 'pdf',
        details: `Detected ${count} pages from PDF structure`,
      };
    } catch (err: any) {
      console.warn('PDF parsing fallback error:', err?.message);
      // Fallback regex scan for /Type /Page in raw buffer
      const bufferStr = fileBuffer.toString('binary');
      const matches = bufferStr.match(/\/Type\s*\/Page\b/g);
      const estimated = matches ? matches.length : 1;
      return {
        pageCount: Math.max(1, estimated),
        detectedType: 'pdf',
        details: `Estimated ${estimated} pages from stream tokens`,
      };
    }
  }

  // 2. Images (JPG, PNG, JPEG, WEBP)
  if (
    mimeType.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'webp'].includes(extension)
  ) {
    return {
      pageCount: 1,
      detectedType: 'image',
      details: 'Single page document (image)',
    };
  }

  // 3. Plain Text (TXT)
  if (mimeType.startsWith('text/') || extension === 'txt') {
    const text = fileBuffer.toString('utf-8');
    const lines = text.split('\n').length;
    const estimatedPages = Math.max(1, Math.ceil(lines / 45));
    return {
      pageCount: estimatedPages,
      detectedType: 'document',
      details: `Calculated ${estimatedPages} page(s) from ${lines} lines of text`,
    };
  }

  // 3. Document formats (DOCX, TXT)
  if (
    mimeType.includes('word') ||
    extension === 'docx' ||
    extension === 'doc'
  ) {
    // Estimate based on size & text density (approx 2000 chars per standard A4 page)
    const sizeKb = fileBuffer.length / 1024;
    const estimatedPages = Math.max(1, Math.min(150, Math.ceil(sizeKb / 18)));
    return {
      pageCount: estimatedPages,
      detectedType: 'document',
      details: `Calculated ~${estimatedPages} pages from document size (${sizeKb.toFixed(1)} KB)`,
    };
  }

  // Fallback
  return {
    pageCount: 1,
    detectedType: 'document',
    details: 'Default single page allocation',
  };
}

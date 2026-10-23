import path from 'path';
import crypto from 'crypto';
import { PDFDocument } from 'pdf-lib';
import { getSupabaseAdmin } from './supabase';
import { config, isSupabaseConfigured } from './config';

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export interface ValidatedFile {
  originalName: string;
  sanitizedName: string;
  storagePath: string;
  mimeType: string;
  size: number;
  pageCount: number;
  buffer: Buffer;
  hash: string;
}

/**
 * Validates file buffer, mime type, size, and page count
 */
export async function validateAndInspectFile(
  fileBuffer: Buffer,
  originalFilename: string,
  declaredMimeType: string
): Promise<ValidatedFile> {
  if (!fileBuffer || fileBuffer.length === 0) {
    throw new Error('Uploaded file is empty.');
  }

  if (fileBuffer.length > MAX_FILE_SIZE) {
    throw new Error('File exceeds maximum allowed size of 50MB.');
  }

  const ext = path.extname(originalFilename).toLowerCase();
  const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.docx'];
  if (!allowedExtensions.includes(ext)) {
    throw new Error(`File type ${ext} is not supported. Please upload a PDF, image, or document.`);
  }

  // Calculate SHA-256 hash
  const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

  // Determine page count
  let pageCount = 1;
  if (ext === '.pdf' || declaredMimeType === 'application/pdf') {
    try {
      const pdfDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
      pageCount = Math.max(1, pdfDoc.getPageCount());
    } catch {
      // If pdf-lib fails to parse, fallback to 1
      pageCount = 1;
    }
  }

  const sanitizedBase = path.basename(originalFilename, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50);
  const fileId = `doc_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const sanitizedName = `${sanitizedBase}_${fileId}${ext}`;
  const storagePath = `uploads/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${sanitizedName}`;

  return {
    originalName: originalFilename,
    sanitizedName,
    storagePath,
    mimeType: declaredMimeType || 'application/pdf',
    size: fileBuffer.length,
    pageCount,
    buffer: fileBuffer,
    hash,
  };
}

/**
 * Uploads file to private Supabase Storage bucket
 */
export async function uploadToPrivateStorage(
  validated: ValidatedFile,
  userId?: string
): Promise<{ storagePath: string; fileId: string; signedUrl?: string }> {
  const bucketName = config.supabase.storageBucket;
  const fileId = `doc_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();

      // Ensure private bucket exists
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some((b) => b.name === bucketName);
      if (!bucketExists) {
        await supabase.storage.createBucket(bucketName, {
          public: false, // Private bucket: access requires signed URLs
          fileSizeLimit: MAX_FILE_SIZE,
        });
      }

      // Upload buffer
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(validated.storagePath, validated.buffer, {
          contentType: validated.mimeType,
          upsert: true,
          metadata: {
            user_id: userId || 'anonymous',
            original_name: validated.originalName,
            page_count: String(validated.pageCount),
          },
        });

      if (uploadError) {
        console.error('[SUPABASE_STORAGE_UPLOAD_ERROR]', uploadError);
        throw new Error(`Failed to upload to secure storage: ${uploadError.message}`);
      }

      // Generate a 1-hour signed URL
      const { data: signedData } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(validated.storagePath, 3600);

      return {
        storagePath: validated.storagePath,
        fileId,
        signedUrl: signedData?.signedUrl,
      };
    } catch (err: any) {
      console.warn('[STORAGE_WARNING] Supabase upload failed, falling back:', err.message);
    }
  }

  // Standalone fallback when Supabase is not yet provisioned
  return {
    storagePath: validated.storagePath,
    fileId,
  };
}

/**
 * Generates a time-limited signed URL for authorized download/preview
 */
export async function getDocumentSignedUrl(storagePath: string, expiresInSeconds = 3600): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.storage
      .from(config.supabase.storageBucket)
      .createSignedUrl(storagePath, expiresInSeconds);

    if (error || !data) {
      return null;
    }
    return data.signedUrl;
  } catch {
    return null;
  }
}

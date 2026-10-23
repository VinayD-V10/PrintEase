import { Router, Response } from 'express';
import multer from 'multer';
import { validateAndInspectFile, uploadToPrivateStorage, getDocumentSignedUrl } from '../storage';
import { optionalAuth, requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { getSupabaseAdmin } from '../supabase';
import { isSupabaseConfigured } from '../config';

const router = Router();

// Configure Multer with memory storage (no temporary files on local disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

/**
 * POST /api/upload
 * Multipart file upload: validates document and stores in private Supabase Storage
 */
router.post('/', optionalAuth, upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded. Please select a document to upload.' });
      return;
    }

    const originalName = req.file.originalname || 'document.pdf';
    const mimeType = req.file.mimetype || 'application/pdf';

    // 1. Inspect and validate file
    const validated = await validateAndInspectFile(req.file.buffer, originalName, mimeType);

    // 2. Upload to private Supabase Storage bucket
    const uploadResult = await uploadToPrivateStorage(validated, req.user?.id);

    // 3. Record metadata in uploaded_files table
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        await supabase.from('uploaded_files').insert({
          id: uploadResult.fileId,
          user_id: req.user?.id || null,
          original_name: validated.originalName,
          stored_name: validated.sanitizedName,
          storage_path: uploadResult.storagePath,
          mime_type: validated.mimeType,
          file_size: validated.size,
          page_count: validated.pageCount,
          created_at: new Date().toISOString(),
          is_deleted: false,
        });
      } catch (dbErr) {
        console.warn('[DB_UPLOAD_METADATA_WARNING]', dbErr);
      }
    }

    res.json({
      success: true,
      file_id: uploadResult.fileId,
      file_name: validated.originalName,
      file_size: validated.size,
      mime_type: validated.mimeType,
      page_count: validated.pageCount,
      storage_path: uploadResult.storagePath,
      signed_url: uploadResult.signedUrl,
      created_at: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[UPLOAD_ERROR]', err);
    res.status(400).json({ error: err.message || 'File upload failed.' });
  }
});

/**
 * GET /api/documents/:fileId/signed-url
 * Generates a temporary signed URL for authorized document access (Customer owner or Print shop staff)
 */
router.get('/:fileId/signed-url', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const fileId = String(req.params.fileId);
    const caller = req.user!;

    if (!isSupabaseConfigured()) {
      res.status(503).json({ error: 'Storage service not configured.' });
      return;
    }

    const supabase = getSupabaseAdmin();
    const { data: record, error } = await supabase
      .from('uploaded_files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (error || !record) {
      res.status(404).json({ error: 'Document not found.' });
      return;
    }

    // Authorization check: Customer can only access their own documents, Owners can access any order document
    const isOwnerOrStaff = caller.role === 'admin' || caller.role === 'staff';
    const isFileOwner = record.user_id === caller.id;

    if (!isOwnerOrStaff && !isFileOwner) {
      res.status(403).json({ error: 'Access denied. You do not have permission to view this document.' });
      return;
    }

    const signedUrl = await getDocumentSignedUrl(record.storage_path, 3600);
    if (!signedUrl) {
      res.status(500).json({ error: 'Could not generate signed access URL for this document.' });
      return;
    }

    res.json({
      success: true,
      file_id: fileId,
      file_name: record.original_name,
      signed_url: signedUrl,
      expires_in_seconds: 3600,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to retrieve document URL.' });
  }
});

export default router;

import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Trash2,
  FolderLock,
  Printer,
  RefreshCw,
  Plus,
  CheckCircle2,
  FileCheck,
  Check,
} from 'lucide-react';
import { Order, RetentionChoice } from '../types/printease';

export interface StoredFileItem {
  file_id: string;
  order_id: string;
  file_name: string;
  page_count: number;
  file_size: number;
  created_at: string;
  file_expires_at?: string;
  file_deleted?: boolean;
  retention_choice?: RetentionChoice;
  storage_place?: string;
}

interface StoredFilesViewProps {
  orders: Order[];
  onStartPrintNew: () => void;
  onPrintExistingFile: (fileName: string, pageCount: number, fileId: string) => void;
  onRefreshOrders?: () => void;
}

export const StoredFilesView: React.FC<StoredFilesViewProps> = ({
  orders,
  onStartPrintNew,
  onPrintExistingFile,
  onRefreshOrders,
}) => {
  const [files, setFiles] = useState<StoredFileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<StoredFileItem | null>(null);
  const [alertBanner, setAlertBanner] = useState<string | null>(null);

  // Load only stored files from server
  const loadStoredFiles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/user/stored-documents');
      if (res.ok) {
        const data = await res.json();
        // Show ONLY stored active files (filter out deleted)
        const activeOnly = (data.documents || []).filter((d: StoredFileItem) => !d.file_deleted);
        setFiles(activeOnly);
        setLoading(false);
        return;
      }
    } catch (e) {
      console.warn('API error, deriving stored files from orders:', e);
    }

    // Fallback: derive from orders
    const map = new Map<string, StoredFileItem>();
    for (const ord of orders) {
      if (!ord.file_deleted && !map.has(ord.file_id)) {
        map.set(ord.file_id, {
          file_id: ord.file_id,
          order_id: ord.order_id,
          file_name: ord.file_name,
          page_count: ord.page_count,
          file_size: ord.file_size,
          created_at: ord.created_at,
          file_expires_at: ord.file_expires_at,
          file_deleted: false,
          retention_choice: ord.retention_choice || 'PERMANENT',
          storage_place: ord.storage_place || 'PrintEase Secure Server Vault (/storage/private/uploads/)',
        });
      }
    }
    setFiles(Array.from(map.values()));
    setLoading(false);
  };

  useEffect(() => {
    loadStoredFiles();
  }, [orders]);

  // Click on "Permanently Stored": Permanently stores the file in vault
  const handlePermanentlyStore = async (item: StoredFileItem) => {
    setActionLoadingId(item.file_id);
    try {
      const res = await fetch(`/api/files/${item.file_id}/retention`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retention_choice: 'PERMANENT' }),
      });
      if (res.ok) {
        // Update local file state immediately
        setFiles((prev) =>
          prev.map((f) =>
            f.file_id === item.file_id ? { ...f, retention_choice: 'PERMANENT' } : f
          )
        );
        setAlertBanner(`"${item.file_name}" is now Permanently Stored in your vault!`);
        setTimeout(() => setAlertBanner(null), 4000);
        if (onRefreshOrders) onRefreshOrders();
      }
    } catch (e) {
      alert('Failed to update storage.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Click on "Delete": Permanently deletes the file from server storage
  const handleDeleteFile = async (item: StoredFileItem) => {
    setActionLoadingId(item.file_id);
    try {
      const res = await fetch(`/api/files/${item.file_id}`, { method: 'DELETE' });
      const data = await res.json();
      
      // Remove file from stored files view immediately
      setFiles((prev) => prev.filter((f) => f.file_id !== item.file_id));
      setAlertBanner(data.message || `File "${item.file_name}" permanently deleted from server storage.`);
      setTimeout(() => setAlertBanner(null), 4000);
      setConfirmDelete(null);
      if (onRefreshOrders) onRefreshOrders();
    } catch (e: any) {
      alert('Error deleting file: ' + e.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 mb-12">
      {/* Top Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
              <FolderLock className="w-3.5 h-3.5 text-emerald-600" />
              <span>User Storage Place</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Stored Files
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
              All files sent for printing are stored here. Click <strong>Permanently Stored</strong> to keep a file indefinitely, or click <strong>Delete</strong> to permanently delete the file from storage.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={loadStoredFiles}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
              title="Refresh Files"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onStartPrintNew}
              className="btn-smooth btn-dual-shimmer px-5 py-2.5 text-[#FFF5E1] text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#FFF5E1]" />
              <span>Upload New File</span>
            </button>
          </div>
        </div>

        {/* Storage Place Banner */}
        <div className="mt-5 p-3.5 rounded-2xl bg-gradient-to-br from-[#422C09] via-[#5A3C0B] to-[#422C09] text-[#FFF5E1] flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-[#C48B28]/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#C48B28]/25 flex items-center justify-center text-[#FFF5E1] font-bold shrink-0">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#EBC176] uppercase tracking-wider block">
                Storage Place on Server Disk
              </span>
              <span className="font-mono text-xs font-bold text-[#FFF5E1]">
                /storage/private/uploads/
              </span>
            </div>
          </div>
          <span className="text-xs text-[#FFF5E1]/80 font-medium">
            {files.length} Stored {files.length === 1 ? 'Document' : 'Documents'}
          </span>
        </div>
      </div>

      {alertBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs sm:text-sm font-bold rounded-2xl flex items-center gap-2 shadow-xs animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{alertBanner}</span>
        </div>
      )}

      {/* Files List: Shows ONLY stored files */}
      {files.length === 0 ? (
        <div className="bg-[#FFF5E1]/90 rounded-3xl border border-[#C48B28]/30 p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-[#C48B28]/15 text-[#C48B28] flex items-center justify-center mx-auto mb-4">
            <HardDrive className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-[#422C09] mb-1">No Stored Files</h3>
          <p className="text-xs sm:text-sm text-[#5A3C0B]/80 max-w-sm mx-auto mb-6">
            All files you send for printing will appear here in Stored Files. You can click Permanently Stored or Delete on any file.
          </p>
          <button
            onClick={onStartPrintNew}
            className="btn-smooth btn-dual-shimmer px-6 py-3 text-[#FFF5E1] font-bold text-sm rounded-xl transition-colors cursor-pointer"
          >
            Send First Document for Printing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {files.map((file) => {
            const isPermanent = file.retention_choice === 'PERMANENT';

            return (
              <div
                key={file.file_id}
                className="bg-white rounded-2xl border border-[#C48B28]/30 hover:border-[#C48B28] p-5 sm:p-6 transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* File Information */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-base text-slate-900 truncate max-w-md">
                      {file.file_name}
                    </span>

                    {/* Stored Status Badge */}
                    {isPermanent ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-black uppercase tracking-wider flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Permanently Stored</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[11px] font-black uppercase tracking-wider flex items-center gap-1">
                        <span>Temporary File</span>
                      </span>
                    )}

                    <span className="text-xs text-slate-400 font-mono">
                      (Order #{file.order_id})
                    </span>
                  </div>

                  {/* Metadata & Storage Place */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span className="font-bold text-[#422C09] bg-[#C48B28]/15 px-2 py-0.5 rounded-md border border-[#C48B28]/30">
                      📄 {file.page_count} Pages
                    </span>
                    <span>• {(file.file_size / (1024 * 1024)).toFixed(2)} MB</span>
                    <span className="font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md text-[11px] border border-slate-200">
                      📍 Storage: /storage/private/uploads/
                    </span>
                    <span className="text-slate-400">
                      Sent on {new Date(file.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* BESIDE EACH FILE: PERMANENTLY STORED BUTTON & DELETE BUTTON */}
                <div className="flex flex-wrap items-center gap-2.5 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                  {/* Button 1: Permanently Stored */}
                  <button
                    type="button"
                    disabled={actionLoadingId === file.file_id}
                    onClick={() => handlePermanentlyStore(file)}
                    className={`px-4 py-2.5 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                      isPermanent
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-600/20'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                    }`}
                    title={isPermanent ? 'File is permanently stored' : 'Click to store this file permanently'}
                  >
                    <FolderLock className="w-4 h-4" />
                    <span>{isPermanent ? 'Permanently Stored ✓' : 'Permanently Stored'}</span>
                  </button>

                  {/* Button 2: Delete Option (Permanently Deletes File) */}
                  <button
                    type="button"
                    disabled={actionLoadingId === file.file_id}
                    onClick={() => setConfirmDelete(file)}
                    className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Permanently delete this file from storage"
                  >
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <span>Delete</span>
                  </button>

                  {/* Re-Print action */}
                  <button
                    type="button"
                    onClick={() => onPrintExistingFile(file.file_name, file.page_count, file.file_id)}
                    className="p-2.5 bg-[#FFF5E1] hover:bg-[#FDF6E8] text-[#422C09] rounded-xl border border-[#C48B28]/40 transition-colors cursor-pointer"
                    title="Send for printing again"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CONFIRM PERMANENT DELETE MODAL */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Trash2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-1">
                Permanently Delete File?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mb-4">
                Are you sure you want to permanently delete <strong>{confirmDelete.file_name}</strong> from server storage?
              </p>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-left text-xs text-slate-600 space-y-1 mb-4 font-mono">
                <div><strong>Storage Place:</strong> /storage/private/uploads/</div>
                <div><strong>Pages:</strong> {confirmDelete.page_count} pages</div>
                <div><strong>Size:</strong> {(confirmDelete.file_size / 1024).toFixed(1)} KB</div>
              </div>
              <p className="text-[11px] text-rose-600 font-semibold">
                ⚠️ This file will be permanently deleted and removed from your Stored Files.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="w-1/2 py-2.5 border border-slate-300 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteFile(confirmDelete)}
                className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md shadow-rose-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

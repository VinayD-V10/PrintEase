import React, { useState, useEffect } from 'react';
import { Server, CheckCircle2, AlertCircle, ExternalLink, X, RefreshCw } from 'lucide-react';
import { getApiBaseUrl, setApiBaseUrl, isGitHubPages, apiUrl } from '../config/api';

interface BackendConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved?: () => void;
}

export const BackendConfigModal: React.FC<BackendConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  const [url, setUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    smtpStatus?: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setUrl(getApiBaseUrl());
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const targetBase = url.trim().replace(/\/$/, '');
      const testEndpoint = targetBase ? `${targetBase}/api/health` : '/api/health';

      const res = await fetch(testEndpoint, {
        headers: { 'Accept': 'application/json' },
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        const text = await res.text();
        const cleanSnippet = text.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
        setTestResult({
          success: false,
          message: `Target URL returned HTML (${res.status}): ${cleanSnippet || 'Not an Express API endpoint.'}`,
        });
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setTestResult({
          success: true,
          message: `Connected successfully! PrintEase API is online (Supabase: ${data.supabaseConfigured ? 'Configured' : 'Needs environment variables'}).`,
        });
      } else {
        const errorText = await res.text();
        setTestResult({
          success: false,
          message: `Backend responded with HTTP ${res.status}: ${errorText.slice(0, 120) || res.statusText}`,
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Connection failed: ${err.message || 'Network error / CORS issue'}. Ensure your Vercel backend has CORS enabled.`,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    setApiBaseUrl(url.trim());
    if (onConfigSaved) onConfigSaved();
    onClose();
  };

  const handleResetToDefault = () => {
    setUrl('');
    setApiBaseUrl(null);
    if (onConfigSaved) onConfigSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-lg">Backend API Configuration</h3>
              <p className="text-xs text-slate-500">Connect GitHub Pages to your live serverless backend</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4">
          {isGitHubPages() && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300">
              <p className="font-medium">GitHub Pages Architecture Notice:</p>
              <p className="mt-1">
                GitHub Pages hosts static files only. Email dispatch, OTPs, and orders require a deployed backend (e.g. on Vercel, Render, or Railway).
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Deployed Backend URL (Vercel / Render / Cloud Run)
            </label>
            <input
              type="url"
              placeholder="https://printease-api.vercel.app"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Leave blank to use relative <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">/api</code> on localhost or full-stack hosting.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleTestConnection}
              disabled={testing}
              className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Server className="w-3.5 h-3.5" />}
              Test Connection
            </button>
            <button
              onClick={handleResetToDefault}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Reset
            </button>
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                testResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-semibold">{testResult.success ? 'Backend Online' : 'Connection Failed'}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed">{testResult.message}</p>
              </div>
            </div>
          )}

          <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Active Target:</span>
              <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                {apiUrl('/api/auth/send-otp')}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[PrintEase ErrorBoundary] Uncaught runtime exception caught:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleClearStorage = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    this.handleReset();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FFF5E1] text-[#422C09] flex items-center justify-center p-4 antialiased selection:bg-[#C48B28] selection:text-[#FFF5E1]">
          <div className="w-full max-w-lg bg-[#422C09] border border-[#C48B28]/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden card-smooth text-[#FFF5E1]">
            {/* Ambient glows in Color 1 and Color 3 */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#C48B28]/20 rounded-full blur-3xl pointer-events-none animate-dual-glow" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#C48B28] to-[#EBC176] text-[#422C09] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#C48B28]/30 animate-float-smooth">
                <AlertTriangle className="w-8 h-8 text-[#422C09]" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C48B28]/20 border border-[#C48B28]/40 text-[#EBC176] text-xs font-bold uppercase tracking-wider mb-2">
                <ShieldAlert className="w-3.5 h-3.5 text-[#EBC176]" />
                <span>Graceful Recovery Shield</span>
              </div>

              <h1 className="text-2xl font-black tracking-tight text-[#FFF5E1] mb-2">
                Print<span className="text-[#C48B28]">Ease</span> Intercepted An Issue
              </h1>

              <p className="text-xs sm:text-sm text-[#FFF5E1]/80 mb-6 leading-relaxed">
                An unexpected interface exception occurred. The system safely contained the error without risking your document data or print orders.
              </p>

              {this.state.error && (
                <div className="bg-[#1F1608]/90 border border-[#C48B28]/30 rounded-xl p-3 mb-6 text-left overflow-auto max-h-32 text-xs font-mono text-[#EBC176]">
                  <p className="font-bold text-rose-400">Error: {this.state.error.message}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="btn-smooth btn-dual-shimmer px-6 py-3 text-[#FFF5E1] font-extrabold text-xs sm:text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reload & Recover</span>
                </button>
                <button
                  type="button"
                  onClick={this.handleClearStorage}
                  className="btn-smooth px-5 py-3 bg-[#5A3C0B] hover:bg-[#422C09] text-[#FFF5E1] font-bold text-xs sm:text-sm rounded-xl border border-[#C48B28]/40 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Home className="w-4 h-4 text-[#EBC176]" />
                  <span>Reset App State</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

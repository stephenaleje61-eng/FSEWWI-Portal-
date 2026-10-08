import React, { Component, ErrorInfo, ReactNode } from 'react';
import { FsewwiLogo } from './FsewwiLogo.tsx';
import { RefreshCw, RotateCcw, ShieldAlert, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('FSEWWI Portal caught unhandled runtime error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('fsewwi_user_session');
      }
    } catch (e) {
      // ignore
    }
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-900 font-sans">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-center">
            
            {/* Header with Seal */}
            <div className="bg-gradient-to-br from-[#0b2d72] via-[#0f388a] to-[#082257] p-6 text-white relative">
              <div className="flex justify-center mb-3">
                <div className="w-20 h-20 bg-white rounded-full p-1.5 shadow-xl border-2 border-amber-300 flex items-center justify-center">
                  <FsewwiLogo size="sm" />
                </div>
              </div>
              <h2 className="text-lg font-black font-serif uppercase tracking-tight text-white">
                FSEWWI Portal Recovery
              </h2>
              <p className="text-xs text-purple-200 mt-1">
                Foundation for the Support &amp; Empowerment of Widows &amp; Widowers Initiative
              </p>
            </div>

            {/* Error Content */}
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <ShieldAlert className="w-6 h-6 stroke-[2.5]" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Page Display Notice
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  A transient display interruption occurred while loading this view on your device. Your registered data in the database remains completely safe.
                </p>
              </div>

              {this.state.error && (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-left">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Diagnostic Note
                  </span>
                  <p className="text-[11px] font-mono text-slate-700 break-words mt-0.5 line-clamp-3">
                    {this.state.error.message || 'Unknown render interruption'}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={this.handleReload}
                  className="w-full py-3 bg-[#0f388a] hover:bg-[#0b2d72] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Reload Portal</span>
                </button>

                <button
                  type="button"
                  onClick={this.handleReset}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Reset Session &amp; Return to Login</span>
                </button>
              </div>

              <div className="pt-2 text-[10px] text-slate-400">
                Official Helpline: 07081470032 &bull; Headquarters: Makurdi, Benue State
              </div>
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

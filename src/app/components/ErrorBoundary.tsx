import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {
    // Error is already captured in state for UI; optionally send to reporting service here.
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex items-center justify-center bg-[var(--qc-panel)] p-6">
          <div className="max-w-md w-full p-6 rounded-lg border border-[var(--qc-fail)] bg-[var(--qc-fail-bg)]">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-[var(--qc-fail)]" />
              <h2 className="text-lg font-semibold text-[var(--qc-fail)]">Application Error</h2>
            </div>
            <p className="text-sm text-white/80 mb-4">
              Something went wrong. The application encountered an error and needs to reload.
            </p>
            {this.state.error && (
              <details className="mb-4">
                <summary className="text-xs text-white/60 cursor-pointer mb-2">Error details</summary>
                <pre className="text-xs text-white/50 bg-black/30 p-2 rounded overflow-auto max-h-32">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded bg-[var(--qc-fail)] text-white hover:opacity-90 transition-opacity text-sm"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

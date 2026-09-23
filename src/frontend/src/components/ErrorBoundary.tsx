/**
 * ErrorBoundary.tsx — Catches unhandled render errors and emits analytics events.
 * Wraps the root app so no unhandled React crash goes unreported.
 */

import { Component, type ErrorInfo, type ReactNode } from "react";
import { analytics } from "../services/analyticsService";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    analytics.track({
      category: "error",
      action: "react_render_error",
      errorMessage: `${error.message} | ${info.componentStack?.slice(0, 200) ?? ""}`,
      success: false,
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div
          className="min-h-screen bg-background flex items-center justify-center p-6"
          data-ocid="error_boundary.error_state"
        >
          <div className="bg-card rounded-2xl p-8 max-w-md w-full text-center shadow-card border border-border">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="font-display font-bold text-xl text-foreground mb-2">
              Something went wrong
            </h2>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
              MoneyDrive encountered an unexpected error. Your data is safe —
              refresh the page to continue.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="bg-primary text-primary-foreground font-bold py-2.5 px-6 rounded-xl transition-opacity hover:opacity-90"
              data-ocid="error_boundary.reload_button"
            >
              Refresh Page
            </button>
            {this.state.error && (
              <p className="text-xs text-muted-foreground mt-4 font-mono break-all">
                {this.state.error.message}
              </p>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

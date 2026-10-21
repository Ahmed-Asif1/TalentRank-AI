"use client";

import React, { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { AlertCircle } from "lucide-react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="rounded-[2rem] border border-destructive/20 bg-destructive/5 p-6 sm:p-8 backdrop-blur-xl flex flex-col items-center justify-center text-center space-y-4">
          <div className="bg-destructive/10 text-destructive flex h-16 w-16 items-center justify-center rounded-3xl shadow-inner">
            <AlertCircle className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-destructive">Something went wrong</h3>
            <p className="text-muted-foreground mt-2 max-w-sm text-sm">
              We encountered an error rendering this section. The rest of the application should still work.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

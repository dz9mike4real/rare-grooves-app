'use client';

import { Component, ReactNode } from 'react';
import { Button } from '@mantine/core';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[v0] Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <div className="glass-card p-8 rounded-2xl max-w-md">
            <AlertTriangle className="h-12 w-12 text-[#0a4d7f] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">
              Something went wrong
            </h2>
            <p className="text-white/60 mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <Button
              onClick={this.handleReset}
              className="gradient-bg border-0"
              leftSection={<RefreshCw className="h-4 w-4" />}
            >
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

'use client';

import { Component, ReactNode, ErrorInfo } from 'react';
import { TrackCardSkeleton } from './track-card-skeleton';

interface Props {
  children: ReactNode;
  trackId: string;
}

interface State {
  hasError: boolean;
}

export class TrackCardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[v0] Error in track card ${this.props.trackId}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <TrackCardSkeleton />;
    }

    return this.props.children;
  }
}

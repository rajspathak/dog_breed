import { Component, type ErrorInfo, type ReactNode } from 'react';

import { ErrorState } from './ErrorState';

type Props = {
  name: string;
  children: ReactNode;
  fallback?: (reset: () => void, error: Error) => ReactNode;
  onError?: (error: Error, info: ErrorInfo, name: string) => void;
};

type State = {
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: unknown): State {
    return { error: error instanceof Error ? error : new Error(String(error)) };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(error, info, this.props.name);
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  override render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(this.reset, error);
    return (
      <ErrorState
        title={`${this.props.name} ran into a problem`}
        message="This section crashed, but the rest of the app is still working."
        actionLabel="Try again"
        onAction={this.reset}
      />
    );
  }
}

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State {
  error: Error | null;
  info: ErrorInfo | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.setState({ error, info });
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  reset = (): void => {
    this.setState({ error: null, info: null });
  };

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="p-6 text-sm">
          <div className="rounded-md border border-danger/40 bg-danger/10 p-4 space-y-3">
            <div className="font-semibold text-danger">Renderer error</div>
            <pre className="whitespace-pre-wrap font-mono text-xs">
              {this.state.error.message}
            </pre>
            {this.state.error.stack && (
              <details className="text-xs text-fg-muted">
                <summary className="cursor-pointer">Stack</summary>
                <pre className="whitespace-pre-wrap font-mono mt-2">{this.state.error.stack}</pre>
              </details>
            )}
            {this.state.info?.componentStack && (
              <details className="text-xs text-fg-muted">
                <summary className="cursor-pointer">Component stack</summary>
                <pre className="whitespace-pre-wrap font-mono mt-2">
                  {this.state.info.componentStack}
                </pre>
              </details>
            )}
            <button
              onClick={this.reset}
              className="rounded-md border border-border bg-bg-card px-3 py-1 text-xs hover:border-fg-subtle"
            >
              Reset
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

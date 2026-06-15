import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props { children: ReactNode; label?: string; }
interface State { hasError: boolean; message: string; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err.message };
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary:${this.props.label ?? 'root'}]`, err, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32 }}>
          <h2 style={{ color: '#DC2626', marginBottom: 8 }}>Something went wrong</h2>
          <p style={{ fontSize: 13, color: 'var(--gray-mid)', marginBottom: 20 }}>{this.state.message}</p>
          <button
            className="btn btn-outline"
            onClick={() => this.setState({ hasError: false, message: '' })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

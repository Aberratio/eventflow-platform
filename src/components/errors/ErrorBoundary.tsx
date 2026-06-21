import { Component, ErrorInfo, ReactNode } from 'react';
import { StatusErrorPage } from './StatusErrorPage';

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

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    const { error } = this.state;

    return (
      <StatusErrorPage
        code="500"
        title="Coś poszło nie tak!"
        description={
          <>
            Aplikacja napotkała nieoczekiwany błąd.
            <br />
            Nasz zespół został już o tym poinformowany.
          </>
        }
        onPrimaryClick={this.handleReset}
        details={error ? `${error.name}: ${error.message}` : undefined}
      />
    );
  }
}

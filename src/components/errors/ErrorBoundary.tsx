import { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorPageShell } from '@/components/ui/error-page-shell';
import { AnimatedStopwatch } from './AnimatedStopwatch';
import { SparkEffect } from './SparkEffect';
import { GlitchText } from './GlitchText';
import { Button } from '@/components/ui/button';

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

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <ErrorPageShell tint="destructive">
        <div className="relative">
          <AnimatedStopwatch status="error" className="relative z-10" />
          <SparkEffect intensity="medium" />
        </div>

        <GlitchText className="text-7xl text-destructive md:text-8xl" intensity="medium">
          CRASH
        </GlitchText>

        <div className="space-y-4">
          <p className="text-2xl font-bold text-foreground md:text-3xl">
            Coś poszło nie tak!
          </p>
          <p className="text-lg text-muted-foreground">
            Aplikacja napotkała nieoczekiwany błąd.
          </p>

          {this.state.error && (
            <div className="overflow-hidden rounded-lg border border-border bg-card p-3 text-left font-mono text-xs">
              <div className="text-destructive">{this.state.error.name}: {this.state.error.message}</div>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center gap-3 pt-4 sm:flex-row">
          <Button onClick={this.handleReset} size="lg" className="gap-2">
            <span>🔄</span>
            <span>Spróbuj ponownie</span>
          </Button>
          <Button onClick={this.handleReload} variant="outline" size="lg" className="gap-2">
            <span>🏠</span>
            <span>Przeładuj stronę</span>
          </Button>
        </div>

        <p className="pt-4 text-xs italic text-muted-foreground/50">
          "Każdy upadek to szansa na lepszy start..." 🏃
        </p>
      </ErrorPageShell>
    );
  }
}

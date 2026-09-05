import React, { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary capturou erro:', error, errorInfo);
  }

  public handleRecover = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center select-none font-sans">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md shadow-2xl space-y-4">
            <h2 className="text-xl font-bold text-white">OdontoWeb - Restauração Rápida</h2>
            <p className="text-xs text-slate-400">Clique abaixo para recarregar o sistema com os dados zerados e seguros.</p>
            <button
              onClick={this.handleRecover}
              className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-slate-950 font-black px-6 py-3 rounded-2xl text-xs w-full cursor-pointer shadow-lg shadow-teal-500/20"
            >
              🔄 Entrar no OdontoWeb
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

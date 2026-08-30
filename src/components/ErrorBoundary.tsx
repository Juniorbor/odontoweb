import React, { Component, type ReactNode } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary capturou um erro não tratado:', error, errorInfo);
  }

  public handleReload = () => {
    window.location.reload();
  };

  public handleResetCache = () => {
    // Remove chaves corrompidas de cache temporario e recarrega
    sessionStorage.clear();
    window.location.href = window.location.origin;
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md shadow-2xl space-y-4">
            <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto text-rose-400">
              <ShieldAlert className="w-8 h-8 animate-bounce" />
            </div>
            
            <h2 className="text-xl font-extrabold text-white">
              Sistema OdontoWeb - Proteção Ativa
            </h2>

            <p className="text-xs text-slate-400 leading-relaxed">
              {this.props.fallbackMessage ||
                'Ocorreu uma pequena instabilidade de renderização gráfica. O sistema isolou a exceção com segurança para proteger seus dados.'}
            </p>

            <div className="space-y-2 pt-2">
              <button
                onClick={this.handleReload}
                className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-slate-950 font-black px-6 py-3 rounded-2xl text-xs flex items-center justify-center gap-2 w-full shadow-lg shadow-teal-600/30 cursor-pointer transition-all"
              >
                <RefreshCw className="w-4 h-4" /> Recarregar OdontoWeb
              </button>

              <button
                onClick={this.handleResetCache}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2.5 rounded-2xl text-xs w-full transition-colors cursor-pointer"
              >
                🧹 Limpar Cache & Ir para Início
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

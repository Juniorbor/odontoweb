import React, { useState } from 'react';
import { Bot, Sparkles, TrendingUp, AlertTriangle, Lightbulb, RefreshCw } from 'lucide-react';
import type { TransacaoPessoal } from '../types';

interface AIFinBotProps {
  transacoesFinanceiras: TransacaoPessoal[];
  darkMode?: boolean;
}

export const AIFinBot: React.FC<AIFinBotProps> = ({
  transacoesFinanceiras
}) => {
  const [analisando, setAnalisando] = useState<boolean>(false);

  const receitaBrutaTotal = transacoesFinanceiras.filter((t) => t.tipo === 'Entrada').reduce((acc, t) => acc + t.valor, 0);

  const despesasFixas = transacoesFinanceiras.filter((t) => t.tipo === 'Despesa Fixa').reduce((acc, t) => acc + t.valor, 0);
  const despesasVariaveis = transacoesFinanceiras.filter((t) => t.tipo === 'Despesa Variável').reduce((acc, t) => acc + t.valor, 0);
  const totalGastos = despesasFixas + despesasVariaveis;

  const saldoLiquido = receitaBrutaTotal - totalGastos;
  const comprometimentoPct = receitaBrutaTotal > 0 ? Math.round((totalGastos / receitaBrutaTotal) * 100) : 0;

  let scoreSaude = 100;
  if (comprometimentoPct > 80) scoreSaude -= 40;
  else if (comprometimentoPct > 60) scoreSaude -= 20;
  if (saldoLiquido < 0) scoreSaude -= 30;

  scoreSaude = Math.max(10, Math.min(100, scoreSaude));

  const reanalisar = () => {
    setAnalisando(true);
    setTimeout(() => setAnalisando(false), 800);
  };

  return (
    <div className="card-clinical p-6 sm:p-7 space-y-5 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-sky-50 text-sky-700 rounded-2xl border border-sky-200 shrink-0">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200 uppercase tracking-wider inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-600" /> Inteligência Preditiva
            </span>
            <h3 className="text-base sm:text-lg font-extrabold mt-1 text-slate-900">
              Assistente FinBot & Diagnóstico Orçamentário
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-600 uppercase font-extrabold block">Score Financeiro</span>
            <span className={`text-xl font-extrabold ${
              scoreSaude >= 80 ? 'text-emerald-700' : scoreSaude >= 50 ? 'text-amber-700' : 'text-rose-700'
            }`}>
              {scoreSaude} / 100 PTS
            </span>
          </div>

          <button
            onClick={reanalisar}
            disabled={analisando}
            className="p-2.5 bg-slate-50 hover:bg-sky-50 text-sky-700 rounded-xl border border-slate-200 cursor-pointer transition-all"
            title="Recalcular Análise de IA"
          >
            <RefreshCw className={`w-4 h-4 ${analisando ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1.5">
          <div className="flex items-center gap-1.5 text-teal-800 font-extrabold">
            <TrendingUp className="w-4 h-4 text-teal-700" /> Balanço Atual do Lar
          </div>
          <p className="text-slate-700 font-medium leading-relaxed">
            Saldo líquido de <strong className={`font-extrabold ${saldoLiquido >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>R$ {saldoLiquido.toLocaleString('pt-BR')}</strong> no mês atual.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1.5">
          <div className="flex items-center gap-1.5 text-amber-800 font-extrabold">
            <AlertTriangle className="w-4 h-4 text-amber-600" /> Comprometimento
          </div>
          <p className="text-slate-700 font-medium leading-relaxed">
            Custos fixos e variáveis comprometem <strong className="text-amber-800 font-extrabold">{comprometimentoPct}%</strong> das entradas.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1.5">
          <div className="flex items-center gap-1.5 text-sky-800 font-extrabold">
            <Lightbulb className="w-4 h-4 text-sky-700" /> Recomendação
          </div>
          <p className="text-slate-700 font-medium leading-relaxed">
            {comprometimentoPct > 70
              ? 'Considere renegociar despesas fixas ou limitar compras parceladas.'
              : 'Excelente controle financeiro! Mantenha aportes na reserva.'}
          </p>
        </div>
      </div>
    </div>
  );
};

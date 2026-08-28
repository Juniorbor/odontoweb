import React, { useState } from 'react';
import { Bot, Sparkles, TrendingUp, AlertTriangle, Lightbulb, RefreshCw } from 'lucide-react';
import type { TransacaoPessoal } from '../types';

interface AIFinBotProps {
  transacoesFinanceiras: TransacaoPessoal[];
  darkMode?: boolean;
}

export const AIFinBot: React.FC<AIFinBotProps> = ({
  transacoesFinanceiras,
  darkMode
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
    <div className={`p-6 rounded-3xl border shadow-xl space-y-4 font-sans ${
      darkMode ? 'bg-gradient-to-r from-slate-900 via-slate-950 to-teal-950/80 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
    }`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-teal-500/10 text-teal-400 rounded-2xl border border-teal-500/20 shrink-0">
            <Bot className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/30 uppercase tracking-widest flex items-center gap-1 w-fit">
              <Sparkles className="w-3 h-3 text-amber-400" /> Inteligência Preditiva de Finanças
            </span>
            <h3 className="text-xl font-bold mt-1 flex items-center gap-2 text-white">
              Assistente FinBot & Diagnóstico de Saúde Orçamentária
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Score da Sua Saúde Financial</span>
            <span className={`text-2xl font-black ${
              scoreSaude >= 80 ? 'text-emerald-400' : scoreSaude >= 50 ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {scoreSaude} / 100 PTS
            </span>
          </div>

          <button
            onClick={reanalisar}
            disabled={analisando}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-teal-400 rounded-2xl border border-slate-700 cursor-pointer transition-all"
            title="Recalcular Análise de IA"
          >
            <RefreshCw className={`w-4 h-4 ${analisando ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-normal">
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
          <div className="flex items-center gap-1.5 text-teal-400 font-bold">
            <TrendingUp className="w-4 h-4" /> Balanço Atual do Lar
          </div>
          <p className="text-slate-300">
            Você possui um saldo líquido de <strong className={saldoLiquido >= 0 ? 'text-emerald-400' : 'text-rose-400'}>R$ {saldoLiquido.toLocaleString('pt-BR')}</strong> no mês atual.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <AlertTriangle className="w-4 h-4" /> Comprometimento de Renda
          </div>
          <p className="text-slate-300">
            Seus custos fixos e variáveis comprometem <strong className="text-amber-400">{comprometimentoPct}%</strong> das suas entradas cadastradas.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
          <div className="flex items-center gap-1.5 text-purple-400 font-bold">
            <Lightbulb className="w-4 h-4" /> Recomendação Inteligente
          </div>
          <p className="text-slate-300">
            {comprometimentoPct > 70
              ? 'Considere renegociar despesas fixas ou limitar compras parceladas no cartão de crédito.'
              : 'Excelente controle financeiro! Mantenha aportes na sua reserva de emergência.'}
          </p>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Bot, Sparkles, TrendingUp, AlertTriangle, Lightbulb, RefreshCw } from 'lucide-react';
import type { ItemProducaoTomo, TransacaoPessoal } from '../types';

interface AIFinBotProps {
  itensProducao: ItemProducaoTomo[];
  transacoesFinanceiras: TransacaoPessoal[];
  darkMode?: boolean;
}

export const AIFinBot: React.FC<AIFinBotProps> = ({
  itensProducao,
  transacoesFinanceiras,
  darkMode
}) => {
  const [analisando, setAnalisando] = useState<boolean>(false);

  const faturamentoProducao = itensProducao.reduce((acc, i) => acc + i.valor, 0);
  const entradasPessoais = transacoesFinanceiras.filter((t) => t.tipo === 'Entrada').reduce((acc, t) => acc + t.valor, 0);
  const receitaBrutaTotal = faturamentoProducao + entradasPessoais;

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
    <div className={`p-6 rounded-3xl border shadow-xl space-y-4 relative overflow-hidden transition-all ${
      darkMode ? 'bg-gradient-to-br from-slate-900 via-slate-950 to-teal-950/40 border-teal-500/30 text-white' : 'bg-gradient-to-br from-teal-50/50 via-white to-emerald-50/50 border-teal-200 text-slate-900'
    }`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-teal-500/20 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950 rounded-2xl shadow-md shadow-teal-500/20 shrink-0">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded uppercase tracking-wider">
                IA Preditiva 2.0
              </span>
              <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Conselheiro Pessoal
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-0.5">
              FinBot - Assistente de Saúde Financeira & Dicas Inteligentes
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] uppercase text-slate-400 font-semibold block">Score da Sua Saúde Financeira</span>
            <span className={`text-lg font-black ${
              scoreSaude >= 80 ? 'text-emerald-400' : scoreSaude >= 50 ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {scoreSaude} / 100 PTS
            </span>
          </div>

          <button
            onClick={reanalisar}
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-teal-400 hover:text-white cursor-pointer"
            title="Atualizar Análise da IA"
          >
            <RefreshCw className={`w-4 h-4 ${analisando ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-normal">
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-teal-400">
            <TrendingUp className="w-4 h-4 text-teal-400" />
            <span>Desempenho da Produção</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Sua produção unificada acumulada está em <strong>R$ {faturamentoProducao.toLocaleString('pt-BR')}</strong>. Unidades ativas gerando entradas em tempo real.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-amber-400">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Comprometimento da Renda</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            As despesas fixas e variáveis comprometem <strong>{comprometimentoPct}%</strong> da sua renda total. {comprometimentoPct <= 60 ? 'Seu orçamento está saudável!' : 'Atenção para não exceder 70%.'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-emerald-400">
            <Lightbulb className="w-4 h-4 text-emerald-400" />
            <span>Recomendação do FinBot</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            {saldoLiquido >= 0
              ? `Você possui R$ ${saldoLiquido.toLocaleString('pt-BR')} de saldo livre neste mês. Excelente para aportar na Reserva de Emergência!`
              : 'Seus gastos superaram as entradas este mês. Reduza despesas variáveis no cartão de crédito.'}
          </p>
        </div>
      </div>
    </div>
  );
};

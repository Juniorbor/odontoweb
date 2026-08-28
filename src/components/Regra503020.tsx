import React from 'react';
import { Compass } from 'lucide-react';
import type { TransacaoPessoal } from '../types';

interface Regra503020Props {
  transacoes: TransacaoPessoal[];
  darkMode?: boolean;
}

export const Regra503020: React.FC<Regra503020Props> = ({
  transacoes,
  darkMode
}) => {
  const rendaTotalFamiliar = transacoes
    .filter((t) => t.tipo === 'Entrada')
    .reduce((acc, t) => acc + t.valor, 0);

  // 1. Necessidades Básicas (50%): Despesas Fixas (Moradia, Alimentação, Água/Luz)
  const gastosNecessidades = transacoes
    .filter((t) => t.tipo === 'Despesa Fixa')
    .reduce((acc, t) => acc + t.valor, 0);

  // 2. Estilo de Vida & Lazer (30%): Despesas Variáveis / Cartões / Lazer
  const gastosLazerEstiloVida = transacoes
    .filter((t) => t.tipo === 'Despesa Variável')
    .reduce((acc, t) => acc + t.valor, 0);

  // 3. Economia & Futuro (20%): Saldo Restante / Reserva
  const economiaFuturoReal = Math.max(0, rendaTotalFamiliar - (gastosNecessidades + gastosLazerEstiloVida));

  // Metas Ideais Recomendadas (50 / 30 / 20)
  const metaNecessidades = rendaTotalFamiliar * 0.50;
  const metaLazer = rendaTotalFamiliar * 0.30;
  const metaFuturo = rendaTotalFamiliar * 0.20;

  const pctNecessidadesReal = rendaTotalFamiliar > 0 ? Math.round((gastosNecessidades / rendaTotalFamiliar) * 100) : 0;
  const pctLazerReal = rendaTotalFamiliar > 0 ? Math.round((gastosLazerEstiloVida / rendaTotalFamiliar) * 100) : 0;
  const pctFuturoReal = rendaTotalFamiliar > 0 ? Math.round((economiaFuturoReal / rendaTotalFamiliar) * 100) : 0;

  return (
    <div className="space-y-6 font-sans animate-fadeIn">
      {/* Banner Regra 50/30/20 */}
      <div className={`p-6 rounded-3xl border shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
        darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-teal-500/10 text-teal-400 rounded-2xl border border-teal-500/20 shrink-0">
            <Compass className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/30 uppercase tracking-widest">
              Método de Educação Financeira Pessoal
            </span>
            <h3 className="text-xl font-bold mt-1 flex items-center gap-2 text-white">
              Regra do Orçamento Pessoal (50% - 30% - 20%)
            </h3>
            <p className="text-xs text-slate-400 font-normal">
              Divisão recomendada de gastos com base na Renda Total cadastrada (50% Necessidades, 30% Lazer, 20% Economia).
            </p>
          </div>
        </div>
      </div>

      {/* CARDS DE COMPARAÇÃO IDEAL VS REAL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* CARD 1: NECESSIDADES BÁSICAS (50%) */}
        <div className={`p-6 rounded-3xl border shadow-xl space-y-3 ${
          darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-500/30">
              50% Necessidades Básicas
            </span>
            <span className="text-xs font-bold text-slate-400">Meta: R$ {metaNecessidades.toLocaleString('pt-BR')}</span>
          </div>

          <div>
            <span className="text-2xl font-black text-white">R$ {gastosNecessidades.toLocaleString('pt-BR')}</span>
            <span className="text-xs text-slate-400 block font-normal mt-0.5">Gastos Fixos (Moradia, Alimentação, Água/Luz)</span>
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Comprometimento Atual:</span>
              <strong className={pctNecessidadesReal > 50 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                {pctNecessidadesReal}% da Renda
              </strong>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${pctNecessidadesReal > 50 ? 'bg-rose-500' : 'bg-sky-400'}`}
                style={{ width: `${Math.min(100, pctNecessidadesReal)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* CARD 2: ESTILO DE VIDA & LAZER (30%) */}
        <div className={`p-6 rounded-3xl border shadow-xl space-y-3 ${
          darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/30">
              30% Estilo de Vida & Lazer
            </span>
            <span className="text-xs font-bold text-slate-400">Meta: R$ {metaLazer.toLocaleString('pt-BR')}</span>
          </div>

          <div>
            <span className="text-2xl font-black text-white">R$ {gastosLazerEstiloVida.toLocaleString('pt-BR')}</span>
            <span className="text-xs text-slate-400 block font-normal mt-0.5">Gastos Variáveis & Cartões de Crédito</span>
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Comprometimento Atual:</span>
              <strong className={pctLazerReal > 30 ? 'text-rose-400 font-bold' : 'text-purple-400 font-bold'}>
                {pctLazerReal}% da Renda
              </strong>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${pctLazerReal > 30 ? 'bg-rose-500' : 'bg-purple-400'}`}
                style={{ width: `${Math.min(100, pctLazerReal)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* CARD 3: ECONOMIA & FUTURO (20%) */}
        <div className={`p-6 rounded-3xl border shadow-xl space-y-3 ${
          darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              20% Economia & Investimentos
            </span>
            <span className="text-xs font-bold text-slate-400">Meta: R$ {metaFuturo.toLocaleString('pt-BR')}</span>
          </div>

          <div>
            <span className="text-2xl font-black text-emerald-400">R$ {economiaFuturoReal.toLocaleString('pt-BR')}</span>
            <span className="text-xs text-slate-400 block font-normal mt-0.5">Reserva Restante para Investir</span>
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Economia Real Acumulada:</span>
              <strong className="text-emerald-400 font-bold">{pctFuturoReal}% da Renda</strong>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all"
                style={{ width: `${Math.min(100, pctFuturoReal)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

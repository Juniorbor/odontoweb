import React from 'react';
import { Compass } from 'lucide-react';
import type { TransacaoPessoal } from '../types';

interface Regra503020Props {
  transacoes: TransacaoPessoal[];
  faturamentoProducaoTotal: number;
  darkMode?: boolean;
}

export const Regra503020: React.FC<Regra503020Props> = ({
  transacoes,
  faturamentoProducaoTotal,
  darkMode
}) => {
  const outrasEntradas = transacoes
    .filter((t) => t.tipo === 'Entrada')
    .reduce((acc, t) => acc + t.valor, 0);

  const rendaTotalFamiliar = faturamentoProducaoTotal + outrasEntradas;

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
            <span className="text-[10px] font-semibold text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/30 uppercase tracking-widest">
              Método de Educação Financeira Pessoal
            </span>
            <h3 className="text-xl font-bold mt-1 flex items-center gap-2 text-white">
              Regra do Orçamento Pessoal (50% - 30% - 20%)
            </h3>
            <p className="text-xs text-slate-400 font-normal">
              Divisão recomendada para equilibrar gastos essenciais do lar, lazer da família e reservas do futuro.
            </p>
          </div>
        </div>

        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 shrink-0 text-right">
          <span className="text-[10px] uppercase text-slate-400 font-semibold block">Renda Total Disponível</span>
          <span className="text-lg font-bold text-emerald-400">
            R$ {rendaTotalFamiliar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* 3 PILARES DO ORÇAMENTO 50/30/20 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Pilar 1: 50% Necessidades Básicas */}
        <div className={`p-6 rounded-3xl border shadow-xl space-y-3 ${
          darkMode ? 'bg-slate-900/90 border-sky-900/40 text-white' : 'bg-white border-sky-100 text-slate-900'
        }`}>
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">1. Necessidades (50%)</span>
            <span className="text-[10px] font-bold text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded">Meta: 50%</span>
          </div>

          <h4 className="text-2xl font-bold text-white">
            R$ {gastosNecessidades.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h4>

          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Uso real da renda:</span>
              <strong className="text-sky-400 font-semibold">{pctNecessidadesReal}% (Ideal: R$ {metaNecessidades.toLocaleString('pt-BR')})</strong>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="h-full bg-sky-400 rounded-full" style={{ width: `${Math.min(100, pctNecessidadesReal)}%` }}></div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 font-normal leading-relaxed">
            Contas essenciais do lar: aluguel, supermercado, energia, água, saúde e custos fixos.
          </p>
        </div>

        {/* Pilar 2: 30% Estilo de Vida & Lazer */}
        <div className={`p-6 rounded-3xl border shadow-xl space-y-3 ${
          darkMode ? 'bg-slate-900/90 border-purple-900/40 text-white' : 'bg-white border-purple-100 text-slate-900'
        }`}>
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">2. Lazer & Estilo (30%)</span>
            <span className="text-[10px] font-bold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded">Meta: 30%</span>
          </div>

          <h4 className="text-2xl font-bold text-white">
            R$ {gastosLazerEstiloVida.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h4>

          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Uso real da renda:</span>
              <strong className="text-purple-400 font-semibold">{pctLazerReal}% (Ideal: R$ {metaLazer.toLocaleString('pt-BR')})</strong>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="h-full bg-purple-400 rounded-full" style={{ width: `${Math.min(100, pctLazerReal)}%` }}></div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 font-normal leading-relaxed">
            Despesas de lazer da família, restaurantes, cartões de crédito, passeios e compras pessoais.
          </p>
        </div>

        {/* Pilar 3: 20% Economia & Futuro */}
        <div className={`p-6 rounded-3xl border shadow-xl space-y-3 ${
          darkMode ? 'bg-slate-900/90 border-emerald-900/40 text-white' : 'bg-white border-emerald-100 text-slate-900'
        }`}>
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">3. Futuro & Reserva (20%)</span>
            <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded">Meta: 20%</span>
          </div>

          <h4 className="text-2xl font-bold text-emerald-400">
            R$ {economiaFuturoReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h4>

          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Economia real da renda:</span>
              <strong className="text-emerald-400 font-semibold">{pctFuturoReal}% (Ideal: R$ {metaFuturo.toLocaleString('pt-BR')})</strong>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${Math.min(100, pctFuturoReal)}%` }}></div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 font-normal leading-relaxed">
            Recursos livres para guardar na reserva de emergência e investimentos do futuro familiar.
          </p>
        </div>

      </div>
    </div>
  );
};

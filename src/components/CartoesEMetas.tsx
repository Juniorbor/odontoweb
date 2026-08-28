import React, { useState } from 'react';
import { CreditCard, Target, ShieldCheck } from 'lucide-react';
import type { TransacaoPessoal } from '../types';

interface CartoesEMetasProps {
  transacoesFinanceiras: TransacaoPessoal[];
  darkMode?: boolean;
}

export const CartoesEMetas: React.FC<CartoesEMetasProps> = ({
  transacoesFinanceiras,
  darkMode
}) => {
  const [limiteCartao, setLimiteCartao] = useState<number>(15000);
  const [diaFechamento] = useState<number>(5);
  const [mesesReserva, setMesesReserva] = useState<number>(6);

  const totalDespesasFixas = transacoesFinanceiras
    .filter((t) => t.tipo === 'Despesa Fixa')
    .reduce((acc, t) => acc + t.valor, 0);

  const totalFaturaUsada = transacoesFinanceiras
    .filter((t) => t.tipo === 'Despesa Variável')
    .reduce((acc, t) => acc + t.valor, 0);

  const limiteDisponivel = Math.max(0, limiteCartao - totalFaturaUsada);
  const usoPct = limiteCartao > 0 ? Math.round((totalFaturaUsada / limiteCartao) * 100) : 0;

  const reservaEmergenciaIdeal = totalDespesasFixas > 0 ? totalDespesasFixas * mesesReserva : 18000;

  return (
    <div className="space-y-6 font-sans animate-fadeIn">
      {/* 1. SEÇÃO DE GESTÃO DE CARTÕES DE CRÉDITO */}
      <div className={`p-6 rounded-3xl border shadow-xl space-y-5 ${
        darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-3">
          <div>
            <span className="text-[10px] font-semibold uppercase text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded border border-purple-500/20">
              Controle de Limites & Faturas
            </span>
            <h3 className="font-bold text-base text-white mt-1 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-purple-400" /> Cartão de Crédito Principal & Compras Parceladas
            </h3>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium">
            <span className="text-slate-400">Limite Total:</span>
            <input
              type="number"
              value={limiteCartao}
              onChange={(e) => setLimiteCartao(Number(e.target.value))}
              className="w-24 p-1.5 rounded-xl bg-slate-950 border border-slate-800 text-purple-400 font-bold text-right"
            />
          </div>
        </div>

        {/* Card Visual de Cartão de Crédito */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-3xl bg-gradient-to-br from-purple-900 via-slate-900 to-indigo-950 border border-purple-500/40 text-white shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <CreditCard className="w-8 h-8 text-purple-300" />
              <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded uppercase">Fechamento Dia {diaFechamento}</span>
            </div>

            <div>
              <span className="text-[10px] font-medium uppercase text-purple-300 block">Fatura Atual Compromissada</span>
              <h4 className="text-2xl font-bold text-white mt-0.5">
                R$ {totalFaturaUsada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h4>
            </div>

            <div className="flex justify-between text-[11px] text-purple-200 pt-2 border-t border-purple-500/20">
              <span>Disponível: R$ {limiteDisponivel.toLocaleString('pt-BR')}</span>
              <span>{usoPct}% utilizado</span>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-3 md:col-span-2">
            <h4 className="font-semibold text-xs text-slate-300 uppercase tracking-wider">Uso do Limite de Crédito</h4>
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  usoPct > 80 ? 'bg-rose-500' : 'bg-gradient-to-r from-purple-500 to-indigo-400'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, usoPct))}%` }}
              ></div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              O sistema calcula automaticamente o somatório das despesas variáveis e compras parceladas no cartão de crédito, exibindo o limite remanescente para evitar surpresas no fechamento da fatura.
            </p>
          </div>
        </div>
      </div>

      {/* 2. SEÇÃO DE SIMULADOR DE RESERVA DE EMERGÊNCIA & METAS */}
      <div className={`p-6 rounded-3xl border shadow-xl space-y-5 ${
        darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-3">
          <div>
            <span className="text-[10px] font-semibold uppercase text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
              Segurança Financeira Familiar
            </span>
            <h3 className="font-bold text-base text-white mt-1 flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400" /> Simulador de Reserva de Emergência & Objetivos
            </h3>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium">
            <span className="text-slate-400">Meses de Segurança:</span>
            <select
              value={mesesReserva}
              onChange={(e) => setMesesReserva(Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 text-emerald-400 font-bold p-1.5 rounded-xl"
            >
              <option value={3}>3 Meses</option>
              <option value={6}>6 Meses (Recomendado)</option>
              <option value={12}>12 Meses</option>
            </select>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-semibold uppercase text-emerald-400 block">
              Meta Calculada da Reserva de Emergência ({mesesReserva} Meses de Custo Fixo)
            </span>
            <h4 className="text-2xl font-bold text-emerald-400">
              R$ {reservaEmergenciaIdeal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h4>
            <p className="text-xs text-slate-400 font-normal">
              Calculado com base nas despesas fixas cadastradas no sistema (R$ {totalDespesasFixas.toLocaleString('pt-BR')}/mês).
            </p>
          </div>

          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 flex items-center gap-2 text-xs font-semibold shrink-0">
            <ShieldCheck className="w-5 h-5" /> Reserva de Proteção Ativa
          </div>
        </div>
      </div>
    </div>
  );
};

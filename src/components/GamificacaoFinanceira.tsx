import React from 'react';
import { ShieldCheck, Zap, Star, Trophy, CheckCircle2 } from 'lucide-react';
import type { TransacaoPessoal, ItemProducaoTomo } from '../types';

interface GamificacaoFinanceiraProps {
  transacoes: TransacaoPessoal[];
  itensProducao: ItemProducaoTomo[];
  darkMode?: boolean;
}

export const GamificacaoFinanceira: React.FC<GamificacaoFinanceiraProps> = ({
  transacoes,
  itensProducao,
  darkMode
}) => {
  const temProducao = itensProducao.length > 0;
  const totalProducao = itensProducao.reduce((acc, i) => acc + i.valor, 0);

  const totalEntradas = transacoes.filter((t) => t.tipo === 'Entrada').reduce((acc, t) => acc + t.valor, 0) + totalProducao;
  const totalDespesas = transacoes.filter((t) => t.tipo !== 'Entrada').reduce((acc, t) => acc + t.valor, 0);
  const saldoPositivo = totalEntradas > totalDespesas;

  const conquistas = [
    {
      id: 'c1',
      titulo: 'Primeiros Passos',
      descricao: 'Cadastrou lançamentos no sistema de gestão financeira.',
      icone: Zap,
      desbloqueado: transacoes.length > 0,
      cor: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    },
    {
      id: 'c2',
      titulo: 'Balanço Positivo',
      descricao: 'Manter a renda maior do que os custos totais do mês.',
      icone: ShieldCheck,
      desbloqueado: saldoPositivo,
      cor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    },
    {
      id: 'c3',
      titulo: 'Produção Ativa',
      descricao: 'Registrou exames tomográficos e laudos nas clínicas.',
      icone: Trophy,
      desbloqueado: temProducao,
      cor: 'text-teal-400 bg-teal-500/10 border-teal-500/30'
    },
    {
      id: 'c4',
      titulo: 'Organizador Master',
      descricao: 'Realizou mais de 5 lançamentos de orçamento no mês.',
      icone: Star,
      desbloqueado: transacoes.length >= 5,
      cor: 'text-purple-400 bg-purple-500/10 border-purple-500/30'
    }
  ];

  const conquistasDesbloqueadas = conquistas.filter((c) => c.desbloqueado).length;

  return (
    <div className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
      darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
    }`}>
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20 shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded uppercase tracking-wider">
                Gamificação & Metas
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-0.5">
              Conquistas Financeiras & Nível de Disciplina
            </h3>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-semibold text-slate-400 uppercase block">Conquistas Liberadas</span>
          <span className="text-lg font-extrabold text-amber-400">
            {conquistasDesbloqueadas} / {conquistas.length} Medalias
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-normal">
        {conquistas.map((c) => {
          const Icone = c.icone;
          return (
            <div
              key={c.id}
              className={`p-4 rounded-2xl border transition-all space-y-2 ${
                c.desbloqueado
                  ? 'bg-slate-950 border-slate-800 text-white shadow-md'
                  : 'bg-slate-950/30 border-slate-900/50 text-slate-500 opacity-50'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className={`p-2.5 rounded-xl border ${c.cor}`}>
                  <Icone className="w-5 h-5" />
                </div>
                {c.desbloqueado && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </div>

              <div>
                <h4 className="font-bold text-white text-xs">{c.titulo}</h4>
                <p className="text-[11px] text-slate-400 mt-1">{c.descricao}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

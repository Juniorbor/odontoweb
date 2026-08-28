import React from 'react';
import { ShieldCheck, Zap, Star, Trophy, CheckCircle2 } from 'lucide-react';
import type { TransacaoPessoal } from '../types';

interface GamificacaoFinanceiraProps {
  transacoes: TransacaoPessoal[];
  darkMode?: boolean;
}

export const GamificacaoFinanceira: React.FC<GamificacaoFinanceiraProps> = ({
  transacoes,
  darkMode
}) => {
  const totalEntradas = transacoes.filter((t) => t.tipo === 'Entrada').reduce((acc, t) => acc + t.valor, 0);
  const totalDespesas = transacoes.filter((t) => t.tipo !== 'Entrada').reduce((acc, t) => acc + t.valor, 0);
  const saldoPositivo = totalEntradas > totalDespesas;
  const temContasPagas = transacoes.some((t) => t.status === 'Pago');

  const conquistas = [
    {
      id: 'c1',
      titulo: 'Primeiros Passos',
      descricao: 'Cadastrou lançamentos no seu painel de gestão financeira.',
      icone: Zap,
      desbloqueado: transacoes.length > 0,
      cor: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    },
    {
      id: 'c2',
      titulo: 'Balanço Positivo',
      descricao: 'Mantém a renda maior do que as despesas totais no mês.',
      icone: ShieldCheck,
      desbloqueado: saldoPositivo,
      cor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    },
    {
      id: 'c3',
      titulo: 'Organização Ativa',
      descricao: 'Cadastrou entradas e despesas organizadas por categoria.',
      icone: Star,
      desbloqueado: transacoes.length >= 3,
      cor: 'text-sky-400 bg-sky-500/10 border-sky-500/30'
    },
    {
      id: 'c4',
      titulo: 'Gestor Master',
      descricao: 'Mantém as contas do mês liquidadas e sem pendências em atraso.',
      icone: Trophy,
      desbloqueado: temContasPagas,
      cor: 'text-purple-400 bg-purple-500/10 border-purple-500/30'
    }
  ];

  const totalDesbloqueados = conquistas.filter((c) => c.desbloqueado).length;

  return (
    <div className={`p-6 rounded-3xl border shadow-xl space-y-4 font-sans ${
      darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
    }`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-3">
        <div>
          <span className="text-[10px] font-extrabold uppercase text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20 tracking-wider">
            SISTEMA DE CONQUISTAS DA FAMÍLIA
          </span>
          <h3 className="font-bold text-base text-white mt-1 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" /> Medalhas de Saúde & Disciplina Financeira
          </h3>
        </div>

        <span className="text-xs font-bold text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/30">
          {totalDesbloqueados} de {conquistas.length} Conquistas Desbloqueadas
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-normal">
        {conquistas.map((c) => {
          const Icone = c.icone;
          return (
            <div
              key={c.id}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-3 ${
                c.desbloqueado
                  ? `${c.cor} shadow-md`
                  : 'bg-slate-950/50 border-slate-800 text-slate-500 opacity-60'
              }`}
            >
              <div className="p-2 rounded-xl border border-current shrink-0 mt-0.5">
                <Icone className="w-5 h-5" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <h4 className="font-bold text-white text-xs">{c.titulo}</h4>
                  {c.desbloqueado && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed font-normal">{c.descricao}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

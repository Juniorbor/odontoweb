import React from 'react';
import { ShieldCheck, Zap, Star, Trophy, CheckCircle2 } from 'lucide-react';
import type { TransacaoPessoal } from '../types';

interface GamificacaoFinanceiraProps {
  transacoes: TransacaoPessoal[];
  darkMode?: boolean;
}

export const GamificacaoFinanceira: React.FC<GamificacaoFinanceiraProps> = ({
  transacoes
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
      cor: 'text-amber-800 bg-amber-50 border-amber-200',
      iconColor: 'text-amber-700 bg-amber-100/80 border-amber-200'
    },
    {
      id: 'c2',
      titulo: 'Balanço Positivo',
      descricao: 'Mantém a renda maior do que as despesas totais no mês.',
      icone: ShieldCheck,
      desbloqueado: saldoPositivo,
      cor: 'text-emerald-800 bg-emerald-50 border-emerald-200',
      iconColor: 'text-emerald-700 bg-emerald-100/80 border-emerald-200'
    },
    {
      id: 'c3',
      titulo: 'Organização Ativa',
      descricao: 'Cadastrou entradas e despesas organizadas por categoria.',
      icone: Star,
      desbloqueado: transacoes.length >= 3,
      cor: 'text-sky-800 bg-sky-50 border-sky-200',
      iconColor: 'text-sky-700 bg-sky-100/80 border-sky-200'
    },
    {
      id: 'c4',
      titulo: 'Gestor Master',
      descricao: 'Mantém as contas do mês liquidadas e sem pendências.',
      icone: Trophy,
      desbloqueado: temContasPagas,
      cor: 'text-teal-800 bg-teal-50 border-teal-200',
      iconColor: 'text-teal-700 bg-teal-100/80 border-teal-200'
    }
  ];

  const totalDesbloqueados = conquistas.filter((c) => c.desbloqueado).length;

  return (
    <div className="card-clinical p-6 sm:p-7 space-y-5 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 tracking-wider">
            METAS & DISCIPLINA
          </span>
          <h3 className="font-extrabold text-base sm:text-lg text-slate-900 mt-1 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-600" /> Conquistas de Gestão Financeira
          </h3>
        </div>

        <span className="text-xs font-extrabold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
          {totalDesbloqueados} de {conquistas.length} Ativas
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
        {conquistas.map((c) => {
          const Icone = c.icone;
          return (
            <div
              key={c.id}
              className={`p-4 rounded-xl border transition-all flex items-start gap-3 ${
                c.desbloqueado
                  ? `${c.cor} shadow-xs`
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <div className={`p-2 rounded-xl border shrink-0 mt-0.5 ${c.desbloqueado ? c.iconColor : 'bg-white border-slate-200 text-slate-600'}`}>
                <Icone className="w-4 h-4" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-extrabold text-slate-900 text-xs">{c.titulo}</h4>
                  {c.desbloqueado && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                </div>
                <p className="text-[11px] text-slate-700 leading-relaxed font-medium">{c.descricao}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

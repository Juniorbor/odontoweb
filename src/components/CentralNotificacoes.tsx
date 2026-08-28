import React from 'react';
import { Bell, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import type { TransacaoPessoal, ItemProducaoTomo } from '../types';

interface CentralNotificacoesProps {
  transacoes: TransacaoPessoal[];
  itensProducao: ItemProducaoTomo[];
  onFechar: () => void;
  darkMode?: boolean;
}

export const CentralNotificacoes: React.FC<CentralNotificacoesProps> = ({
  transacoes,
  itensProducao,
  onFechar,
  darkMode
}) => {
  const hoje = new Date().toISOString().split('T')[0];

  const notificacoes: Array<{
    id: string;
    titulo: string;
    mensagem: string;
    tipo: 'alerta' | 'sucesso' | 'info';
    data: string;
  }> = [];

  transacoes.forEach((t) => {
    if (t.tipo !== 'Entrada' && t.status === 'Pendente') {
      if (t.data === hoje) {
        notificacoes.push({
          id: `not-hoje-${t.id}`,
          titulo: '⚠️ Conta Vence Hoje!',
          mensagem: `${t.descricao} (R$ ${t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) vence hoje.`,
          tipo: 'alerta',
          data: t.data
        });
      } else if (t.data > hoje) {
        notificacoes.push({
          id: `not-prox-${t.id}`,
          titulo: '📅 Conta Próxima do Vencimento',
          mensagem: `${t.descricao} (R$ ${t.valor.toLocaleString('pt-BR')}) vence em ${t.data}.`,
          tipo: 'info',
          data: t.data
        });
      }
    }
  });

  const totalProducao = itensProducao.reduce((acc, i) => acc + i.valor, 0);
  if (totalProducao > 0) {
    notificacoes.push({
      id: 'not-prod-ok',
      titulo: '🎉 Produção Unificada no Ar',
      mensagem: `Produção total acumulada atingiu R$ ${totalProducao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
      tipo: 'sucesso',
      data: hoje
    });
  }

  notificacoes.push({
    id: 'not-robo-wa',
    titulo: '🤖 Disparo Automático Agendado',
    mensagem: 'Seu resumo diário de produção e finanças será enviado às 18:30h no WhatsApp.',
    tipo: 'info',
    data: hoje
  });

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-start justify-end p-4 sm:p-6 animate-fadeIn">
      <div className={`p-6 rounded-3xl border max-w-md w-full shadow-2xl space-y-4 ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Central de Notificações</h3>
              <span className="text-[10px] text-slate-400 font-normal">Alertas e lembretes em tempo real</span>
            </div>
          </div>

          <button onClick={onFechar} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 text-xs font-normal">
          {notificacoes.length === 0 ? (
            <p className="text-center text-slate-400 py-6">Nenhuma notificação pendente no momento.</p>
          ) : (
            notificacoes.map((n) => (
              <div
                key={n.id}
                className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
                  n.tipo === 'alerta'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : n.tipo === 'sucesso'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}
              >
                {n.tipo === 'alerta' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                ) : n.tipo === 'sucesso' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                )}

                <div className="space-y-0.5">
                  <h4 className="font-bold text-white text-xs">{n.titulo}</h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{n.mensagem}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Bell, CheckCircle2, AlertTriangle, Info, X, UserPlus, Gem } from 'lucide-react';
import type { TransacaoPessoal } from '../types';
import { getNotificacoesNovosClientesAdmin, type UsuarioSistema } from '../services/authService';

interface CentralNotificacoesProps {
  transacoes: TransacaoPessoal[];
  onFechar: () => void;
  darkMode?: boolean;
  usuarioLogado?: UsuarioSistema | null;
  onNavegarPainelAdmin?: () => void;
}

export const CentralNotificacoes: React.FC<CentralNotificacoesProps> = ({
  transacoes,
  onFechar,
  darkMode,
  usuarioLogado,
  onNavegarPainelAdmin
}) => {
  const hoje = new Date().toISOString().split('T')[0];
  const isAdmin = usuarioLogado?.role === 'admin';

  const notificacoes: Array<{
    id: string;
    titulo: string;
    mensagem: string;
    tipo: 'alerta' | 'sucesso' | 'info' | 'novo_cliente';
    data: string;
    clienteInfo?: { nome: string; email: string };
  }> = [];

  // Se for Administrador Master, exibe notificações de novos clientes cadastrados no topo
  if (isAdmin) {
    const notificacoesClientes = getNotificacoesNovosClientesAdmin();
    notificacoesClientes.forEach((notif) => {
      notificacoes.push({
        id: notif.id,
        titulo: '🚨 NOVO CLIENTE CADASTRADO NO SITE!',
        mensagem: `O cliente ${notif.clienteNome} (${notif.clienteEmail}) criou uma nova conta com 7 dias de teste grátis!`,
        tipo: 'novo_cliente',
        data: notif.dataHora,
        clienteInfo: { nome: notif.clienteNome, email: notif.clienteEmail }
      });
    });
  }

  // Notificações de Contas Pessoais
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

  const totalEntradas = transacoes.filter((t) => t.tipo === 'Entrada').reduce((acc, t) => acc + t.valor, 0);
  if (totalEntradas > 0) {
    notificacoes.push({
      id: 'not-entradas-ok',
      titulo: '🎉 Renda Sincronizada',
      mensagem: `Total de entradas registradas atingiu R$ ${totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
      tipo: 'sucesso',
      data: hoje
    });
  }

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-start justify-end p-4 sm:p-6 animate-fadeIn font-sans">
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
              <span className="text-[10px] text-slate-400 font-normal">Alertas e avisos em tempo real</span>
            </div>
          </div>

          <button onClick={onFechar} className="text-slate-400 hover:text-white cursor-pointer p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 text-xs font-normal">
          {notificacoes.length === 0 ? (
            <p className="text-center text-slate-400 py-6">Nenhuma notificação pendente no momento.</p>
          ) : (
            notificacoes.map((n) => (
              <div
                key={n.id}
                className={`p-4 rounded-2xl border flex items-start gap-3 relative transition-all ${
                  n.tipo === 'novo_cliente'
                    ? 'bg-gradient-to-r from-emerald-950/80 to-slate-950 border-emerald-500/50 shadow-lg shadow-emerald-500/10 text-white'
                    : n.tipo === 'alerta'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : n.tipo === 'sucesso'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}
              >
                {n.tipo === 'novo_cliente' ? (
                  <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/40 shrink-0 mt-0.5 animate-bounce">
                    <UserPlus className="w-5 h-5" />
                  </div>
                ) : n.tipo === 'alerta' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                ) : n.tipo === 'sucesso' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                )}

                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className={`font-extrabold text-xs ${n.tipo === 'novo_cliente' ? 'text-emerald-400' : 'text-white'}`}>
                      {n.titulo}
                    </h4>
                    <span className="text-[9px] text-slate-400 font-mono">{n.data}</span>
                  </div>

                  <p className="text-[11px] text-slate-200 leading-relaxed font-medium">{n.mensagem}</p>

                  {n.tipo === 'novo_cliente' && onNavegarPainelAdmin && (
                    <button
                      onClick={() => {
                        onFechar();
                        onNavegarPainelAdmin();
                      }}
                      className="mt-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black px-3 py-1.5 rounded-xl text-[10px] flex items-center gap-1 shadow-md transition-all cursor-pointer"
                    >
                      <Gem className="w-3.5 h-3.5" /> Ver no Painel Master de Licenças
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

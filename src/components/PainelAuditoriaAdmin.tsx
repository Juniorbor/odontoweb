import React, { useState } from 'react';
import {
  ShieldCheck,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  RefreshCw,
  Search,
  Gem,
  Calendar
} from 'lucide-react';
import {
  getUsuariosCadastrados,
  getLogsAuditoria,
  ativarPlanoDefinitivoCliente,
  prorrogarTesteCliente,
  calcularDiasRestantesEStatusPlano,
  type UsuarioSistema,
  type LogAuditoriaAcesso
} from '../services/authService';

interface PainelAuditoriaAdminProps {
  darkMode?: boolean;
}

export const PainelAuditoriaAdmin: React.FC<PainelAuditoriaAdminProps> = ({ darkMode }) => {
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>(() => getUsuariosCadastrados());
  const [logs, setLogs] = useState<LogAuditoriaAcesso[]>(() => getLogsAuditoria());
  const [filtro, setFiltro] = useState<string>('');
  const [abaAuditoria, setAbaAuditoria] = useState<'clientes' | 'logs'>('clientes');

  const handleAtualizar = () => {
    setUsuarios(getUsuariosCadastrados());
    setLogs(getLogsAuditoria());
  };

  const handleToggleStatus = (usuarioId: string) => {
    const atualizados = usuarios.map(u => {
      if (u.id === usuarioId) {
        const novoStatus: 'Ativo' | 'Bloqueado' = u.status === 'Ativo' ? 'Bloqueado' : 'Ativo';
        return { ...u, status: novoStatus };
      }
      return u;
    });
    setUsuarios(atualizados);
    localStorage.setItem('odonto_usuarios_sistema_v1', JSON.stringify(atualizados));
  };

  const handleAtivarDefinitivo = (usuarioId: string) => {
    if (window.confirm('Confirmar liberação do ACESSO DEFINITIVO para este cliente (Adesão R$ 300,00 + Mensalidade R$ 30,00 liberadas)?')) {
      const atualizados = ativarPlanoDefinitivoCliente(usuarioId);
      setUsuarios(atualizados);
    }
  };

  const handleProrrogarTeste = (usuarioId: string) => {
    if (window.confirm('Deseja prorrogar o período de teste grátis deste cliente por mais +7 dias?')) {
      const atualizados = prorrogarTesteCliente(usuarioId, 7);
      setUsuarios(atualizados);
    }
  };

  const clientesFiltrados = usuarios.filter(u =>
    u.role === 'cliente' && (
      u.nome.toLowerCase().includes(filtro.toLowerCase()) ||
      u.email.toLowerCase().includes(filtro.toLowerCase())
    )
  );

  const logsFiltrados = logs.filter(l =>
    l.nomeUsuario.toLowerCase().includes(filtro.toLowerCase()) ||
    l.emailUsuario.toLowerCase().includes(filtro.toLowerCase()) ||
    l.mensagemDetalhe.toLowerCase().includes(filtro.toLowerCase())
  );

  const totalClientes = usuarios.filter(u => u.role === 'cliente').length;

  return (
    <div className="space-y-6 font-sans animate-fadeIn">
      {/* Top Banner de Gestão de Clientes */}
      <div className={`p-6 rounded-3xl border shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
        darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-widest">
              Central do Administrador Master
            </span>
            <h3 className="text-xl font-extrabold mt-1 flex items-center gap-2 text-white">
              Painel de Licenciamento, Testes Grátis & Auditoria de Clientes
            </h3>
            <p className="text-xs text-slate-400 font-normal">
              Controle de acessos individuais, liberação de planos definitivos (R$ 300 adesão + R$ 30/mês) e auditoria.
            </p>
          </div>
        </div>

        <button
          onClick={handleAtualizar}
          className="bg-slate-800 hover:bg-slate-700 text-teal-400 font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 border border-slate-700 transition-all cursor-pointer shadow-md shrink-0"
        >
          <RefreshCw className="w-4 h-4" /> Atualizar Tabela
        </button>
      </div>

      {/* 3 KPI CARDS DE AUDITORIA */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="card-cyber p-5 rounded-3xl">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">Clientes Cadastrados</span>
            <div className="p-2.5 bg-teal-500/10 text-teal-400 rounded-2xl border border-teal-500/20">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-2">{totalClientes} clientes</p>
          <p className="text-[11px] text-slate-400 mt-1">Gastos 100% isolados individualmente</p>
        </div>

        <div className="card-cyber p-5 rounded-3xl">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Plano Definitivo (R$ 300 + R$ 30/mês)</span>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
              <Gem className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-2">
            {usuarios.filter(u => u.role === 'cliente' && u.statusPlano === 'ativo').length} ativos
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Acesso perpétuo liberado pelo Admin</p>
        </div>

        <div className="card-cyber p-5 rounded-3xl">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Em Teste Grátis (7 Dias)</span>
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-400 mt-2">
            {usuarios.filter(u => u.role === 'cliente' && u.statusPlano !== 'ativo').length} em avaliação
          </p>
          <p className="text-[11px] text-slate-400 mt-1">7 dias para testar a plataforma</p>
        </div>
      </div>

      {/* SELETOR DE ABAS & CAMPO DE BUSCA */}
      <div className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
        darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 border-b border-slate-800 pb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setAbaAuditoria('clientes')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                abaAuditoria === 'clientes'
                  ? 'bg-teal-500 text-white shadow-lg'
                  : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              👥 Gerenciamento de Licenças dos Clientes ({clientesFiltrados.length})
            </button>

            <button
              onClick={() => setAbaAuditoria('logs')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                abaAuditoria === 'logs'
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              📜 Histórico de Auditoria & Segurança ({logsFiltrados.length})
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar cliente, e-mail ou log..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 w-full sm:w-64"
            />
          </div>
        </div>

        {/* CONTÉUDO DA ABA 1: CLIENTES */}
        {abaAuditoria === 'clientes' ? (
          <div className="overflow-x-auto">
            {clientesFiltrados.length === 0 ? (
              <p className="text-center text-slate-400 py-8 text-xs">
                Nenhum cliente cadastrado no momento. Os novos clientes aparecerão automaticamente aqui assim que se registrarem na tela de Login.
              </p>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="p-3">Cliente</th>
                    <th className="p-3">E-mail de Acesso</th>
                    <th className="p-3">Data Cadastro</th>
                    <th className="p-3 text-center">Status do Plano</th>
                    <th className="p-3 text-center">Teste Grátis</th>
                    <th className="p-3">Último Acesso</th>
                    <th className="p-3 text-center">Ações de Liberação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {clientesFiltrados.map((cli) => {
                    const calc = calcularDiasRestantesEStatusPlano(cli);
                    const isAtivo = cli.statusPlano === 'ativo';
                    const isExpirado = calc.statusCalculado === 'expirado';

                    return (
                      <tr key={cli.id} className="hover:bg-slate-950/60 transition-colors">
                        <td className="p-3 font-bold text-white flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-400 font-extrabold flex items-center justify-center border border-teal-500/40 text-xs shrink-0">
                            {cli.nome.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="block font-bold text-white">{cli.nome}</span>
                            <span className="text-[10px] text-slate-400 block font-normal">ID: {cli.id}</span>
                          </div>
                        </td>

                        <td className="p-3 text-teal-400 font-semibold">{cli.email}</td>
                        <td className="p-3 text-slate-300">{cli.dataCriacao}</td>

                        <td className="p-3 text-center">
                          {isAtivo ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
                              <Gem className="w-3 h-3 text-emerald-400" /> Ativo Definitivo
                            </span>
                          ) : isExpirado ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-400 border border-rose-500/30 inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-rose-400" /> Teste Expirado
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-400" /> Teste Grátis (7d)
                            </span>
                          )}
                        </td>

                        <td className="p-3 text-center font-bold">
                          {isAtivo ? (
                            <span className="text-emerald-400 text-xs">Liberado sem limites</span>
                          ) : isExpirado ? (
                            <span className="text-rose-400 text-xs">Expirou (Bloqueado)</span>
                          ) : (
                            <span className="text-amber-300 text-xs">{calc.diasRestantes} dias restantes</span>
                          )}
                        </td>

                        <td className="p-3 text-slate-300 text-[11px]">
                          <span className="block font-semibold">{cli.ultimoAcesso || 'Primeiro acesso'}</span>
                          <span className="text-[10px] text-slate-400 block">{cli.dispositivo || 'Web'}</span>
                        </td>

                        <td className="p-3 text-center">
                          <div className="flex flex-wrap items-center justify-center gap-1.5">
                            {!isAtivo && (
                              <button
                                onClick={() => handleAtivarDefinitivo(cli.id)}
                                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold px-3 py-1.5 rounded-xl text-[11px] flex items-center gap-1 shadow-md transition-all cursor-pointer"
                                title="Liberar Plano Definitivo (R$ 300 adesão + R$ 30/mês)"
                              >
                                <Gem className="w-3.5 h-3.5" /> Liberar Acesso Definitivo
                              </button>
                            )}

                            {!isAtivo && (
                              <button
                                onClick={() => handleProrrogarTeste(cli.id)}
                                className="bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold px-2.5 py-1.5 rounded-xl text-[10px] flex items-center gap-1 border border-slate-700 cursor-pointer"
                                title="Conceder mais 7 dias de teste grátis"
                              >
                                <Calendar className="w-3 h-3" /> +7 Dias Teste
                              </button>
                            )}

                            <button
                              onClick={() => handleToggleStatus(cli.id)}
                              className={`p-1.5 rounded-xl border text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                cli.status === 'Ativo'
                                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                              }`}
                              title={cli.status === 'Ativo' ? 'Suspender Acesso' : 'Desbloquear Acesso'}
                            >
                              {cli.status === 'Ativo' ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                              <span>{cli.status === 'Ativo' ? 'Bloquear' : 'Ativar'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          /* CONTÉUDO DA ABA 2: LOGS DE AUDITORIA */
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {logsFiltrados.length === 0 ? (
              <p className="text-center text-slate-400 py-8 text-xs">Nenhum evento registrado ainda.</p>
            ) : (
              logsFiltrados.map((log) => (
                <div
                  key={log.id}
                  className={`p-3.5 rounded-2xl border flex items-start justify-between gap-3 text-xs ${
                    log.status === 'Erro'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      : log.status === 'Alerta'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {log.status === 'Erro' ? (
                      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    ) : log.status === 'Alerta' ? (
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{log.nomeUsuario}</span>
                        <span className="text-[10px] text-teal-400">({log.emailUsuario})</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                          {log.tipoEvento}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-normal">{log.mensagemDetalhe}</p>
                      <span className="text-[10px] text-slate-500 block">Dispositivo: {log.dispositivoInfo}</span>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono shrink-0 whitespace-nowrap bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800">
                    {log.dataHora}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

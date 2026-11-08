import React, { useState } from 'react';
import {
  Search,
  Moon,
  Sun,
  Bell,
  User,
  LogOut,
  ChevronDown,
  Menu,
  Users,
  PlusCircle,
  Wallet
} from 'lucide-react';
import type { Paciente, Consulta } from '../types';
import type { UsuarioSistema } from '../services/authService';
import { getNotificacoesNovosClientesAdmin, marcarNotificacoesNovosClientesComoLidas } from '../services/authService';
import type { UsuarioOnlineInfo } from '../services/cloudSync';
import LOGO_BASE64 from '../assets/logoData';

interface HeaderBarProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  usuarioLogado: UsuarioSistema | null;
  onLogout: () => void;
  onNavigate: (tab: string) => void;
  pacientes: Paciente[];
  consultas: Consulta[];
  onSelectPaciente: (paciente: Paciente) => void;
  onToggleMobileMenu?: () => void;
  onAbrirNotificacoes?: () => void;
  onlineUsers?: UsuarioOnlineInfo[];
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  darkMode,
  onToggleDarkMode,
  usuarioLogado,
  onLogout,
  onNavigate,
  pacientes,
  consultas: _consultas,
  onSelectPaciente,
  onToggleMobileMenu,
  onAbrirNotificacoes,
  onlineUsers = []
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [notifOpen, setNotifOpen] = useState<boolean>(false);
  const [profileOpen, setProfileOpen] = useState<boolean>(false);

  const notificacoes = [
    { id: 1, titulo: '📱 Automação WhatsApp (18:30h)', desc: 'Balanço Diário de Pacientes e Faturamento por Clínica pronto para envio no (69) 993649158.', hora: 'Diário 18:30h' },
    { id: 2, titulo: '📊 Relatório Mensal Consolidado (Dia 01)', desc: 'Relatório estatístico de faturamento do mês anterior pronto para conferência no site!', hora: 'Dia 01' },
    { id: 3, titulo: '🏥 Unidades Monitoradas', desc: 'Matriz Centro, Filial Norte e Filial Sul sincronizadas.', hora: 'Ativo' }
  ];

  const resultadosBusca = searchQuery.trim()
    ? (pacientes || []).filter(
        (p) =>
          p &&
          ((p.nome || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.cpf || '').includes(searchQuery) ||
            (p.telefone || '').includes(searchQuery))
      )
    : [];

  const iniciais = usuarioLogado?.nome
    ? usuarioLogado.nome.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'CJ';

  return (
    <header
      className={`sticky top-0 z-20 h-16 border-b transition-colors backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 ${
        darkMode
          ? 'bg-[#080e1c]/95 border-slate-800 text-white'
          : 'bg-white/95 border-slate-200/90 text-slate-900 shadow-[0_2px_12px_rgba(11,37,69,0.04)]'
      }`}
    >
      {/* Botão Menu Hamburger para Celulares + Logo + Busca Global */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onToggleMobileMenu}
          className={`p-2 rounded-xl border md:hidden flex items-center justify-center cursor-pointer transition-all shrink-0 ${
            darkMode
              ? 'bg-slate-900 border-slate-800 text-sky-400 hover:bg-slate-800'
              : 'bg-slate-50 border-slate-200 text-[#0b2545] hover:bg-slate-100'
          }`}
          aria-label="Abrir Menu de Navegação"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo Oficial OdontoWeb no Header */}
        <div
          onClick={() => onNavigate('dashboard')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
            darkMode
              ? 'bg-slate-900 border-slate-800 hover:border-sky-500/40 text-white'
              : 'bg-slate-50 border-slate-200/90 hover:bg-sky-50 hover:border-sky-200 text-slate-900'
          }`}
        >
          <img
            src={LOGO_BASE64}
            alt="OdontoWeb - Finanças Logo"
            className="w-6 h-6 object-contain rounded-lg border border-sky-600/40 bg-white p-0.5 shrink-0"
          />
          <span className="font-extrabold text-xs tracking-tight flex items-center gap-1">
            OdontoWeb <span className="text-sky-700 font-black hidden sm:inline">PRO</span>
          </span>
        </div>

        {/* Campo de Busca Inteligente */}
        <div className="relative flex-1">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Buscar paciente, CPF ou registro..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              className={`w-full pl-9 pr-3.5 py-2 text-xs font-semibold rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-sky-500/30 ${
                darkMode
                  ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-400'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-500 focus:bg-white focus:border-sky-600'
              }`}
            />
          </div>

          {/* Result Dropdown */}
          {searchOpen && searchQuery.trim().length > 0 && (
            <div
              className={`absolute left-0 top-full mt-2 w-full max-w-md rounded-2xl border shadow-2xl p-2 z-50 space-y-1 max-h-64 overflow-y-auto ${
                darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              {resultadosBusca.length > 0 ? (
                resultadosBusca.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSelectPaciente(p);
                      setSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className={`p-2.5 rounded-xl cursor-pointer transition-colors flex items-center justify-between text-xs ${
                      darkMode ? 'hover:bg-slate-800' : 'hover:bg-sky-50'
                    }`}
                  >
                    <div>
                      <p className="font-extrabold text-slate-900">{p.nome}</p>
                      <p className="text-[11px] font-semibold text-slate-600">CPF: {p.cpf} • Tel: {p.telefone}</p>
                    </div>
                    <span className="text-[10px] font-extrabold text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-lg">
                      Ver Prontuário
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-3 text-center text-xs font-semibold text-slate-600">
                  Nenhum registro localizado para "{searchQuery}".
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Ações Rápidas & Perfil da Direita */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Atalhos Rápidos no Topo (Desktop) */}
        <div className="hidden lg:flex items-center gap-2 mr-1">
          <button
            onClick={() => onNavigate('producao')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 transition-all cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-sky-700" /> Produção
          </button>
          <button
            onClick={() => onNavigate('financeiro')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition-all cursor-pointer"
          >
            <Wallet className="w-3.5 h-3.5 text-teal-700" /> Financeiro
          </button>
        </div>

        {/* Indicador de Presença de Usuários Online em Tempo Real (ADMIN MASTER) */}
        {usuarioLogado?.role === 'admin' && (
          <div className="relative group">
            <div className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 border border-emerald-200 transition-all cursor-pointer">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping shrink-0"></span>
              <Users className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span className="hidden sm:inline font-mono">{onlineUsers.length || 1} Online</span>
              <span className="sm:hidden font-mono">{onlineUsers.length || 1}</span>
            </div>

            {/* Tooltip com a lista dos usuários conectados */}
            <div className="absolute right-0 top-full mt-2 w-64 p-3.5 rounded-2xl bg-white border border-slate-200 text-slate-900 shadow-2xl text-xs space-y-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto z-50">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-extrabold text-[10px] uppercase text-emerald-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span> Conectados Agora
                </span>
                <span className="text-[10px] text-slate-600 font-bold">{onlineUsers.length || 1} ativo(s)</span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {(onlineUsers.length > 0 ? onlineUsers : [
                  {
                    usuarioId: usuarioLogado?.id || 'master',
                    nome: usuarioLogado?.nome || 'Você',
                    email: usuarioLogado?.email || '',
                    role: usuarioLogado?.role || 'admin',
                    timestamp: Date.now()
                  }
                ]).map((u) => (
                  <div key={u.usuarioId} className="flex items-center justify-between py-1.5 text-xs border-b border-slate-100 last:border-0">
                    <div className="truncate pr-2">
                      <span className="font-extrabold text-slate-900 block truncate">{u.nome}</span>
                      <span className="text-[10px] font-medium text-slate-600 block truncate">{u.email}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase shrink-0 border ${
                      u.role === 'admin' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}>
                      {u.role === 'admin' ? 'Admin' : 'Cliente'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Toggle Tema (Claro / Escuro) */}
        <button
          onClick={onToggleDarkMode}
          className={`p-2 rounded-xl border transition-all cursor-pointer ${
            darkMode
              ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
          title={darkMode ? 'Alternar para Modo Claro Corporativo' : 'Alternar para Modo Escuro'}
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notificações */}
        <div className="relative">
          {(() => {
            const notificacoesNovosClientes = usuarioLogado?.role === 'admin' ? getNotificacoesNovosClientesAdmin() : [];
            const naoLidosCount = notificacoesNovosClientes.filter((n) => !n.lida).length;

            return (
              <button
                onClick={() => {
                  if (usuarioLogado?.role === 'admin') {
                    marcarNotificacoesNovosClientesComoLidas();
                  }
                  if (onAbrirNotificacoes) {
                    onAbrirNotificacoes();
                  } else {
                    setNotifOpen(!notifOpen);
                  }
                  setProfileOpen(false);
                }}
                className={`p-2 rounded-xl border transition-all cursor-pointer relative ${
                  darkMode
                    ? 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
                title="Central de Notificações"
              >
                <Bell className="w-4 h-4 text-sky-700" />
                {naoLidosCount > 0 ? (
                  <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white font-black text-[9px] w-4 h-4 rounded-full border border-white flex items-center justify-center animate-bounce shadow-sm">
                    {naoLidosCount}
                  </span>
                ) : (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-sky-600 rounded-full border border-white"></span>
                )}
              </button>
            );
          })()}

          {notifOpen && (
            <div
              className={`absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl border shadow-2xl p-3.5 z-50 space-y-2.5 ${
                darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="font-extrabold text-xs uppercase text-slate-700 tracking-wider">Notificações</span>
                <span className="text-[11px] text-sky-700 font-bold cursor-pointer">Marcar lidas</span>
              </div>

              <div className="space-y-2">
                {notificacoes.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-xl border text-xs space-y-1 transition-colors ${
                      darkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-200/80'
                    }`}
                  >
                    <div className="flex justify-between font-extrabold">
                      <span className="text-slate-900">{n.titulo}</span>
                      <span className="text-[10px] font-bold text-sky-700">{n.hora}</span>
                    </div>
                    <p className="text-[11px] font-medium text-slate-700">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Perfil do Usuário Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setProfileOpen(!profileOpen);
              setNotifOpen(false);
            }}
            className={`flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border transition-all cursor-pointer ${
              darkMode
                ? 'bg-slate-900 border-slate-800 hover:bg-slate-800'
                : 'bg-slate-50 border-slate-200/90 hover:bg-slate-100'
            }`}
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#0b2545] to-[#0284c7] flex items-center justify-center text-[11px] font-extrabold text-white shadow-xs shrink-0">
              {iniciais}
            </div>

            <div className="hidden md:block text-left">
              <p className="text-xs font-extrabold text-slate-900 leading-tight">{usuarioLogado?.nome || 'Crenilto Junior'}</p>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-slate-600 hidden sm:block" />
          </button>

          {/* Menu Dropdown do Perfil */}
          {profileOpen && (
            <div
              className={`absolute right-0 top-full mt-2 w-60 rounded-2xl border shadow-2xl p-2.5 z-50 space-y-1 ${
                darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="p-3 border-b border-slate-200 text-xs">
                <p className="font-extrabold text-slate-900">{usuarioLogado?.nome || 'Crenilto Junior'}</p>
                <p className="text-[11px] font-medium text-slate-600 mt-0.5">{usuarioLogado?.email || 'juniorbor1986@gmail.com'}</p>
                <span className="inline-block mt-1.5 text-[10px] font-extrabold text-sky-800 bg-sky-50 border border-sky-200 px-2.5 py-0.5 rounded-md">
                  {usuarioLogado?.funcao || 'Administrador Master'}
                </span>
              </div>

              <button
                onClick={() => {
                  onNavigate('configuracoes');
                  setProfileOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <User className="w-4 h-4 text-sky-700" /> Meu Perfil & Clínica
              </button>

              <button
                onClick={onLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Sair da Conta
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

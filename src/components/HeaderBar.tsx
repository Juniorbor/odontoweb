import React, { useState } from 'react';
import {
  Search,
  Moon,
  Sun,
  Bell,
  User,
  LogOut,
  ChevronDown,
  Menu
} from 'lucide-react';
import type { Paciente, Consulta } from '../types';
import type { UsuarioSistema } from '../services/authService';
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
  onAbrirNotificacoes
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
    ? pacientes.filter(
        (p) =>
          p.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.cpf.includes(searchQuery) ||
          p.telefone.includes(searchQuery)
      )
    : [];

  const iniciais = usuarioLogado?.nome
    ? usuarioLogado.nome.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'CJ';

  return (
    <header
      className={`sticky top-0 z-20 h-16 border-b transition-colors backdrop-blur-md px-3 sm:px-6 flex items-center justify-between gap-2.5 ${
        darkMode
          ? 'bg-slate-900/90 border-slate-800/80 text-white'
          : 'bg-white/90 border-slate-200/80 text-slate-800'
      }`}
    >
      {/* Botão Menu Hamburger para Celulares (Android & iOS) + Logo + Busca Global */}
      <div className="flex items-center gap-2 flex-1 max-w-md">
        <button
          onClick={onToggleMobileMenu}
          className={`p-2 rounded-2xl border md:hidden flex items-center justify-center cursor-pointer transition-all shrink-0 ${
            darkMode
              ? 'bg-slate-800 border-slate-700 text-teal-400 hover:bg-slate-700'
              : 'bg-slate-100 border-slate-200 text-teal-600 hover:bg-slate-200'
          }`}
          aria-label="Abrir Menu de Navegação"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo Oficial OdontoWeb no Header (Visível em Celulares e PC) */}
        <div
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 cursor-pointer shrink-0"
        >
          <img
            src={LOGO_BASE64}
            alt="Finanças Pessoal Logo"
            className="w-9 h-9 sm:w-10 sm:h-10 object-contain rounded-full border-2 border-teal-500/60 shadow-md shrink-0 bg-white p-0.5"
          />
          <span className="font-bold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
            Finanças <span className="text-teal-400">Pessoal</span>
          </span>
        </div>

        {/* Campo de Busca Inteligente */}
        <div className="relative flex-1">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar paciente, CPF..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              className={`w-full pl-9 pr-3 py-2 text-xs rounded-2xl border transition-all focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                darkMode
                  ? 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-500'
                  : 'bg-slate-100/80 border-slate-200 text-slate-800 placeholder-slate-400'
              }`}
            />
          </div>

          {/* Result Dropdown */}
          {searchOpen && searchQuery.trim().length > 0 && (
            <div
              className={`absolute left-0 top-full mt-2 w-full max-w-md rounded-2xl border shadow-2xl p-2 z-50 space-y-1 max-h-64 overflow-y-auto ${
                darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
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
                      darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{p.nome}</p>
                      <p className="text-[10px] text-slate-400">CPF: {p.cpf} • Tel: {p.telefone}</p>
                    </div>
                    <span className="text-[10px] font-bold text-teal-500 bg-teal-500/10 px-2 py-0.5 rounded-md">
                      Ver Prontuário
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-3 text-center text-xs text-slate-400">
                  Nenhum paciente localizado para "{searchQuery}".
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Ações da Direita */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Toggle Tema (Claro / Escuro) */}
        <button
          onClick={onToggleDarkMode}
          className={`p-2 rounded-2xl border transition-all cursor-pointer ${
            darkMode
              ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700'
              : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
          }`}
          title={darkMode ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notificações */}
        <div className="relative">
          <button
            onClick={() => {
              if (onAbrirNotificacoes) {
                onAbrirNotificacoes();
              } else {
                setNotifOpen(!notifOpen);
              }
              setProfileOpen(false);
            }}
            className={`p-2 rounded-2xl border transition-all cursor-pointer relative ${
              darkMode
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
            }`}
            title="Central de Notificações"
          >
            <Bell className="w-4 h-4 text-teal-400" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-slate-900 animate-pulse"></span>
          </button>

          {notifOpen && (
            <div
              className={`absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl border shadow-2xl p-3 z-50 space-y-2 ${
                darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-800/30">
                <span className="font-bold text-xs uppercase text-slate-400 tracking-wider">Notificações</span>
                <span className="text-[10px] text-teal-500 font-semibold cursor-pointer">Marcar lidas</span>
              </div>

              <div className="space-y-1.5">
                {notificacoes.map((n) => (
                  <div
                    key={n.id}
                    className={`p-2.5 rounded-xl border text-xs space-y-1 transition-colors ${
                      darkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-900 dark:text-white">{n.titulo}</span>
                      <span className="text-[10px] text-slate-400">{n.hora}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{n.desc}</p>
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
            className={`flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl border transition-all cursor-pointer ${
              darkMode
                ? 'bg-slate-800 border-slate-700 hover:bg-slate-700'
                : 'bg-slate-100 border-slate-200 hover:bg-slate-200'
            }`}
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center text-xs font-extrabold text-white shadow shrink-0">
              {iniciais}
            </div>

            <div className="hidden md:block text-left">
              <p className="text-xs font-bold leading-tight">{usuarioLogado?.nome || 'Crenilto Junior'}</p>
              <p className="text-[10px] text-teal-500 leading-none font-semibold">{usuarioLogado?.cro || 'CRO-RO 147369'}</p>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* Menu Dropdown do Perfil */}
          {profileOpen && (
            <div
              className={`absolute right-0 top-full mt-2 w-56 rounded-2xl border shadow-2xl p-2 z-50 space-y-1 ${
                darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <div className="p-3 border-b border-slate-800/30 text-xs">
                <p className="font-bold text-slate-900 dark:text-white">{usuarioLogado?.nome || 'Crenilto Junior'}</p>
                <p className="text-[11px] text-slate-400">{usuarioLogado?.email || 'juniorbor1986@gmail.com'}</p>
                <span className="inline-block mt-1 text-[10px] font-semibold text-teal-500 bg-teal-500/10 px-2 py-0.5 rounded-md">
                  {usuarioLogado?.funcao || 'Administrador / Cirurgião-Dentista'}
                </span>
              </div>

              <button
                onClick={() => {
                  onNavigate('configuracoes');
                  setProfileOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  darkMode ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <User className="w-4 h-4 text-teal-500" /> Meu Perfil & Clínica
              </button>

              <button
                onClick={onLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
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

import React from 'react';
import {
  Activity,
  DollarSign,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  FileSpreadsheet,
  Stethoscope,
  X
} from 'lucide-react';

import LOGO_BASE64 from '../assets/logoData';

interface SidebarProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  darkMode?: boolean;
  onLogout?: () => void;
  userRole?: 'admin' | 'cliente';
  badgeCounts?: {
    pacientes?: number;
    consultasHoje?: number;
    pendentes?: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
  darkMode,
  onLogout,
  userRole = 'admin',
  badgeCounts
}) => {
  const allMenuItems = [
    { id: 'odontologia', label: 'Odontologia', icon: Stethoscope, badge: 'NOVO' },
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'producao', label: 'Produção', icon: FileSpreadsheet },
    { id: 'financeiro', label: 'Financeiro', icon: DollarSign, badge: badgeCounts?.pendentes ? `! ${badgeCounts.pendentes}` : undefined },
    { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
    { id: 'configuracoes', label: 'Configurações', icon: Settings },
  ];

  const menuItems = userRole === 'cliente'
    ? allMenuItems.filter(item => item.id !== 'producao')
    : allMenuItems;

  const handleItemClick = (id: string) => {
    onNavigate(id);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Backdrop de fundo para Celulares (Android & iOS) */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-40 md:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen z-50 transition-all duration-300 flex flex-col justify-between border-r select-none backdrop-blur-xl ${
          darkMode
            ? 'bg-slate-900/95 border-slate-800/80 text-slate-200 shadow-2xl'
            : 'bg-white/95 border-slate-200/80 text-slate-700 shadow-xl'
        } ${isCollapsed ? 'w-20' : 'w-64'} ${
          isMobileOpen ? 'translate-x-0 w-72 max-w-[85vw]' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header do Logo e Fechar no Mobile */}
        <div className="p-4 flex items-center justify-between border-b border-slate-800/20 dark:border-slate-800/60">
          <div
            onClick={() => handleItemClick('dashboard')}
            className="flex items-center gap-3 cursor-pointer overflow-hidden group"
          >
            <div className="relative">
              <img
                src={LOGO_BASE64}
                alt="Finanças Pessoal Logo"
                className="w-11 h-11 object-contain rounded-full border-2 border-teal-500/60 shadow-md shadow-teal-500/30 shrink-0 bg-white p-0.5 group-hover:scale-105 transition-transform"
              />
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full animate-pulse"></span>
            </div>

            {(!isCollapsed || isMobileOpen) && (
              <div className="transition-opacity duration-300">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
                  Finanças <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">Pessoal</span>
                </span>
                <span className="text-[9px] font-bold text-emerald-400 block -mt-0.5 uppercase tracking-wider">
                  Organize • Planeje • Realize
                </span>
              </div>
            )}
          </div>

          {/* Botão de Fechar no Mobile */}
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white md:hidden cursor-pointer"
            aria-label="Fechar Menu"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Botão de recolher/expandir sidebar no Desktop */}
          <button
            onClick={onToggleCollapse}
            className={`p-1.5 rounded-xl border transition-colors hidden md:flex items-center justify-center cursor-pointer ${
              darkMode
                ? 'bg-slate-800/80 border-slate-700/70 text-slate-400 hover:text-white hover:bg-slate-700'
                : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-200'
            }`}
            title={isCollapsed ? 'Expandir Menu' : 'Recolher Menu'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Lista de Navegação com Pílulas Neon */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2 scrollbar-thin">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all duration-200 cursor-pointer min-h-[44px] ${
                    isActive
                      ? 'bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-500/25 scale-[1.01]'
                      : darkMode
                      ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-teal-400'
                  }`} />

                  {(!isCollapsed || isMobileOpen) && (
                    <span className="truncate flex-1 text-left tracking-wide">{item.label}</span>
                  )}

                  {(!isCollapsed || isMobileOpen) && item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : darkMode
                          ? 'bg-slate-800 text-teal-400 border border-slate-700'
                          : 'bg-teal-100 text-teal-800'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer com botão Sair */}
        <div className="p-3 border-t border-slate-800/20 dark:border-slate-800/60 space-y-2">
          <button
            onClick={() => {
              if (onLogout) onLogout();
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer min-h-[44px] ${
              darkMode
                ? 'text-rose-400 hover:bg-rose-950/40 hover:text-rose-300'
                : 'text-rose-600 hover:bg-rose-50 hover:text-rose-700'
            }`}
            title="Encerrar Sessão"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {(!isCollapsed || isMobileOpen) && <span>Sair do Sistema</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

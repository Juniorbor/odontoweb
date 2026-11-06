import {
  Activity,
  DollarSign,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  FileSpreadsheet,
  Database,
  Calendar,
  X,
  Sparkles
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
  const sections = [
    {
      title: 'Principal',
      items: [
        { id: 'dashboard', label: 'Visão Geral', sub: 'Painel & Resumo', icon: Activity, color: 'text-teal-400', activeBg: 'from-teal-500/20 to-emerald-500/10 border-teal-500/40 text-teal-300' },
        { id: 'agenda', label: 'Minha Agenda', sub: 'Compromissos', icon: Calendar, color: 'text-sky-400', activeBg: 'from-sky-500/20 to-indigo-500/10 border-sky-500/40 text-sky-300' },
      ]
    },
    {
      title: 'Operação & Finanças',
      items: [
        ...(userRole !== 'cliente'
          ? [{ id: 'producao', label: 'Produção', sub: 'Exames & Fechamentos', icon: FileSpreadsheet, color: 'text-indigo-400', activeBg: 'from-indigo-500/20 to-purple-500/10 border-indigo-500/40 text-indigo-300' }]
          : []),
        { id: 'financeiro', label: 'Financeiro', sub: 'Contas do Lar', icon: DollarSign, color: 'text-emerald-400', activeBg: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/40 text-emerald-300', badge: badgeCounts?.pendentes ? `! ${badgeCounts.pendentes}` : undefined },
        { id: 'relatorios', label: 'Relatórios', sub: 'Extratos & Análises', icon: BarChart3, color: 'text-amber-400', activeBg: 'from-amber-500/20 to-orange-500/10 border-amber-500/40 text-amber-300' },
      ]
    },
    {
      title: 'Sistema & Segurança',
      items: [
        { id: 'bancodedados', label: 'Banco de Dados', sub: 'Nuvem & Backups', icon: Database, color: 'text-purple-400', activeBg: 'from-purple-500/20 to-pink-500/10 border-purple-500/40 text-purple-300', badge: 'ON' },
        { id: 'configuracoes', label: 'Configurações', sub: 'Preferências', icon: Settings, color: 'text-slate-400', activeBg: 'from-slate-700/40 to-slate-800/40 border-slate-600 text-white' },
      ]
    }
  ];

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
        className={`fixed left-0 top-0 h-screen z-50 transition-all duration-300 flex flex-col justify-between border-r select-none backdrop-blur-2xl ${
          darkMode
            ? 'bg-[#070b14]/95 border-slate-800/70 text-slate-200 shadow-[10px_0_40px_rgba(0,0,0,0.6)]'
            : 'bg-white/95 border-slate-200/80 text-slate-700 shadow-xl'
        } ${isCollapsed ? 'w-20' : 'w-64'} ${
          isMobileOpen ? 'translate-x-0 w-72 max-w-[85vw]' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header do Logo e Fechar no Mobile */}
        <div className="p-3.5 flex items-center justify-between border-b border-slate-800/50">
          <div
            onClick={() => handleItemClick('dashboard')}
            className={`flex items-center gap-3 px-2.5 py-2 rounded-2xl border transition-all cursor-pointer overflow-hidden shrink-0 ${
              darkMode
                ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950/50 border-slate-800 hover:border-teal-500/40 text-white shadow-lg'
                : 'bg-slate-100 border-slate-200 hover:bg-slate-200/80 text-slate-800 shadow-sm'
            }`}
          >
            <div className="relative shrink-0 flex items-center justify-center">
              <img
                src={LOGO_BASE64}
                alt="OdontoWeb - Finanças Logo"
                className="w-8 h-8 object-contain rounded-xl border border-teal-500/60 bg-white p-0.5 shrink-0 shadow-md"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-950 rounded-full"></span>
            </div>

            {(!isCollapsed || isMobileOpen) && (
              <div className="transition-opacity duration-300 flex flex-col justify-center leading-tight pr-1">
                <span className="font-extrabold text-xs tracking-tight text-slate-900 dark:text-white flex items-center gap-1 whitespace-nowrap">
                  OdontoWeb <span className="text-teal-400 font-black">PRO</span>
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                  <Sparkles className="w-2.5 h-2.5 text-amber-400" /> Finanças & Produção
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
            className={`p-1.5 rounded-xl border transition-all hidden md:flex items-center justify-center cursor-pointer ${
              darkMode
                ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-teal-400 hover:border-teal-500/40'
                : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-200'
            }`}
            title={isCollapsed ? 'Expandir Menu' : 'Recolher Menu'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Lista de Navegação Categorizada Estilo Bento/SaaS */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin">
          {sections.map((section) => (
            <div key={section.title} className="space-y-1.5">
              {(!isCollapsed || isMobileOpen) && (
                <p className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                  {section.title}
                </p>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full group relative flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 cursor-pointer min-h-[46px] border ${
                      isActive
                        ? `bg-gradient-to-r ${item.activeBg} shadow-lg`
                        : darkMode
                        ? 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/80 hover:border-slate-800/80'
                        : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                    title={isCollapsed ? `${item.label} — ${item.sub}` : undefined}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-teal-400 rounded-r-full shadow-[0_0_10px_#14b8a6]" />
                    )}

                    <div className={`p-2 rounded-xl transition-transform group-hover:scale-110 shrink-0 ${
                      isActive
                        ? 'bg-slate-950/60 shadow-inner'
                        : darkMode
                        ? 'bg-slate-900/90 border border-slate-800/80'
                        : 'bg-slate-100'
                    }`}>
                      <Icon className={`w-4 h-4 ${isActive ? item.color : `${item.color} opacity-80 group-hover:opacity-100`}`} />
                    </div>

                    {(!isCollapsed || isMobileOpen) && (
                      <div className="flex-1 text-left truncate">
                        <span className={`block truncate font-bold leading-tight ${isActive ? 'text-white' : ''}`}>
                          {item.label}
                        </span>
                        <span className="block truncate text-[10px] text-slate-500 font-medium mt-0.5">
                          {item.sub}
                        </span>
                      </div>
                    )}

                    {(!isCollapsed || isMobileOpen) && item.badge !== undefined && (
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 border ${
                          isActive
                            ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                            : darkMode
                            ? 'bg-slate-900 text-teal-400 border-slate-800'
                            : 'bg-teal-100 text-teal-800 border-teal-200'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer com Status & Botão Sair */}
        <div className="p-3 border-t border-slate-800/60 space-y-2">
          {(!isCollapsed || isMobileOpen) && (
            <div className="px-3 py-2 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1.5 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Nuvem Sincronizada
              </span>
              <span className="font-mono text-teal-400 font-bold">v2.5</span>
            </div>
          )}

          <button
            onClick={() => {
              if (onLogout) onLogout();
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full flex items-center justify-center sm:justify-start gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer min-h-[42px] border ${
              darkMode
                ? 'border-rose-500/20 bg-rose-500/5 text-rose-400 hover:bg-rose-500/15 hover:border-rose-500/40 hover:text-rose-300'
                : 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
            }`}
            title="Encerrar Sessão"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {(!isCollapsed || isMobileOpen) && <span>Encerrar Sessão</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

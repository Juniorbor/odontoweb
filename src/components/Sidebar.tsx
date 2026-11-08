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
  ShieldCheck
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
        { id: 'dashboard', label: 'Visão Geral', sub: 'Painel & Indicadores', icon: Activity, iconColor: 'text-sky-600' },
        { id: 'agenda', label: 'Minha Agenda', sub: 'Compromissos & Rotina', icon: Calendar, iconColor: 'text-teal-600' }
      ]
    },
    {
      title: 'Operação & Finanças',
      items: [
        ...(userRole !== 'cliente'
          ? [{ id: 'producao', label: 'Produção Clínica', sub: 'Exames & Fechamentos', icon: FileSpreadsheet, iconColor: 'text-blue-600' }]
          : []),
        {
          id: 'financeiro',
          label: 'Financeiro',
          sub: 'Contas do Lar & Renda',
          icon: DollarSign,
          iconColor: 'text-emerald-600',
          badge: badgeCounts?.pendentes ? `! ${badgeCounts.pendentes}` : undefined
        },
        { id: 'relatorios', label: 'Relatórios', sub: 'Extratos & Análises PDF', icon: BarChart3, iconColor: 'text-amber-600' }
      ]
    },
    {
      title: 'Sistema & Segurança',
      items: [
        { id: 'bancodedados', label: 'Banco de Dados', sub: 'Nuvem & Backups', icon: Database, iconColor: 'text-indigo-600', badge: 'ON' },
        { id: 'configuracoes', label: 'Configurações', sub: 'Perfil & Preferências', icon: Settings, iconColor: 'text-slate-600' }
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
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen z-50 transition-all duration-300 flex flex-col justify-between border-r select-none ${
          darkMode
            ? 'bg-[#080e1c] border-slate-800 text-slate-100 shadow-2xl'
            : 'bg-white border-slate-200/90 text-slate-900 shadow-[4px_0_24px_rgba(11,37,69,0.05)]'
        } ${isCollapsed ? 'w-20' : 'w-64'} ${
          isMobileOpen ? 'translate-x-0 w-72 max-w-[85vw]' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header da Marca OdontoWeb PRO */}
        <div className={`p-4 flex items-center justify-between border-b ${darkMode ? 'border-slate-800' : 'border-slate-200/80'}`}>
          <div
            onClick={() => handleItemClick('dashboard')}
            className="hero-executive flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all cursor-pointer overflow-hidden shrink-0 shadow-md"
          >
            <div className="relative shrink-0 flex items-center justify-center">
              <img
                src={LOGO_BASE64}
                alt="OdontoWeb - Finanças Logo"
                className="w-8 h-8 object-contain rounded-xl border border-white/40 bg-white p-0.5 shrink-0 shadow-xs"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#0b2545] rounded-full"></span>
            </div>

            {(!isCollapsed || isMobileOpen) && (
              <div className="transition-opacity duration-300 flex flex-col justify-center leading-tight pr-1">
                <span className="font-extrabold text-xs tracking-tight text-white flex items-center gap-1 whitespace-nowrap">
                  OdontoWeb <span className="text-teal-300 font-black">PRO</span>
                </span>
                <span className="text-[10px] font-semibold text-sky-100 tracking-wide mt-0.5">
                  Saúde & Finanças
                </span>
              </div>
            )}
          </div>

          {/* Botão de Fechar no Mobile */}
          <button
            onClick={onCloseMobile}
            className={`p-2 rounded-xl md:hidden cursor-pointer ${
              darkMode ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            aria-label="Fechar Menu"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Botão de recolher/expandir sidebar no Desktop */}
          <button
            onClick={onToggleCollapse}
            className={`p-2 rounded-xl border transition-all hidden md:flex items-center justify-center cursor-pointer ${
              darkMode
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-sky-400'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:text-[#0b2545] hover:bg-slate-100'
            }`}
            title={isCollapsed ? 'Expandir Menu' : 'Recolher Menu'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Lista de Navegação Categorizada com Alto Contraste */}
        <div className="flex-1 overflow-y-auto px-3 py-5 space-y-6 scrollbar-thin">
          {sections.map((section) => (
            <div key={section.title} className="space-y-1.5">
              {(!isCollapsed || isMobileOpen) && (
                <p className={`px-3 text-[11px] font-extrabold uppercase tracking-wider ${
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
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
                    className={`w-full group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all duration-200 cursor-pointer min-h-[48px] border ${
                      isActive
                        ? 'hero-executive border-transparent shadow-md'
                        : darkMode
                        ? 'border-transparent text-slate-300 hover:text-white hover:bg-slate-900'
                        : 'border-transparent text-slate-800 hover:text-[#0b2545] hover:bg-sky-50/80 hover:border-sky-200/70'
                    }`}
                    title={isCollapsed ? `${item.label} — ${item.sub}` : undefined}
                  >
                    <div
                      className={`p-2 rounded-xl transition-transform group-hover:scale-105 shrink-0 ${
                        isActive
                          ? 'bg-white/15 text-white'
                          : darkMode
                          ? 'bg-slate-900 border border-slate-800 text-sky-400'
                          : `bg-slate-100 border border-slate-200/80 ${item.iconColor} group-hover:bg-white`
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    {(!isCollapsed || isMobileOpen) && (
                      <div className="flex-1 text-left truncate">
                        <span
                          className={`block truncate text-[13px] font-extrabold leading-tight ${
                            isActive ? 'text-white' : darkMode ? 'text-slate-100' : 'text-slate-900'
                          }`}
                        >
                          {item.label}
                        </span>
                        <span
                          className={`block truncate text-[11px] font-semibold mt-0.5 ${
                            isActive ? 'text-sky-100' : darkMode ? 'text-slate-400' : 'text-slate-600'
                          }`}
                        >
                          {item.sub}
                        </span>
                      </div>
                    )}

                    {(!isCollapsed || isMobileOpen) && item.badge !== undefined && (
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 border ${
                          isActive
                            ? 'bg-white/20 text-white border-white/30'
                            : 'bg-sky-50 text-sky-800 border-sky-200'
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
        <div className={`p-3.5 border-t space-y-2.5 ${darkMode ? 'border-slate-800' : 'border-slate-200/80'}`}>
          {(!isCollapsed || isMobileOpen) && (
            <div
              className={`px-3.5 py-2.5 rounded-xl border flex items-center justify-between text-[11px] font-bold ${
                darkMode
                  ? 'bg-slate-900 border-slate-800 text-slate-300'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                Nuvem Sincronizada
              </span>
              <span className="font-mono text-sky-700 font-extrabold">v2.5</span>
            </div>
          )}

          <button
            onClick={() => {
              if (onLogout) onLogout();
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full flex items-center justify-center sm:justify-start gap-3 px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer min-h-[42px] border ${
              darkMode
                ? 'border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
                : 'border-rose-200 bg-rose-50/80 text-rose-700 hover:bg-rose-100 hover:border-rose-300'
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

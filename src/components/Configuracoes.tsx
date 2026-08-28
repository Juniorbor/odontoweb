import React, { useState } from 'react';
import { Settings, Save, CheckCircle2, Globe } from 'lucide-react';
import { PainelAuditoriaAdmin } from './PainelAuditoriaAdmin';
import type { UsuarioSistema } from '../services/authService';

interface ConfiguracoesProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  usuarioLogado?: UsuarioSistema | null;
}

export const Configuracoes: React.FC<ConfiguracoesProps> = ({
  darkMode,
  usuarioLogado
}) => {
  const [salvo, setSalvo] = useState<boolean>(false);
  const [nichoSistema, setNichoSistema] = useState<string>('clinica');

  const isAdmin = usuarioLogado?.role === 'admin' || usuarioLogado?.email === 'juniorbor1986@gmail.com';

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    setSalvo(true);
    setTimeout(() => setSalvo(false), 3000);
  };

  return (
    <div className="space-y-6 font-sans text-slate-200">
      {/* Top Bar Header */}
      <div className={`p-6 rounded-3xl border shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div>
          <span className="text-[10px] font-semibold text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/30 uppercase tracking-widest">
            SaaS Universal & Customização
          </span>
          <h2 className="text-xl font-bold mt-1 flex items-center gap-2">
            <Settings className="w-6 h-6 text-teal-500" /> Configurações Gerais do Sistema
          </h2>
          <p className="text-xs text-slate-400 font-normal">
            Personalização de perfil de nicho, permissões de acesso e notificações automatizadas.
          </p>
        </div>

        <button
          onClick={handleSalvar}
          className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-teal-600/20 transition-all cursor-pointer"
        >
          {salvo ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          {salvo ? 'Configurações Salvas!' : 'Salvar Preferências'}
        </button>
      </div>

      {/* SEÇÃO DE AUDITORIA EXCLUSIVA DO ADMINISTRADOR MASTER */}
      {isAdmin && (
        <PainelAuditoriaAdmin darkMode={darkMode} />
      )}

      <form onSubmit={handleSalvar} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-normal">
        {/* MÓDULO UNIVERSAL: SELETOR DE NICHO & PERFIL */}
        <div className={`p-6 rounded-3xl border shadow-xl space-y-4 md:col-span-2 ${
          darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center gap-2 text-teal-400 font-semibold border-b border-slate-800 pb-3">
            <Globe className="w-5 h-5" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Nicho do Sistema & Adaptabilidade Universal (Modo de Operação)</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div
              onClick={() => setNichoSistema('clinica')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                nichoSistema === 'clinica'
                  ? 'bg-teal-500/10 border-teal-500 text-white shadow-md'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white">🏥 Dentista / Clínicas (Seu Modo Atual)</span>
                {nichoSistema === 'clinica' && <CheckCircle2 className="w-4 h-4 text-teal-400" />}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Preserva as 7 clínicas (Ariquemes, P. Velho, etc.), exames e Fernando/Bernardo.</p>
            </div>

            <div
              onClick={() => setNichoSistema('pessoal')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                nichoSistema === 'pessoal'
                  ? 'bg-teal-500/10 border-teal-500 text-white shadow-md'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white">🏠 Finanças Pessoais & Lar</span>
                {nichoSistema === 'pessoal' && <CheckCircle2 className="w-4 h-4 text-teal-400" />}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Foco no controle orçamentário doméstico e contas do lar.</p>
            </div>

            <div
              onClick={() => setNichoSistema('servicos')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                nichoSistema === 'servicos'
                  ? 'bg-teal-500/10 border-teal-500 text-white shadow-md'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white">💼 Prestador de Serviços / Autônomo</span>
                {nichoSistema === 'servicos' && <CheckCircle2 className="w-4 h-4 text-teal-400" />}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Emissão de recibos e gestão de recebíveis de clientes.</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

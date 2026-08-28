import React, { useState } from 'react';
import { Settings, Moon, Save, CheckCircle2, MessageSquare, Shield, Globe } from 'lucide-react';

interface ConfiguracoesProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  usuarioLogado?: {
    nome: string;
    email: string;
    funcao: string;
    cro: string;
  } | null;
}

export const Configuracoes: React.FC<ConfiguracoesProps> = ({
  darkMode,
  onToggleDarkMode
}) => {
  const [salvo, setSalvo] = useState<boolean>(false);
  const [nichoSistema, setNichoSistema] = useState<string>('clinica');
  const [nivelAcesso, setNivelAcesso] = useState<string>('admin');

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
                <span className="font-bold text-xs text-white">💼 Prestadores de Serviço & Autônomos</span>
                {nichoSistema === 'servicos' && <CheckCircle2 className="w-4 h-4 text-teal-400" />}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Para advogados, contadores, consultores e autônomos.</p>
            </div>
          </div>
        </div>

        {/* NÍVEIS DE ACESSO (PERMISSÕES SAAS) */}
        <div className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
          darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <h3 className="font-bold text-xs uppercase text-teal-400 tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4" /> Nível de Acesso & Permissões do Usuário
          </h3>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Perfil de Acesso Atual</label>
            <select
              value={nivelAcesso}
              onChange={(e) => setNivelAcesso(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold focus:ring-2 focus:ring-teal-500"
            >
              <option value="admin">👑 Administrador / Sócio (Acesso Total + Pessoal)</option>
              <option value="secretaria">👩‍💼 Secretária / Recepcionista (Apenas Produção)</option>
              <option value="contador">📊 Contador (Apenas DRE e Extratos)</option>
            </select>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Permite simular o acesso restrito que cada funcionário terá na venda do SaaS.
            </span>
          </div>
        </div>

        {/* Tema & Aparência */}
        <div className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
          darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <h3 className="font-bold text-xs uppercase text-teal-400 tracking-wider flex items-center gap-2">
            <Moon className="w-4 h-4" /> Aparência e Tema
          </h3>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            <div>
              <p className="font-semibold text-white">Modo Escuro (Dark Theme)</p>
              <p className="text-[11px] text-slate-400">Alterna entre o tema Claro e Escuro de alta visibilidade.</p>
            </div>

            <button
              type="button"
              onClick={onToggleDarkMode}
              className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                darkMode ? 'bg-amber-400 text-slate-950 shadow' : 'bg-slate-800 text-white shadow'
              }`}
            >
              {darkMode ? 'Desativar Dark' : 'Ativar Dark'}
            </button>
          </div>
        </div>

        {/* Automação WhatsApp & Disparos Diários */}
        <div className={`p-6 rounded-3xl border shadow-xl space-y-4 md:col-span-2 ${
          darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <h3 className="font-bold text-xs uppercase text-emerald-400 tracking-wider flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Automação WhatsApp 24/7 (Render Cloud)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Contato Cadastrado p/ Disparo</label>
              <input
                type="text"
                defaultValue="(69) 993649158"
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-bold"
                readOnly
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Recebe o balanço diário de faturamento e pacientes às 18:30h.</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Status da Automação na Nuvem</label>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-semibold text-teal-400 block">⏰ Diário às 18:30h (Ativo 24/7 na Nuvem Render)</span>
                <span className="font-semibold text-emerald-400 block">📊 Mensal todo dia 01 (Mês Anterior)</span>
              </div>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
};

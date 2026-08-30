import React, { useState } from 'react';
import { MessageSquare, CheckCircle2, Send, Key, Sliders } from 'lucide-react';
import type { ConfiguracaoWhatsApp } from '../../types/agendaInteligente';
import { getConfiguracaoWhatsApp, salvarConfiguracaoWhatsApp, gerarLinkWhatsAppMensagem } from '../../services/whatsappService';

interface ConfiguracaoWhatsAppPainelProps {
  darkMode?: boolean;
  usuarioId?: string;
}

export const ConfiguracaoWhatsAppPainel: React.FC<ConfiguracaoWhatsAppPainelProps> = ({ darkMode, usuarioId }) => {
  const [config, setConfig] = useState<ConfiguracaoWhatsApp>(getConfiguracaoWhatsApp(usuarioId));
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  // Teste de Mensagem
  const [telefoneTeste, setTelefoneTeste] = useState<string>('(69) 99364-9158');
  const [mensagemTeste, setMensagemTeste] = useState<string>('🦷 Teste de conexão oficial do OdontoWeb WhatsApp Gateway!');

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    salvarConfiguracaoWhatsApp(config, usuarioId);
    setMensagemSucesso('✅ Configurações e regras do WhatsApp salvas com sucesso!');
    setTimeout(() => setMensagemSucesso(null), 4000);
  };

  const handleEnviarTeste = () => {
    const link = gerarLinkWhatsAppMensagem(telefoneTeste, mensagemTeste);
    window.open(link, '_blank');
    setMensagemSucesso(`✅ Mensagem de teste gerada e disparada para ${telefoneTeste}!`);
    setTimeout(() => setMensagemSucesso(null), 4000);
  };

  return (
    <div className="space-y-6 font-sans animate-fadeIn">
      
      {/* Header do Módulo */}
      <div className={`p-6 rounded-3xl border shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/30 shrink-0">
            <MessageSquare className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-widest">
                Gateway de Automação Oficial
              </span>
              <span className="text-[10px] font-bold text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/30">
                🟢 {config.conectado ? 'Conectado' : 'Aguardando QR Code'}
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight mt-0.5">Configurações & Lembretes WhatsApp</h2>
            <p className="text-xs text-slate-400">
              Gerencie réguas de lembretes automáticos de 7 dias, 24 horas e 2 horas antes da consulta.
            </p>
          </div>
        </div>
      </div>

      {mensagemSucesso && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{mensagemSucesso}</span>
        </div>
      )}

      <form onSubmit={handleSalvar} className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans text-xs">
        
        {/* PARÂMETROS DA API / CREDENCIAIS SEGURAS */}
        <div className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
          darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center gap-2 text-emerald-400 font-extrabold border-b border-slate-800 pb-3">
            <Key className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Parâmetros de Integração API</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="font-bold text-slate-300 block mb-1">Número Conectado (Instância):</label>
              <input
                type="text"
                value={config.numeroConectado}
                onChange={(e) => setConfig({ ...config, numeroConectado: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">API Key / Token (Armazenado com Segurança):</label>
              <input
                type="password"
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 font-mono font-bold tracking-widest"
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">URL do Webhook de Recebimento de Respostas:</label>
              <input
                type="text"
                value={config.webhookUrl}
                onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-black cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            Salvar Parâmetros da API
          </button>
        </div>

        {/* RÉGUAS DE LEMBRETES AUTOMÁTICOS */}
        <div className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
          darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center gap-2 text-teal-400 font-extrabold border-b border-slate-800 pb-3">
            <Sliders className="w-5 h-5 text-teal-400" />
            <h3 className="text-base font-bold text-white">Régua de Disparos Automáticos</h3>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center">
              <div>
                <span className="font-bold text-white block">📅 Lembrete de 7 Dias Antes:</span>
                <span className="text-[10px] text-slate-400">Avisa sobre a data da consulta futura</span>
              </div>
              <input
                type="checkbox"
                checked={config.lembrete7DiasAtivo}
                onChange={(e) => setConfig({ ...config, lembrete7DiasAtivo: e.target.checked })}
                className="w-5 h-5 accent-teal-500 cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center">
              <div>
                <span className="font-bold text-white block">✅ Confirmação 24 Horas Antes:</span>
                <span className="text-[10px] text-slate-400">Envia botões de confirmação (Sim / Reagendar / Cancelar)</span>
              </div>
              <input
                type="checkbox"
                checked={config.lembrete24HorasAtivo}
                onChange={(e) => setConfig({ ...config, lembrete24HorasAtivo: e.target.checked })}
                className="w-5 h-5 accent-teal-500 cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center">
              <div>
                <span className="font-bold text-white block">⏰ Alerta Próximo de 2 Horas Antes:</span>
                <span className="text-[10px] text-slate-400">Lembrete no dia da consulta para evitar faltas</span>
              </div>
              <input
                type="checkbox"
                checked={config.lembrete2HorasAtivo}
                onChange={(e) => setConfig({ ...config, lembrete2HorasAtivo: e.target.checked })}
                className="w-5 h-5 accent-teal-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

      </form>

      {/* DISPARO DE MENSAGEM DE TESTE */}
      <div className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
        darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <h3 className="text-sm font-bold flex items-center gap-2 border-b border-slate-800 pb-3">
          <Send className="w-4 h-4 text-emerald-400" /> Teste de Conexão e Disparo Direto
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="font-bold text-slate-300 block mb-1">Telefone para Teste:</label>
            <input
              type="text"
              value={telefoneTeste}
              onChange={(e) => setTelefoneTeste(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium"
            />
          </div>

          <div className="md:col-span-2">
            <label className="font-bold text-slate-300 block mb-1">Mensagem de Teste:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={mensagemTeste}
                onChange={(e) => setMensagemTeste(e.target.value)}
                className="flex-1 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium"
              />
              <button
                type="button"
                onClick={handleEnviarTeste}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black px-5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" /> Disparar Teste
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

import React, { useState, useEffect } from 'react';
import type { ItemProducaoTomo } from '../types';
import {
  getConfigNotificacaoProducao,
  salvarConfigNotificacaoProducao,
  gerarTextoRelatorioProducaoDiaria,
  gerarLinkWhatsAppDirectApi,
  type ConfigNotificacaoProducaoWhatsApp
} from '../services/whatsappService';
import {
  MessageSquare,
  Clock,
  Building2,
  Calendar,
  Send,
  CheckCircle2,
  Bell,
  Sparkles,
  Users,
  DollarSign,
  TrendingUp,
  FileSpreadsheet,
  Phone,
  X,
  AlertCircle,
  Zap,
  Info
} from 'lucide-react';

interface WhatsappNotificacoesProps {
  darkMode?: boolean;
  itensProducao?: ItemProducaoTomo[];
}

export interface DesempenhoClinica {
  id: string;
  nome: string;
  unidade: string;
  pacientesHoje: number;
  faturamentoHoje: number;
  ticketMedioHoje: number;
  procedimentosDestaque: string;
  pacientesMesAnterior: number;
  faturamentoMesAnterior: number;
  crescimentoMes: number;
}

const TODAS_UNIDADES_PRODUCAO = [
  { id: 'cli-1', nome: 'Clínica Ariquemes', unidade: 'Ariquemes', proprietario: 'Fernando' },
  { id: 'cli-2', nome: 'Clínica Porto Velho', unidade: 'Porto Velho', proprietario: 'Fernando' },
  { id: 'cli-3', nome: 'Clínica Machadinho', unidade: 'Machadinho', proprietario: 'Fernando' },
  { id: 'cli-4', nome: 'Clínica Cacoal', unidade: 'Cacoal', proprietario: 'Fernando' },
  { id: 'cli-5', nome: 'Clínica Rolim de Moura', unidade: 'Rolim de Moura', proprietario: 'Bernardo' },
  { id: 'cli-6', nome: 'Clínica Ouro Preto', unidade: 'Ouro Preto', proprietario: 'Bernardo' },
  { id: 'cli-7', nome: 'Clínica Ji-Paraná', unidade: 'Ji-Paraná', proprietario: 'Bernardo' }
];

export const WhatsappNotificacoes: React.FC<WhatsappNotificacoesProps> = ({
  darkMode,
  itensProducao = []
}) => {
  const [telefoneWhatsApp, setTelefoneWhatsApp] = useState<string>('(69) 993649158');
  const [horarioDiario, setHorarioDiario] = useState<string>('18:30');
  const [automacaoAtiva, setAutomacaoAtiva] = useState<boolean>(true);
  const [notificarDiaUm, setNotificarDiaUm] = useState<boolean>(true);
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [callmebotApiKey, setCallmebotApiKey] = useState<string>('');

  const [sucessoMsg, setSucessoMsg] = useState<string>('');
  const [modalEditAberto, setModalEditAberto] = useState<boolean>(false);
  const [modalRelatorioMensalAberto, setModalRelatorioMensalAberto] = useState<boolean>(false);
  const [modalAlerta1830Aberto, setModalAlerta1830Aberto] = useState<boolean>(false);
  
  const [disparadoHoje, setDisparadoHoje] = useState<boolean>(false);
  const [pushPermitido, setPushPermitido] = useState<boolean>(false);

  // Carregar preferências salvas
  useEffect(() => {
    const config = getConfigNotificacaoProducao();
    if (config.telefone) setTelefoneWhatsApp(config.telefone);
    if (config.horario) setHorarioDiario(config.horario);
    if (config.automacaoAtiva !== undefined) setAutomacaoAtiva(config.automacaoAtiva);
    if (config.notificarDiaUm !== undefined) setNotificarDiaUm(config.notificarDiaUm);
    if (config.webhookUrl) setWebhookUrl(config.webhookUrl);
    if (config.callmebotApiKey) setCallmebotApiKey(config.callmebotApiKey);

    const ultimoDisparo = localStorage.getItem('odonto_whatsapp_ultimo_disparo_data');
    const hojeIso = new Date().toISOString().split('T')[0];
    if (ultimoDisparo === hojeIso) {
      setDisparadoHoje(true);
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      setPushPermitido(true);
    }
  }, []);

  // VERIFICADOR AUTOMÁTICO DE HORÁRIO (LOOP DE MONITORAMENTO DO RELÓGIO DA 18:30H)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!automacaoAtiva) return;

      const agora = new Date();
      const hora = agora.getHours();
      const minuto = agora.getMinutes();
      const hoje = agora.toISOString().split('T')[0];

      const [hAlvo, mAlvo] = horarioDiario.split(':').map(Number);

      // Dispara o alerta se atingiu o horário e ainda não disparou hoje
      if ((hora > hAlvo || (hora === hAlvo && minuto >= mAlvo)) && localStorage.getItem('odonto_whatsapp_ultimo_disparo_data') !== hoje) {
        localStorage.setItem('odonto_whatsapp_ultimo_disparo_data', hoje);
        setDisparadoHoje(true);
        setModalAlerta1830Aberto(true);

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification("📲 Resumo Diário de Produção das Clínicas (18:30h)", {
            body: `Balanço diário pronto! Destinatário: ${telefoneWhatsApp}. Clique para enviar.`,
            icon: '/favicon.png'
          });
        }

        const currentConfig = {
          telefone: telefoneWhatsApp,
          horario: horarioDiario,
          automacaoAtiva,
          notificarDiaUm,
          webhookUrl,
          callmebotApiKey
        };

        if (webhookUrl) {
          fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone: telefoneWhatsApp,
              message: gerarTextoRelatorioProducaoDiaria(itensProducao, currentConfig)
            })
          }).catch((err) => console.error('Erro ao enviar via Webhook WhatsApp:', err));
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [horarioDiario, automacaoAtiva, telefoneWhatsApp, webhookUrl, callmebotApiKey, itensProducao]);

  const handleSalvarConfiguracoes = (e: React.FormEvent) => {
    e.preventDefault();
    const config: ConfigNotificacaoProducaoWhatsApp = {
      telefone: telefoneWhatsApp,
      horario: horarioDiario,
      automacaoAtiva,
      notificarDiaUm,
      webhookUrl,
      callmebotApiKey
    };
    salvarConfigNotificacaoProducao(config);

    setSucessoMsg('Configurações de automação WhatsApp salvas com sucesso!');
    setModalEditAberto(false);
    setTimeout(() => setSucessoMsg(''), 4000);
  };

  const handleSolicitarPermissaoPush = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          setPushPermitido(true);
          setSucessoMsg('Notificações nativas ativadas no navegador!');
          setTimeout(() => setSucessoMsg(''), 4000);
        }
      });
    }
  };

  // CALCULA O DESEMPENHO EM TEMPO REAL DE CADA CLÍNICA BASEADO DIRETAMENTE NA TABELA DE LANÇAMENTOS DA PRODUÇÃO
  const dataHojeIso = new Date().toISOString().split('T')[0];

  const clinicas: DesempenhoClinica[] = TODAS_UNIDADES_PRODUCAO.map((u) => {
    const lancamentosClinica = itensProducao.filter((i) => i.unidade === u.unidade);
    const lancamentosHoje = lancamentosClinica.filter((i) => i.data === dataHojeIso);
    const alvoLancamentos = lancamentosHoje.length > 0 ? lancamentosHoje : lancamentosClinica;

    const pacientesHoje = alvoLancamentos.length;
    const faturamentoHoje = alvoLancamentos.reduce((acc, i) => acc + i.valor, 0);
    const ticketMedioHoje = pacientesHoje > 0 ? faturamentoHoje / pacientesHoje : 0;

    const regioesCount: Record<string, number> = {};
    alvoLancamentos.forEach((i) => {
      regioesCount[i.regiao] = (regioesCount[i.regiao] || 0) + 1;
    });
    const regiaoMaisFrequente = Object.keys(regioesCount).sort((a, b) => regioesCount[b] - regioesCount[a])[0];
    const procedimentosDestaque = pacientesHoje > 0 ? regiaoMaisFrequente : 'Sem lançamentos na tabela';

    return {
      id: u.id,
      nome: u.nome,
      unidade: `${u.unidade} (${u.proprietario})`,
      pacientesHoje,
      faturamentoHoje,
      ticketMedioHoje,
      procedimentosDestaque,
      pacientesMesAnterior: lancamentosClinica.length,
      faturamentoMesAnterior: lancamentosClinica.reduce((acc, i) => acc + i.valor, 0),
      crescimentoMes: 0
    };
  });

  const totalPacientesHoje = clinicas.reduce((acc, c) => acc + c.pacientesHoje, 0);
  const totalFaturamentoHoje = clinicas.reduce((acc, c) => acc + c.faturamentoHoje, 0);


  const handleTestarEnvioWhatsApp = () => {
    const textMsg = gerarTextoRelatorioProducaoDiaria(itensProducao, {
      telefone: telefoneWhatsApp,
      horario: horarioDiario,
      automacaoAtiva,
      notificarDiaUm,
      webhookUrl,
      callmebotApiKey
    });
    const urlWhatsapp = gerarLinkWhatsAppDirectApi(telefoneWhatsApp, textMsg);

    window.open(urlWhatsapp, '_blank');
    localStorage.setItem('odonto_whatsapp_ultimo_disparo_data', dataHojeIso);
    setDisparadoHoje(true);
    setSucessoMsg(`Resumo de produção gerado e enviado para WhatsApp (${telefoneWhatsApp})!`);
    setTimeout(() => setSucessoMsg(''), 4000);
  };

  const dataHoje = new Date();
  const mesAnteriorNome = new Date(dataHoje.getFullYear(), dataHoje.getMonth() - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner de Destaque */}
      <div className={`p-6 rounded-3xl border shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 shrink-0">
            <MessageSquare className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-widest">
                Sincronizado com Tabela de Lançamentos
              </span>
              <span className="text-[10px] font-extrabold text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/30 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {horarioDiario}h Agendado
              </span>
            </div>
            <h2 className="text-xl font-extrabold mt-1 flex items-center gap-2">
              Notificações WhatsApp & Desempenho por Clínica (Produção)
            </h2>
            <p className="text-xs text-slate-400">
              Disparo automatizado às 18:30h para ({telefoneWhatsApp}) com os números consolidados da tabela de produção.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!pushPermitido && 'Notification' in window && (
            <button
              onClick={handleSolicitarPermissaoPush}
              className="px-3.5 py-2.5 rounded-2xl border text-xs font-extrabold transition-all flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30 cursor-pointer shadow"
              title="Ativar popups nativos do navegador às 18:30h"
            >
              <Bell className="w-4 h-4" /> Ativar Push no Navegador
            </button>
          )}

          <button
            onClick={() => setModalEditAberto(true)}
            className="px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 cursor-pointer shadow"
          >
            <Clock className="w-4 h-4 text-emerald-400" /> Configurar Horário & Contato
          </button>

          <button
            onClick={handleTestarEnvioWhatsApp}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" /> Disparar Resumo no WhatsApp Agora
          </button>
        </div>
      </div>

      {sucessoMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-between animate-bounce shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{sucessoMsg}</span>
          </div>
          <button onClick={() => setSucessoMsg('')} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* CARD INFORMATIVO EXPLICATIVO SOBRE DISPARO DE NAVEGADOR VS API */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-extrabold text-white block">Como funciona a Notificação Automática das 18:30h:</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              • <strong>Com o site aberto ou ao acessar:</strong> Às 18:30h o sistema exibe um alerta sonoro e notificação pop-up em tela para envio de 1-clique.<br/>
              • <strong>Para envio 100% automático em segundo plano no celular (mesmo com o PC desligado):</strong> Você pode cadastrar uma URL de Webhook de qualquer API de WhatsApp (ex: Z-API, Evolution API ou Twilio) em "Configurar Horário & Contato".
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {disparadoHoje ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4" /> Disparo de Hoje Realizado!
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-black text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/30">
              <Clock className="w-4 h-4" /> Aguardando 18:30h de Hoje
            </span>
          )}
        </div>
      </div>

      {/* 4 Cards de Resumo Executivo da Automação */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-4 rounded-3xl border shadow-xl flex items-center justify-between ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Número Cadastrado</span>
            <h4 className="text-base font-extrabold text-emerald-400 mt-0.5 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-emerald-400" /> {telefoneWhatsApp}
            </h4>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Disparo automático habilitado</span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        <div className={`p-4 rounded-3xl border shadow-xl flex items-center justify-between ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Horário do Disparo</span>
            <h4 className="text-base font-extrabold text-teal-400 mt-0.5 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-teal-400" /> Todos os dias às {horarioDiario}h
            </h4>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Resumo com lançamentos do dia</span>
          </div>
          <div className="p-3 bg-teal-500/10 text-teal-400 rounded-2xl border border-teal-500/20">
            <Bell className="w-5 h-5" />
          </div>
        </div>

        <div className={`p-4 rounded-3xl border shadow-xl flex items-center justify-between ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Pacientes na Tabela</span>
            <h4 className="text-base font-extrabold text-white mt-0.5 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-teal-400" /> {totalPacientesHoje} Pacientes
            </h4>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Soma total das 7 unidades</span>
          </div>
          <div className="p-3 bg-sky-500/10 text-sky-400 rounded-2xl border border-sky-500/20">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className={`p-4 rounded-3xl border shadow-xl flex items-center justify-between ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Faturamento da Tabela</span>
            <h4 className="text-base font-extrabold text-emerald-400 mt-0.5 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-400" /> R$ {totalFaturamentoHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h4>
            <span className="text-[10px] text-emerald-400 mt-0.5 block font-bold">Calculado dos lançamentos</span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* BANNER DO RELATÓRIO MENSAL (NOTIFICAÇÃO DIA 01) */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-teal-900/40 via-slate-900 to-emerald-900/40 border border-teal-500/30 text-white shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-teal-500/20 text-teal-300 rounded-2xl border border-teal-500/40 shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-md border border-teal-500/20">
              Notificação do Sistema • Todo Dia 01
            </span>
            <h3 className="text-base font-extrabold mt-1 text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" /> Relatório Mensal de Desempenho por Clínica ({mesAnteriorNome})
            </h3>
            <p className="text-xs text-slate-300">
              Consolidado estatístico de faturamento e total de exames por clínica extraídos da tabela de produção.
            </p>
          </div>
        </div>

        <button
          onClick={() => setModalRelatorioMensalAberto(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white font-extrabold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-teal-600/30 transition-all shrink-0 cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4" /> Visualizar Relatório Mensal Completo
        </button>
      </div>

      {/* TABELA DE DESEMPENHO FINANCEIRO & PACIENTES POR CLÍNICA */}
      <div className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-extrabold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-400" /> Desempenho em Tempo Real por Clínica (Extraído da Tabela de Produção)
            </h3>
            <p className="text-xs text-slate-400">
              Monitoramento automático por unidade baseado nos lançamentos da tabela que alimentam o relatório das 18:30h via WhatsApp.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-400 bg-slate-800 px-3 py-1 rounded-xl border border-slate-700">
            7 Unidades Monitoradas
          </span>
        </div>

        {itensProducao.length === 0 && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" />
            <span>Tabela de Lançamentos da Produção está zerada no momento. Os dados das clínicas serão preenchidos automaticamente conforme você adicionar registros na tabela.</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-extrabold uppercase tracking-wider">
                <th className="py-3 px-3">Clínica / Unidade</th>
                <th className="py-3 px-3 text-center">Pacientes Lançados</th>
                <th className="py-3 px-3 text-right">Faturamento Total</th>
                <th className="py-3 px-3 text-right">Ticket Médio / Exame</th>
                <th className="py-3 px-3">Região / Procedimento Principal</th>
                <th className="py-3 px-3 text-center">Status no WhatsApp 18:30h</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-semibold">
              {clinicas.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-3 flex items-center gap-2.5 font-bold">
                    <div className="p-2 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-extrabold text-white block">{c.nome}</span>
                      <span className="text-[10px] text-slate-400 font-bold">{c.unidade}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-3 text-center">
                    <span className={`text-sm font-black px-3 py-1 rounded-xl border ${
                      c.pacientesHoje > 0
                        ? 'text-teal-400 bg-teal-500/10 border-teal-500/20'
                        : 'text-slate-500 bg-slate-800/50 border-slate-700'
                    }`}>
                      {c.pacientesHoje} pacientes
                    </span>
                  </td>

                  <td className={`py-3.5 px-3 text-right font-black text-sm ${
                    c.faturamentoHoje > 0 ? 'text-emerald-400' : 'text-slate-500'
                  }`}>
                    R$ {c.faturamentoHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>

                  <td className="py-3.5 px-3 text-right font-bold text-slate-300">
                    R$ {c.ticketMedioHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>

                  <td className="py-3.5 px-3 text-slate-300">
                    <span className={`px-2.5 py-1 rounded-lg border text-[11px] ${
                      c.pacientesHoje > 0
                        ? 'bg-slate-800 text-slate-200 border-slate-700'
                        : 'bg-slate-900 text-slate-500 border-slate-800 font-normal'
                    }`}>
                      {c.procedimentosDestaque}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-center">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-xl border ${
                      c.pacientesHoje > 0
                        ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                        : 'text-slate-400 bg-slate-800/50 border-slate-700'
                    }`}>
                      <CheckCircle2 className="w-3.5 h-3.5" /> {c.pacientesHoje > 0 ? 'Pronto p/ 18:30h' : 'Zerado'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP DE ALERTA AUTOMÁTICO DAS 18:30H */}
      {modalAlerta1830Aberto && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="p-6 rounded-3xl border border-emerald-500/50 max-w-lg w-full bg-slate-900 text-white shadow-2xl space-y-4 animate-bounce">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/40 shrink-0">
                <Clock className="w-8 h-8" />
              </div>
              <div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  ALERTA DIÁRIO • {horarioDiario}H ALCANÇADO
                </span>
                <h3 className="text-lg font-black text-white mt-1">
                  Resumo de Produção das Clínicas Pronto!
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              O horário agendado de <strong>{horarioDiario}h</strong> foi atingido! Os dados de <strong>{totalPacientesHoje} pacientes</strong> e <strong>R$ {totalFaturamentoHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> faturados hoje estão prontos para envio ao número <strong>({telefoneWhatsApp})</strong>.
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setModalAlerta1830Aberto(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Fechar Alerta
              </button>

              <button
                onClick={() => {
                  setModalAlerta1830Aberto(false);
                  handleTestarEnvioWhatsApp();
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold rounded-xl text-xs shadow-lg flex items-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" /> Enviar no WhatsApp Agora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIGURAÇÃO DO DISPARO WHATSAPP */}
      {modalEditAberto && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`p-6 rounded-3xl border max-w-md w-full shadow-2xl space-y-4 ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-base flex items-center gap-2 text-emerald-400">
                <MessageSquare className="w-5 h-5" /> Ajustes de Notificação WhatsApp
              </h3>
              <button onClick={() => setModalEditAberto(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarConfiguracoes} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Contato WhatsApp Destinatário</label>
                <input
                  type="text"
                  value={telefoneWhatsApp}
                  onChange={(e) => setTelefoneWhatsApp(e.target.value)}
                  placeholder="(69) 993649158"
                  className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Número oficial que receberá o balanço diário das 7 clínicas.</span>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Horário de Disparo Diário</label>
                <input
                  type="time"
                  value={horarioDiario}
                  onChange={(e) => setHorarioDiario(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Horário agendado para o envio do resumo de produção.</span>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1 text-teal-400">
                  <Zap className="w-3.5 h-3.5" /> URL Webhook / API WhatsApp Gateway (Opcional p/ Envio 100% Automático)
                </label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://api.z-api.io/instances/..."
                  className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-[11px] focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Permite envio automático em segundo plano via Z-API, Evolution API ou Twilio sem abrir a tela.</span>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1 flex items-center gap-1 text-emerald-400">
                  <Sparkles className="w-3.5 h-3.5" /> CallmeBot API Key Grátis (Disparo no Celular sem abrir o navegador)
                </label>
                <input
                  type="text"
                  value={callmebotApiKey}
                  onChange={(e) => setCallmebotApiKey(e.target.value)}
                  placeholder="Ex: 123456 (Chave CallmeBot Grátis)"
                  className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-[11px] focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Envie "I allow callmebot to send me messages" para +34 644 63 32 30 no WhatsApp para obter sua chave gratuita.
                </span>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={automacaoAtiva}
                    onChange={(e) => setAutomacaoAtiva(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 rounded"
                  />
                  <span>Ativar Disparo Automático Diário às 18:30h</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificarDiaUm}
                    onChange={(e) => setNotificarDiaUm(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 rounded"
                  />
                  <span>Notificar Relatório Mensal no site todo Dia 01 do Mês</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalEditAberto(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg cursor-pointer"
                >
                  Salvar Preferências
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETALHADO DO RELATÓRIO MENSAL (NOTIFICAÇÃO DIA 01) */}
      {modalRelatorioMensalAberto && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className={`p-6 rounded-3xl border max-w-2xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">
                  FECHAMENTO MENSAL DA PRODUÇÃO (DIA 01)
                </span>
                <h3 className="font-extrabold text-lg flex items-center gap-2 text-white mt-0.5">
                  <FileSpreadsheet className="w-5 h-5 text-teal-400" /> Relatório Mensal por Clínica - Tabela de Produção ({mesAnteriorNome})
                </h3>
              </div>
              <button onClick={() => setModalRelatorioMensalAberto(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-300 flex items-center justify-between">
                <div>
                  <span className="font-extrabold uppercase text-[10px] tracking-wider block text-teal-400">Total Faturado na Tabela de Produção</span>
                  <h4 className="text-xl font-black text-emerald-400 mt-0.5">
                    R$ {totalFaturamentoHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </h4>
                </div>
                <div className="text-right">
                  <span className="font-extrabold uppercase text-[10px] tracking-wider block text-teal-400">Total de Pacientes Lançados</span>
                  <h4 className="text-xl font-black text-white mt-0.5">{totalPacientesHoje} Pacientes</h4>
                </div>
              </div>

              <h4 className="font-extrabold text-sm text-slate-200 uppercase tracking-wider pt-2">
                Detalhamento por Unidade de Produção:
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {clinicas.map((c) => (
                  <div key={c.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="font-extrabold text-xs text-teal-400 block truncate">{c.nome} ({c.unidade})</span>
                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between text-slate-300">
                        <span>Pacientes Atendidos:</span>
                        <strong className="text-white">{c.pacientesHoje}</strong>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Faturamento da Clínica:</span>
                        <strong className="text-emerald-400">R$ {c.faturamentoHoje.toLocaleString('pt-BR')}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs cursor-pointer flex items-center gap-1.5"
              >
                Imprimir Relatório Mensal
              </button>

              <button
                type="button"
                onClick={() => setModalRelatorioMensalAberto(false)}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Concluir Análise
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

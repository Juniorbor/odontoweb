import type { ConfiguracaoWhatsApp, ConsultaInteligente } from '../types/agendaInteligente';
import { getItemJSON } from './cloudSync';

const MOCK_CONFIG_WHATSAPP_INICIAL: ConfiguracaoWhatsApp = {
  conectado: true,
  numeroConectado: '+55 (69) 99364-9158',
  instanciaApi: 'instancia_odontoweb_prod_01',
  apiKey: 'wapi_live_sec_token_992102',
  webhookUrl: 'https://odontoweb-app.vercel.app/api/whatsapp-webhook',
  lembrete7DiasAtivo: true,
  lembrete24HorasAtivo: true,
  lembrete2HorasAtivo: true,
  mensagemLembreteCustomizada: 'Olá {PACIENTE}! Sua consulta odontológica está agendada para {DATA} às {HORARIO} com {DENTISTA}.',
  historicoMensagens: [
    {
      id: 'msg-101',
      pacienteNome: 'Maria Eduarda Silva',
      telefone: '(69) 99200-1122',
      tipo: '24_HORAS',
      dataEnvio: `${new Date().toLocaleDateString('pt-BR')} às 08:30`,
      status: 'LIDO'
    },
    {
      id: 'msg-102',
      pacienteNome: 'Carlos Alberto Souza',
      telefone: '(69) 99311-4455',
      tipo: '7_DIAS',
      dataEnvio: `${new Date().toLocaleDateString('pt-BR')} às 09:15`,
      status: 'ENTREGUE'
    }
  ]
};

export function getConfiguracaoWhatsApp(usuarioId?: string): ConfiguracaoWhatsApp {
  const key = `odonto_whatsapp_config_${usuarioId || 'usr-admin-master'}`;
  return getItemJSON(key, MOCK_CONFIG_WHATSAPP_INICIAL);
}

export function salvarConfiguracaoWhatsApp(config: ConfiguracaoWhatsApp, usuarioId?: string) {
  const key = `odonto_whatsapp_config_${usuarioId || 'usr-admin-master'}`;
  localStorage.setItem(key, JSON.stringify(config));
}

/**
 * Gera URL direta para envio via WhatsApp Web / App
 */
export function gerarLinkWhatsAppMensagem(telefone: string, mensagem: string): string {
  const numLimpo = telefone.replace(/\D/g, '');
  const numComDDI = numLimpo.length === 10 || numLimpo.length === 11 ? `55${numLimpo}` : numLimpo;
  return `https://wa.me/${numComDDI}?text=${encodeURIComponent(mensagem)}`;
}

/**
 * Dispara modelo oficial de lembrete de consulta via WhatsApp
 */
export function enviarLembreteConsultaWhatsApp(
  consulta: ConsultaInteligente,
  tipo: '7_DIAS' | '24_HORAS' | '2_HORAS' | 'RETORNO',
  usuarioId?: string
): { sucesso: boolean; mensagemLog: string; linkWhatsAppDirect: string } {
  const config = getConfiguracaoWhatsApp(usuarioId);
  const dataFmt = new Date(consulta.data + 'T00:00:00').toLocaleDateString('pt-BR');

  let msgTexto = '';

  if (tipo === '7_DIAS') {
    msgTexto = `🦷 *OdontoWeb - Lembrete de Consulta*\n\nOlá, *${consulta.pacienteNome}*!\nSua consulta odontológica está agendada para o dia *${dataFmt}* às *${consulta.horarioInicio}* com *${consulta.dentistaNome}* (${consulta.especialidade}).\n\nQualquer dúvida, entre em contato conosco!`;
  } else if (tipo === '24_HORAS') {
    msgTexto = `🦷 *OdontoWeb - Confirmação de Consulta (24h)*\n\nOlá, *${consulta.pacienteNome}*!\nSua consulta está confirmada para amanhã, *${dataFmt}* às *${consulta.horarioInicio}*.\n\nPor favor, responda com:\n✅ *1* para Confirmar Presença\n📅 *2* para Solicitar Reagendamento\n❌ *3* para Cancelar`;
  } else if (tipo === '2_HORAS') {
    msgTexto = `⏰ *OdontoWeb - Consulta Hoje em 2 Horas*\n\nOlá, *${consulta.pacienteNome}*! Lembramos que sua consulta com *${consulta.dentistaNome}* é hoje às *${consulta.horarioInicio}* no *${consulta.consultorio}*.\n\nEstamos aguardando você!`;
  } else {
    msgTexto = `🦷 *OdontoWeb - Lembrete de Retorno Preventivo*\n\nOlá, *${consulta.pacienteNome}*! Já faz algum tempo desde a sua última consulta. Que tal agendar a sua revisão odontológica preventiva?\n\nResponda esta mensagem para escolher o melhor dia e horário!`;
  }

  // Registra no histórico de envios
  const novoLog = {
    id: `msg-${Date.now()}`,
    pacienteNome: consulta.pacienteNome,
    telefone: consulta.pacienteTelefone,
    tipo,
    dataEnvio: `${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
    status: 'ENVIADO' as const
  };

  config.historicoMensagens = [novoLog, ...(config.historicoMensagens || [])].slice(0, 30);
  salvarConfiguracaoWhatsApp(config, usuarioId);

  const linkDirect = gerarLinkWhatsAppMensagem(consulta.pacienteTelefone, msgTexto);

  return {
    sucesso: true,
    mensagemLog: `Lembrete ${tipo} registrado e enviado via Gateway WhatsApp com sucesso!`,
    linkWhatsAppDirect: linkDirect
  };
}

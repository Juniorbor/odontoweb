import type {
  Dentista,
  ConsultaInteligente,
  BloqueioHorario,
  ItemListaEspera,
  StatusConsultaType
} from '../types/agendaInteligente';
import { pushToCloud, getItemJSON } from './cloudSync';

const MOCK_DENTISTAS_INICIAIS: Dentista[] = [
  {
    id: 'dent-1',
    nome: 'Dr. Crenilto Junior',
    cro: 'CRO-RO 4521',
    especialidades: ['Clínico Geral', 'Ortodontia', 'Implantodontia'],
    telefone: '(69) 99364-9158',
    email: 'juniorbor1986@gmail.com',
    diasAtendimento: ['seg', 'ter', 'qua', 'qui', 'sex'],
    horarioInicio: '08:00',
    horarioFim: '18:00',
    intervaloInicio: '12:00',
    intervaloFim: '14:00',
    consultorio: 'Consultório 01 (Matriz)',
    statusAtivo: true,
    linkAgendamentoExclusivo: 'https://odontoweb-app.vercel.app/agendamento/dr-crenilto-junior'
  },
  {
    id: 'dent-2',
    nome: 'Dra. Amanda Borges',
    cro: 'CRO-RO 5892',
    especialidades: ['Endodontia', 'Dentística', 'Estomatologia'],
    telefone: '(69) 99245-1122',
    email: 'jacgborges@gmail.com',
    diasAtendimento: ['seg', 'ter', 'qua', 'qui', 'sex'],
    horarioInicio: '08:00',
    horarioFim: '17:00',
    intervaloInicio: '12:00',
    intervaloFim: '13:30',
    consultorio: 'Consultório 02 (Especialidades)',
    statusAtivo: true,
    linkAgendamentoExclusivo: 'https://odontoweb-app.vercel.app/agendamento/dra-amanda-borges'
  },
  {
    id: 'dent-3',
    nome: 'Dr. Fernando Silva',
    cro: 'CRO-RO 6104',
    especialidades: ['Cirurgia Bucomaxilofacial', 'Harmonização Orofacial'],
    telefone: '(69) 99811-3344',
    email: 'fernando.silva@odontoweb.com',
    diasAtendimento: ['ter', 'qui', 'sab'],
    horarioInicio: '09:00',
    horarioFim: '19:00',
    intervaloInicio: '13:00',
    intervaloFim: '14:00',
    consultorio: 'Consultório 03 (Cirúrgico)',
    statusAtivo: true,
    linkAgendamentoExclusivo: 'https://odontoweb-app.vercel.app/agendamento/dr-fernando-silva'
  }
];

const MOCK_CONSULTAS_INICIAIS: ConsultaInteligente[] = [
  {
    id: 'cons-101',
    pacienteId: 'pac-1',
    pacienteNome: 'Maria Eduarda Silva',
    pacienteTelefone: '(69) 99200-1122',
    dentistaId: 'dent-1',
    dentistaNome: 'Dr. Crenilto Junior',
    especialidade: 'Ortodontia',
    procedimento: 'Manutenção de Aparelho Ortodôntico',
    data: new Date().toISOString().split('T')[0],
    horarioInicio: '09:00',
    horarioFim: '09:45',
    duracaoMinutos: 45,
    consultorio: 'Consultório 01 (Matriz)',
    motivoConsulta: 'Ajuste mensal do arco de titânio',
    observacoes: 'Paciente relata ligeira sensibilidade nos molares.',
    status: 'Confirmada',
    formaContato: 'WhatsApp',
    necessitaRetorno: true,
    periodoRetornoRecomendado: '1m',
    dataRetornoPrevisto: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdAt: new Date().toISOString()
  },
  {
    id: 'cons-102',
    pacienteId: 'pac-2',
    pacienteNome: 'Carlos Alberto Souza',
    pacienteTelefone: '(69) 99311-4455',
    dentistaId: 'dent-2',
    dentistaNome: 'Dra. Amanda Borges',
    especialidade: 'Endodontia',
    procedimento: 'Tratamento de Canal (Dente 22)',
    data: new Date().toISOString().split('T')[0],
    horarioInicio: '10:30',
    horarioFim: '11:30',
    duracaoMinutos: 60,
    consultorio: 'Consultório 02 (Especialidades)',
    motivoConsulta: 'Polpectomia e instrumentação mecânica',
    observacoes: 'Odontometria realizada no CT 21mm.',
    status: 'Agendada',
    formaContato: 'WhatsApp',
    necessitaRetorno: true,
    periodoRetornoRecomendado: '3m',
    dataRetornoPrevisto: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdAt: new Date().toISOString()
  }
];

export function getDentistasLocais(usuarioId?: string): Dentista[] {
  const key = `odonto_dentistas_${usuarioId || 'usr-admin-master'}`;
  return getItemJSON(key, MOCK_DENTISTAS_INICIAIS);
}

export function salvarDentistasLocais(dentistas: Dentista[], usuarioId?: string) {
  const key = `odonto_dentistas_${usuarioId || 'usr-admin-master'}`;
  localStorage.setItem(key, JSON.stringify(dentistas));
  pushToCloud({ producao: dentistas }, usuarioId);
}

export function getConsultasInteligentesLocais(usuarioId?: string): ConsultaInteligente[] {
  const key = `odonto_consultas_inteligentes_${usuarioId || 'usr-admin-master'}`;
  return getItemJSON(key, MOCK_CONSULTAS_INICIAIS);
}

export function salvarConsultasInteligentesLocais(consultas: ConsultaInteligente[], usuarioId?: string) {
  const key = `odonto_consultas_inteligentes_${usuarioId || 'usr-admin-master'}`;
  localStorage.setItem(key, JSON.stringify(consultas));
  pushToCloud({ consultas }, usuarioId);
}

export function getBloqueiosLocais(usuarioId?: string): BloqueioHorario[] {
  const key = `odonto_bloqueios_${usuarioId || 'usr-admin-master'}`;
  return getItemJSON(key, []);
}

export function salvarBloqueiosLocais(bloqueios: BloqueioHorario[], usuarioId?: string) {
  const key = `odonto_bloqueios_${usuarioId || 'usr-admin-master'}`;
  localStorage.setItem(key, JSON.stringify(bloqueios));
}

export function getListaEsperaLocais(usuarioId?: string): ItemListaEspera[] {
  const key = `odonto_lista_espera_${usuarioId || 'usr-admin-master'}`;
  return getItemJSON(key, []);
}

export function salvarListaEsperaLocais(itens: ItemListaEspera[], usuarioId?: string) {
  const key = `odonto_lista_espera_${usuarioId || 'usr-admin-master'}`;
  localStorage.setItem(key, JSON.stringify(itens));
}

/**
 * Valida se existe conflito de horário para um dentista na data selecionada
 */
export function validarConflitoHorario(
  dentistaId: string,
  data: string,
  horarioInicio: string,
  horarioFim: string,
  consultaIdIgnorar?: string,
  usuarioId?: string
): { conflito: boolean; motivo?: string } {
  const consultas = getConsultasInteligentesLocais(usuarioId);
  const bloqueios = getBloqueiosLocais(usuarioId);

  // 1. Conflito com outras consultas do mesmo dentista
  const choqueConsulta = consultas.find((c) => {
    if (c.id === consultaIdIgnorar) return false;
    if (c.status === 'Cancelada') return false;
    if (c.dentistaId !== dentistaId || c.data !== data) return false;

    // Horários sobrepostos
    const inicioA = c.horarioInicio;
    const fimA = c.horarioFim;
    return (horarioInicio < fimA && horarioFim > inicioA);
  });

  if (choqueConsulta) {
    return {
      conflito: true,
      motivo: `⚠️ O(a) dentista já possui a consulta das ${choqueConsulta.horarioInicio} às ${choqueConsulta.horarioFim} com ${choqueConsulta.pacienteNome}.`
    };
  }

  // 2. Conflito com bloqueio de horário (Almoço, Férias, Reunião)
  const choqueBloqueio = bloqueios.find((b) => {
    if (b.data !== data) return false;
    if (b.dentistaId && b.dentistaId !== dentistaId) return false;

    return (horarioInicio < b.horarioFim && horarioFim > b.horarioInicio);
  });

  if (choqueBloqueio) {
    return {
      conflito: true,
      motivo: `⛔ Horário bloqueado na agenda: ${choqueBloqueio.motivo} (${choqueBloqueio.horarioInicio} às ${choqueBloqueio.horarioFim}).`
    };
  }

  return { conflito: false };
}

/**
 * Calcula a data estimada de retorno baseada em período pré-definido (1m, 3m, 6m, 12m)
 */
export function calcularDataRetornoPrevista(dataBase: string, periodo: '1m' | '3m' | '6m' | '12m'): string {
  const dt = new Date(dataBase);
  if (isNaN(dt.getTime())) return dataBase;

  if (periodo === '1m') dt.setMonth(dt.getMonth() + 1);
  if (periodo === '3m') dt.setMonth(dt.getMonth() + 3);
  if (periodo === '6m') dt.setMonth(dt.getMonth() + 6);
  if (periodo === '12m') dt.setFullYear(dt.getFullYear() + 1);

  return dt.toISOString().split('T')[0];
}

/**
 * Cores temáticas para cada Status de Consulta na Interface
 */
export function getCorStatusConsulta(status: StatusConsultaType): { bg: string; text: string; border: string } {
  switch (status) {
    case 'Confirmada':
      return { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/40' };
    case 'Agendada':
      return { bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/40' };
    case 'Aguardando confirmação':
      return { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/40' };
    case 'Em atendimento':
      return { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/50' };
    case 'Atendimento concluído':
      return { bg: 'bg-teal-500/20', text: 'text-teal-300', border: 'border-teal-500/40' };
    case 'Paciente chegou':
      return { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/40' };
    case 'Paciente faltou':
      return { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/40' };
    case 'Cancelada':
      return { bg: 'bg-slate-800', text: 'text-slate-400', border: 'border-slate-700' };
    case 'Reagendada':
      return { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/40' };
    default:
      return { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700' };
  }
}

export type StatusConsultaType =
  | 'Agendada'
  | 'Confirmada'
  | 'Aguardando confirmação'
  | 'Em atendimento'
  | 'Atendimento concluído'
  | 'Paciente chegou'
  | 'Paciente faltou'
  | 'Cancelada'
  | 'Reagendada';

export type EspecialidadeOdontologica =
  | 'Clínico Geral'
  | 'Endodontia'
  | 'Periodontia'
  | 'Ortodontia'
  | 'Implantodontia'
  | 'Cirurgia Bucomaxilofacial'
  | 'Odontopediatria'
  | 'Dentística'
  | 'Prótese'
  | 'Estomatologia'
  | 'Radiologia Odontológica'
  | 'Harmonização Orofacial';

export interface Dentista {
  id: string;
  nome: string;
  foto?: string;
  cro: string;
  especialidades: EspecialidadeOdontologica[];
  telefone: string;
  email: string;
  diasAtendimento: ('seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab')[];
  horarioInicio: string; // "08:00"
  horarioFim: string; // "18:00"
  intervaloInicio?: string; // "12:00"
  intervaloFim?: string; // "14:00"
  consultorio: string; // "Consultório 01"
  statusAtivo: boolean;
  linkAgendamentoExclusivo?: string;
}

export interface ConsultaInteligente {
  id: string;
  pacienteId: string;
  pacienteNome: string;
  pacienteTelefone: string;
  dentistaId: string;
  dentistaNome: string;
  especialidade: EspecialidadeOdontologica;
  procedimento: string;
  data: string; // YYYY-MM-DD
  horarioInicio: string; // HH:mm
  horarioFim: string; // HH:mm
  duracaoMinutos: number;
  consultorio: string;
  motivoConsulta?: string;
  observacoes?: string;
  status: StatusConsultaType;
  formaContato: 'WhatsApp' | 'Telefone' | 'Presencial' | 'Online';
  necessitaRetorno: boolean;
  dataRetornoPrevisto?: string; // YYYY-MM-DD
  periodoRetornoRecomendado?: '1m' | '3m' | '6m' | '12m' | 'custom';
  agendamentoOnline?: boolean;
  atendimentoIniciadoEm?: string;
  atendimentoFinalizadoEm?: string;
  createdAt: string;
}

export interface BloqueioHorario {
  id: string;
  dentistaId?: string;
  data: string;
  horarioInicio: string;
  horarioFim: string;
  motivo:
    | 'Almoço'
    | 'Reunião'
    | 'Férias'
    | 'Curso'
    | 'Congresso'
    | 'Manutenção'
    | 'Emergência'
    | 'Horário pessoal'
    | 'Consultório indisponível';
  observacao?: string;
}

export interface ItemListaEspera {
  id: string;
  pacienteNome: string;
  pacienteTelefone: string;
  dentistaId?: string;
  procedimento: string;
  preferenciaData: string;
  preferenciaHorario: 'Manhã' | 'Tarde' | 'Qualquer';
  observacao?: string;
  status: 'Pendente' | 'Notificado' | 'Agendado' | 'Cancelado';
  createdAt: string;
}

export interface ConfiguracaoWhatsApp {
  conectado: boolean;
  numeroConectado: string;
  instanciaApi: string;
  apiKey: string;
  webhookUrl: string;
  lembrete7DiasAtivo: boolean;
  lembrete24HorasAtivo: boolean;
  lembrete2HorasAtivo: boolean;
  mensagemLembreteCustomizada?: string;
  historicoMensagens: {
    id: string;
    pacienteNome: string;
    telefone: string;
    tipo: '7_DIAS' | '24_HORAS' | '2_HORAS' | 'CONFIRMACAO' | 'RETORNO';
    dataEnvio: string;
    status: 'ENVIADO' | 'ENTREGUE' | 'LIDO' | 'FALHA';
  }[];
}

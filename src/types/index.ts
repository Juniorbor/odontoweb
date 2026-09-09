export type StatusConsulta = 'Agendado' | 'Confirmado' | 'Em Atendimento' | 'Finalizado' | 'Cancelado';

export type StatusDente =
  | 'Saudável'
  | 'Cárie'
  | 'Restaurado'
  | 'Restauração Provisória'
  | 'Tratamento Canal'
  | 'Extração Indicada'
  | 'Ausente'
  | 'Implante'
  | 'Coroa'
  | 'Faceta'
  | 'Fratura'
  | 'Desgaste'
  | 'Mobilidade'
  | 'Reabsorção'
  | 'Lesão'
  | 'Tratamento Periodontal'
  | 'Selante'
  | 'Dente Impactado'
  | 'Outro';

export type StatusProcedimento = 'Planejado' | 'Em Andamento' | 'Concluído';
export type SuperficieDente = 'Oclusal' | 'Vestibular' | 'Lingual' | 'Palatina' | 'Mesial' | 'Distal' | 'Cervical' | 'Radicular';

export interface CondicaoSuperficie {
  superficie: SuperficieDente;
  condicao: StatusDente;
  observacao?: string;
  data: string;
}

export interface HistoricoDenteItem {
  id: string;
  data: string;
  profissional: string;
  descricao: string;
  tipo: 'Condição' | 'Procedimento' | 'Nota';
}

export interface Anotacao3D {
  id: string;
  tipo: 'ponto' | 'seta' | 'circulo' | 'texto';
  posicao: [number, number, number];
  texto: string;
  cor?: string;
}

export interface Paciente {
  id: string;
  nome: string;
  cpf: string;
  dataNascimento: string;
  telefone: string;
  email: string;
  convenio?: string;
  fotoUrl?: string;
  dataCadastro: string;
  alergias?: string[];
  observacoes?: string;
  profissao?: string;
  endereco?: string;
  responsavel?: string;
  ultimoconsulta?: string;
  proximaconsulta?: string;
}

export interface Consulta {
  id: string;
  pacienteId: string;
  pacienteNome: string;
  pacienteTelefone: string;
  dentistaNome: string;
  dataHora: string; // ISO String
  duracaoMinutos: number;
  procedimento: string;
  status: StatusConsulta;
  sala?: string;
  observacoes?: string;
}

export interface DenteInfo {
  numero: number; // 11-48 (Notação FDI)
  status: StatusDente;
  observacoes?: string;
  procedimentosRelacionados?: string[];
}

export interface AnamneseDetalhada {
  queixaPrincipal: string;
  historicoMedico: string;
  doencasSistemicas: string[];
  medicamentosUso: string[];
  alergias: string[];
  habitos: string[];
  historicoFamiliar: string;
  cirurgiasPrevias: string;
  sensibilidadeAnestesia: boolean;
  termoConsentimentoAceito: boolean;
  dataUltimaAtualizacao: string;
  // Campos Profissionais Odontológicos Adicionais
  intensidadeDor?: number; // 0 a 10
  fatoresAgravantes?: string[];
  pressaoArterialBase?: string;
  gestanteLactante?: string;
  usoBifosfonatos?: boolean;
  sangramentoExcessivo?: boolean;
  habitosParafuncionais?: string[];
  frequenciaHigieneBucal?: string;
  ultimoTratamentoOdontologico?: string;
  dentistaResponsavel?: string;
}

export interface RadiografiaExame {
  id: string;
  pacienteId: string;
  titulo: string;
  tipo: 'Panorâmica' | 'Periapical' | 'Interproximal' | 'Tomografia 3D';
  data: string;
  imagemUrl: string;
  anotacoes?: string;
  laudo?: string;
  formas?: any[];
  recortesLupa?: any[];
}

export interface FotografiaClinica {
  id: string;
  pacienteId?: string;
  categoria: 'Frontal' | 'Perfil' | 'Sorriso' | 'Intraoral' | 'Oclusal' | 'Antes/Depois';
  data: string;
  imagemUrl: string;
  imagemUrlAntes?: string; // Para comparacao Antes & Depois
  descricao: string;
  titulo?: string;
}

export interface HistoricoTimeline {
  id: string;
  pacienteId: string;
  dataHora: string;
  tipo: 'Consulta' | 'Procedimento' | 'Exame' | 'Anamnese' | 'Financeiro';
  titulo: string;
  descricao: string;
  profissional: string;
}

export interface MensagemIA {
  id: string;
  remetente: 'usuario' | 'ia';
  texto: string;
  dataHora: string;
  sugestaoPlano?: string;
  referenciaPacienteId?: string;
}

export interface ProcedimentoTratamento {
  id: string;
  pacienteId: string;
  denteNumero?: number;
  descricao: string;
  valor: number;
  status: StatusProcedimento;
  dataCriacao: string;
}

export interface ItemProducaoTomo {
  id: string;
  data: string;
  pacienteNome: string;
  regiao: 'TRAÇADO' | 'UM DENTE' | 'MAX OU MAND' | 'MAX E MAND';
  valor: number;
  unidade: 'Ariquemes' | 'Porto Velho' | 'Machadinho' | 'Cacoal' | 'Rolim de Moura' | 'Ouro Preto' | 'Ji-Paraná';
  proprietario: 'Fernando' | 'Bernardo';
  urgencia?: boolean;
}

export interface TransacaoFinanceira {
  id: string;
  descricao: string;
  tipo: 'Receita' | 'Despesa';
  valor: number;
  data: string;
  categoria: string;
  pacienteNome?: string;
  status: 'Pago' | 'Pendente';
}

export interface TransacaoPessoal {
  id: string;
  descricao: string;
  tipo: 'Entrada' | 'Despesa Fixa' | 'Despesa Variável';
  valor: number;
  data: string;
  categoria: string;
  status: 'Pago' | 'Pendente';
  parcelas?: string;
  observacao?: string;
}

export type ClassificacaoASA = 'ASA I' | 'ASA II' | 'ASA III' | 'ASA IV';

export interface ItemSistemico {
  id: string;
  categoria: 'cardiovascular' | 'endocrino' | 'renal_hepatico' | 'respiratorio' | 'outros';
  pergunta: string;
  detalhe?: string;
  riscoAssociado: ClassificacaoASA;
  alertaClinico?: string;
}

export interface FatorInteracaoMedicamentosa {
  farmacoContinuo: string;
  farmacoOdonto: string;
  gravidade: 'grave' | 'moderada' | 'leve';
  mecanismoERisco: string;
  recomendacaoClinica: string;
}

export interface SalAnestesico {
  id: string;
  nome: string;
  concentracaoPct: number;
  dmrMgKg: number;
  maximoAbsolutoMg: number;
  mgPorTubete: number; // 1.8 mL
  vasoconstritorPadrao: string;
  indicacoes: string;
  contraindicacoes: string;
}

export interface MedicamentoPrescricao {
  id: string;
  nome: string;
  classe: 'analgesico' | 'antiinflamatorio' | 'antibiotico' | 'corticosteroide';
  doseAdultoPadrao: string;
  dosePediatricaMgKg: number;
  frequenciaHoras: number;
  duracaoDias: number;
  posologiaTextoAdulto: string;
  posologiaTextoPediatrico: string;
  orientacoesPaciente: string;
  contraindicacoes: string;
}

export interface LesaoEstomatologia {
  id: string;
  nome: string;
  lesaoFundamental: 'mancha' | 'placa' | 'papula_nodulo' | 'vesicula_bolha' | 'ulcera';
  caracteristicasClinicas: string;
  localizacaoComum: string;
  faixaEtariaPredominante: string;
  diagnosticosDiferenciais: string[];
  condutaRecomendada: 'acompanhamento' | 'citologia' | 'biopsia_incisional' | 'biopsia_excisional' | 'encaminhamento_urgente';
  detalheConduta: string;
}

export interface ProtocoloCirurgia {
  dente: string;
  pellGregoryRamo: 'Classe I' | 'Classe II' | 'Classe III';
  pellGregoryProfundidade: 'Posicao A' | 'Posicao B' | 'Posicao C';
  winterAngulacao: 'Mesioangulado' | 'Distoangulado' | 'Vertical' | 'Horizontal' | 'Invertido';
  passoAPasso: string[];
  cuidadosPosOperatorios: string[];
}

export interface ProtocoloEndodontia {
  grupoDente: string;
  comprimentoAparenteDente: number;
  sequenciaIrrigacao: string[];
  protocoloObturacao: string;
  observacoesClinicas: string;
}

export interface ProtocoloDentistica {
  tipoRestauracao: string;
  sistemaAdesivoRecomendado: string;
  passoAPassoCondicionamento: string[];
  estratificacaoResina: string[];
}

export interface ProtocoloPeriodontia {
  codigoPSR: 0 | 1 | 2 | 3 | 4 | 'asterisco';
  descricaoPSR: string;
  condutaPSR: string;
  estadioPeriodontite: 'Estágio I' | 'Estágio II' | 'Estágio III' | 'Estágio IV';
  gradacaoPeriodontite: 'Grau A' | 'Grau B' | 'Grau C';
}

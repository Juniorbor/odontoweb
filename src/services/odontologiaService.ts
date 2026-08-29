import type {
  ClassificacaoASA,
  SalAnestesico,
  MedicamentoPrescricao,
  FatorInteracaoMedicamentosa,
  LesaoEstomatologia
} from '../types/odontologia';

// 1. Tabela de Sais Anestésicos Odontológicos (Valores Padrão Odontologia Clínica)
export const SAIS_ANESTESICOS: SalAnestesico[] = [
  {
    id: 'lido_2_epi_100',
    nome: 'Lidocaína 2% com Epinefrina 1:100.000',
    concentracaoPct: 2.0,
    dmrMgKg: 4.4,
    maximoAbsolutoMg: 300,
    mgPorTubete: 36, // 1.8 mL * 20 mg/mL = 36 mg
    vasoconstritorPadrao: 'Epinefrina 1:100.000 (0,018 mg/tubete)',
    indicacoes: 'Anestésico padrão ouro em odontologia para procedimentos de média duração.',
    contraindicacoes: 'Alergia a amidas ou sulfitos. Cardiopatas descompensados (limitar a 2 tubetes).'
  },
  {
    id: 'arti_4_epi_100',
    nome: 'Articaína 4% com Epinefrina 1:100.000',
    concentracaoPct: 4.0,
    dmrMgKg: 7.0,
    maximoAbsolutoMg: 500,
    mgPorTubete: 72, // 1.8 mL * 40 mg/mL = 72 mg
    vasoconstritorPadrao: 'Epinefrina 1:100.000 (0,018 mg/tubete)',
    indicacoes: 'Alta lipossolubilidade e difusão óssea. Excelente em bloqueios de mandíbula e endodontia.',
    contraindicacoes: 'Histórico de parestesia induzida por articaína em blocos mandibulares de 3ºs molares (preferir infiltrativa).'
  },
  {
    id: 'mepi_2_epi_100',
    nome: 'Mepivacaína 2% com Epinefrina 1:100.000',
    concentracaoPct: 2.0,
    dmrMgKg: 4.4,
    maximoAbsolutoMg: 300,
    mgPorTubete: 36,
    vasoconstritorPadrao: 'Epinefrina 1:100.000 (0,018 mg/tubete)',
    indicacoes: 'Procedimentos de média duração. Baixa vasodilatação própria em relação à lidocaína.',
    contraindicacoes: 'Pacientes com hipersensibilidade a amidas.'
  },
  {
    id: 'mepi_3_sem_vaso',
    nome: 'Mepivacaína 3% Sem Vasoconstritor',
    concentracaoPct: 3.0,
    dmrMgKg: 4.4,
    maximoAbsolutoMg: 300,
    mgPorTubete: 54, // 1.8 mL * 30 mg/mL = 54 mg
    vasoconstritorPadrao: 'Sem Vasoconstritor',
    indicacoes: 'Pacientes cardiopatas graves (ASA III/IV), gestantes ou hipertensos descompensados.',
    contraindicacoes: 'Procedimentos muito longos ou cirurgias hemorrágicas que exigem hemostasia local.'
  },
  {
    id: 'prilo_3_feli',
    nome: 'Prilocaína 3% com Felipressina 0,03 UI/mL',
    concentracaoPct: 3.0,
    dmrMgKg: 6.0,
    maximoAbsolutoMg: 400,
    mgPorTubete: 54, // 1.8 mL * 30 mg/mL = 54 mg
    vasoconstritorPadrao: 'Felipressina 0,03 UI/mL (Octapressin)',
    indicacoes: 'Alternativa segura para asmáticos, hipertensos descompensados ou diabéticos.',
    contraindicacoes: 'Contraindicado estritamente em GESTANTES (risco de contração uterina por efeito ocitócico da felipressina) e metemoglobinemia.'
  }
];

// 2. Base de Medicamentos para Prescrição Odontológica
export const MEDICAMENTOS_PRESCRICAO: MedicamentoPrescricao[] = [
  {
    id: 'dipirona',
    nome: 'Dipirona Sódica',
    classe: 'analgesico',
    doseAdultoPadrao: '500 mg a 1000 mg a cada 6 horas',
    dosePediatricaMgKg: 15, // mg/kg/dose
    frequenciaHoras: 6,
    duracaoDias: 3,
    posologiaTextoAdulto: 'Tomar 1 comprimido de 500 mg ou 1 g por via oral de 6 em 6 horas se houver dor.',
    posologiaTextoPediatrico: 'Tomar a quantidade de gotas calculada por peso de 6 em 6 horas se dor.',
    orientacoesPaciente: 'Não ingerir de estômago vazio. Suspender em caso de reações alérgicas ou rash cutâneo.',
    contraindicacoes: 'Alergia a pirazolonas, discrasias sanguíneas ou porfiria hepática.'
  },
  {
    id: 'paracetamol',
    nome: 'Paracetamol',
    classe: 'analgesico',
    doseAdultoPadrao: '500 mg a 750 mg a cada 6 horas',
    dosePediatricaMgKg: 12,
    frequenciaHoras: 6,
    duracaoDias: 3,
    posologiaTextoAdulto: 'Tomar 1 comprimido de 750 mg por via oral de 6 em 6 horas em caso de dor.',
    posologiaTextoPediatrico: 'Tomar solução oral conforme gota por kg calculada de 6 em 6 horas.',
    orientacoesPaciente: 'Não ultrapassar o limite diário de 4000 mg em adultos (risco de hepatotoxicidade).',
    contraindicacoes: 'Insuficiência hepática grave ou alcoolismo crônico.'
  },
  {
    id: 'ibuprofeno',
    nome: 'Ibuprofeno',
    classe: 'antiinflamatorio',
    doseAdultoPadrao: '400 mg a 600 mg a cada 6 horas',
    dosePediatricaMgKg: 10,
    frequenciaHoras: 6,
    duracaoDias: 3,
    posologiaTextoAdulto: 'Tomar 1 comprimido de 600 mg por via oral de 6 em 6 horas por 3 dias.',
    posologiaTextoPediatrico: 'Tomar a dose líquida proporcional ao peso de 6 em 6 horas por 3 dias.',
    orientacoesPaciente: 'Ingerir acompanhado de alimentos ou leite para minimizar irritação gástrica.',
    contraindicacoes: 'Úlcera péptica ativa, insuficiência renal grave, alérgicos a AINEs/Aspirina e 3º trimestre de gestação.'
  },
  {
    id: 'nimesulida',
    nome: 'Nimesulida',
    classe: 'antiinflamatorio',
    doseAdultoPadrao: '100 mg a cada 12 horas',
    dosePediatricaMgKg: 0, // Contraindicado < 12 anos
    frequenciaHoras: 12,
    duracaoDias: 3,
    posologiaTextoAdulto: 'Tomar 1 comprimido de 100 mg por via oral de 12 em 12 horas após as refeições por 3 dias.',
    posologiaTextoPediatrico: 'CONTRAINDICADO para crianças menores de 12 anos.',
    orientacoesPaciente: 'Usar por no máximo 3 a 5 dias devido ao risco de hepatotoxicidade.',
    contraindicacoes: 'Menores de 12 anos, disfunção hepática prévia, insuficiência renal ou sangramento gastrointestinal.'
  },
  {
    id: 'dexametasona',
    nome: 'Dexametasona (Pré-operatório)',
    classe: 'corticosteroide',
    doseAdultoPadrao: '4 mg a 8 mg em dose única 1h antes',
    dosePediatricaMgKg: 0.1,
    frequenciaHoras: 24,
    duracaoDias: 1,
    posologiaTextoAdulto: 'Tomar 1 comprimido de 4 mg ou 8 mg por via oral 1 hora antes do procedimento cirúrgico.',
    posologiaTextoPediatrico: 'Tomar dose única infantil calculada por kg 1 hora antes da cirurgia.',
    orientacoesPaciente: 'Reduz significativamente edema e trismo pós-operatório cirúrgico.',
    contraindicacoes: 'Infecções fúngicas sistêmicas não controladas e hipersensibilidade a corticoides.'
  },
  {
    id: 'amoxicilina',
    nome: 'Amoxicilina',
    classe: 'antibiotico',
    doseAdultoPadrao: '500 mg a cada 8 horas (ou 875 mg a cada 12h)',
    dosePediatricaMgKg: 50, // mg/kg/dia divididos em 3 doses
    frequenciaHoras: 8,
    duracaoDias: 7,
    posologiaTextoAdulto: 'Tomar 1 cápsula de 500 mg por via oral de 8 em 8 horas durante 7 dias corridos.',
    posologiaTextoPediatrico: 'Tomar a suspensão oral infantil calculada de 8 em 8 horas por 7 dias.',
    orientacoesPaciente: 'Não interromper o tratamento antes dos 7 dias mesmo se houver melhora total dos sintomas.',
    contraindicacoes: 'Hipersensibilidade conhecida a penicilinas ou cefalosporinas.'
  },
  {
    id: 'clindamicina',
    nome: 'Clindamicina (Alérgicos a Penicilina)',
    classe: 'antibiotico',
    doseAdultoPadrao: '300 mg a cada 6 horas',
    dosePediatricaMgKg: 20, // mg/kg/dia divididos em 4 doses
    frequenciaHoras: 6,
    duracaoDias: 7,
    posologiaTextoAdulto: 'Tomar 1 cápsula de 300 mg por via oral de 6 em 6 horas durante 7 dias.',
    posologiaTextoPediatrico: 'Tomar suspensão oral infantil de 6 em 6 horas por 7 dias.',
    orientacoesPaciente: 'Tomar com um copo cheio de água. Suspender caso surjam diarreias intensas (risco de colite pseudomembranosa).',
    contraindicacoes: 'Histórico de colite ulcerativa ou enterite regional.'
  },
  {
    id: 'azitromicina',
    nome: 'Azitromicina',
    classe: 'antibiotico',
    doseAdultoPadrao: '500 mg 1x ao dia',
    dosePediatricaMgKg: 10, // mg/kg/dia 1x dia
    frequenciaHoras: 24,
    duracaoDias: 3,
    posologiaTextoAdulto: 'Tomar 1 comprimido de 500 mg por via oral 1 vez ao dia por 3 dias seguidos.',
    posologiaTextoPediatrico: 'Tomar a suspensão oral infantil calculada 1 vez ao dia durante 3 dias.',
    orientacoesPaciente: 'Tomar pelo menos 1 hora antes ou 2 horas após as refeições.',
    contraindicacoes: 'Hipersensibilidade a macrolídeos ou disfunção hepática grave.'
  }
];

// 3. Interações Medicamentosas de Cruzamento Clínico
export const INTERACOES_MEDICAMENTOSAS: FatorInteracaoMedicamentosa[] = [
  {
    farmacoContinuo: 'Propranolol ou Beta-bloqueador Não-seletivo',
    farmacoOdonto: 'Epinefrina / Adrenalina (Vasoconstritor)',
    gravidade: 'grave',
    mecanismoERisco: 'O bloqueio dos receptores Beta-2 permite que a Epinefrina atue exclusivamente nos receptores Alfa-1, podendo causar vasoconstrição acentuada, aumento grave da pressão arterial e bradicardia reflexa.',
    recomendacaoClinica: 'Usar no máximo 2 tubetes anestésicos com epinefrina 1:100.000 ou optar por Mepivacaína 3% sem vasoconstritor ou Prilocaína com Felipressina.'
  },
  {
    farmacoContinuo: 'Varfarina ou Anticoagulantes Orais (Rivaroxabana/Dabigatrana)',
    farmacoOdonto: 'Anti-inflamatórios Não-Esteroidais (Ibuprofeno, Cetoprofeno, Nimesulida)',
    gravidade: 'grave',
    mecanismoERisco: 'Os AINEs inibem a agregação plaquetária e causam irritação na mucosa gástrica, potencializando drasticamente o risco de sangramento de mucosa e hemorragia pós-operatória.',
    recomendacaoClinica: 'Contraindicado AINEs. Prescrever Paracetamol ou Dipirona para dor. Em cirurgias, avaliar RNI (ideal < 3,0).'
  },
  {
    farmacoContinuo: 'Bifosfanatos (Alendronato, Risedronato, Zoledronato)',
    farmacoOdonto: 'Procedimentos Cirúrgicos Osseos / Exodontias',
    gravidade: 'grave',
    mecanismoERisco: 'Risco de Osteonecrose dos Maxilares Associada a Medicamentos (MRONJ) devido ao comprometimento da remodelação óssea.',
    recomendacaoClinica: 'Evitar cirurgias osseoflagelantes e exodontias eletivas. Dar preferência a tratamentos endodônticos e conservadores.'
  },
  {
    farmacoContinuo: 'Hipoglicemiantes Orais ou Insulina',
    farmacoOdonto: 'Procedimentos Clínicos Longos em Jejum',
    gravidade: 'moderada',
    mecanismoERisco: 'O estresse cirúrgico combinado com jejum prolongado pode desencadear choque hipoglicêmico na cadeira odontológica.',
    recomendacaoClinica: 'Agendar consultas curtas no período da manhã, logo após o paciente ter se alimentado e tomado a medicação habitual. Ter carboidratos líquidos na clínica.'
  }
];

// 4. Atlas de Estomatologia e Diagnósticos Diferenciais
export const ATLAS_ESTOMATOLOGIA: LesaoEstomatologia[] = [
  {
    id: 'leucoplasia',
    nome: 'Leucoplasia Oral',
    lesaoFundamental: 'placa',
    caracteristicasClinicas: 'Placa branca predominantemente assintomática que não pode ser removida por raspagem. Considerada desordem potencialmente maligna.',
    localizacaoComum: 'Borda lateral de língua, assoalho bucal e mucosa jugal.',
    faixaEtariaPredominante: 'Adultos > 40 anos, fumantes e etilistas.',
    diagnosticosDiferenciais: ['Candidíase Pseudomembranosa', 'Líquen Plano Reticular', 'Leucoedema'],
    condutaRecomendada: 'biopsia_incisional',
    detalheConduta: 'Remover fatores irritativos (tabaco/prótese) por 14 dias. Se persistir, realizar biópsia incisional obrigatória para exame histopatológico.'
  },
  {
    id: 'candidiase_pseudomembranosa',
    nome: 'Candidíase Pseudomembranosa (Sapo)',
    lesaoFundamental: 'placa',
    caracteristicasClinicas: 'Placas esbranquiçadas cremosas que destacam facilmente à raspagem com gaze, deixando superfície eritematosa subjacente.',
    localizacaoComum: 'Palato, língua e mucosa bucal.',
    faixaEtariaPredominante: 'Lactentes, idosos usuários de próteses, imunocomprometidos ou pós-uso de antibióticos.',
    diagnosticosDiferenciais: ['Leucoplasia', 'Líquen Plano', 'Resíduos alimentares'],
    condutaRecomendada: 'citologia',
    detalheConduta: 'Prescrever antifúngico tópico (Nistatina suspensão oral 100.000 UI/mL bochechar 4x/dia) e orientação de higiene de prótese.'
  },
  {
    id: 'fibroma_irritativo',
    nome: 'Fibroma de Irritação (Hiperplasia Fibrosa Focal)',
    lesaoFundamental: 'papula_nodulo',
    caracteristicasClinicas: 'Nódulo séssil ou pediculado, liso, de coloração semelhante à mucosa normal, de consistência firme à palpação.',
    localizacaoComum: 'Mucosa jugal ao longo da linha de oclusão, lábio inferior e bordo de língua.',
    faixaEtariaPredominante: 'Qualquer idade, associado a trauma de mordedura crônica.',
    diagnosticosDiferenciais: ['Granuloma Piogênico', 'Lipoma', 'Neurilemoma'],
    condutaRecomendada: 'biopsia_excisional',
    detalheConduta: 'Excisão cirúrgica completa da lesão juntamente com a remoção do agente traumático causador.'
  },
  {
    id: 'granuloma_piogenico',
    nome: 'Granuloma Piogênico',
    lesaoFundamental: 'papula_nodulo',
    caracteristicasClinicas: 'Nódulo eritematoso, de superfície ulcerada ou lobulada, altissimamente vascularizado que sangra fácil ao toque.',
    localizacaoComum: 'Gengiva marginal/inserida (75% dos casos). Comum em gestantes (tumor da gravidez).',
    faixaEtariaPredominante: 'Jovens e gestantes devido a alterações de progesterona/estrogênio.',
    diagnosticosDiferenciais: ['Lesão Periférica de Células Gigantes', 'Fibroma Ossificante Periférico', 'Hemangioma'],
    condutaRecomendada: 'biopsia_excisional',
    detalheConduta: 'Remoção de cálculo dental local e excisão cirúrgica. Em gestantes, aguardar pós-parto se não houver desconforto estético/funcional grave.'
  },
  {
    id: 'herpes_simples_labial',
    nome: 'Herpes Simples Recorrente Labial',
    lesaoFundamental: 'vesicula_bolha',
    caracteristicasClinicas: 'Agrupamento de pequenas vesículas sobre base eritematosa no semivermelhão do lábio, que rompem formando crostas castanhas.',
    localizacaoComum: 'Lábio inferior e comissura labial.',
    faixaEtariaPredominante: 'Jovens e adultos expostos ao sol, estresse ou imunossupressão.',
    diagnosticosDiferenciais: ['Estomatite Aftosa Recorrente', 'Queilite Angular', 'Impetigo'],
    condutaRecomendada: 'acompanhamento',
    detalheConduta: 'Prescrever Aciclovir creme 5% aplicar 5x/dia na fase prodrômica/vesicular. Evitar atendimento odontológico eletivo na fase vesicular ativa.'
  },
  {
    id: 'carcinoma_espinocelular',
    nome: 'Carcinoma Espinocelular (CEC)',
    lesaoFundamental: 'ulcera',
    caracteristicasClinicas: 'Úlcera indolor de bordas endurecidas, evertidas e fundo necrótico, persistente há mais de 14 dias sem causa traumática evidente.',
    localizacaoComum: 'Borda lateral/ventre de língua, assoalho bucal e lábio inferior.',
    faixaEtariaPredominante: 'Homens > 50 anos, fumantes e etilistas crônicos.',
    diagnosticosDiferenciais: ['Úlcera Traumática Crônica', 'Tuberculose Oral', 'Sífilis (Cancro duro)'],
    condutaRecomendada: 'encaminhamento_urgente',
    detalheConduta: 'Realizar biópsia incisional imediata na borda da lesão e encaminhar com urgência para Serviço de Cirurgia Head & Neck / Oncologia.'
  }
];

// 5. Cálculos Matemáticos e Farmacológicos
export function calcularDMRAnestesico(
  sal: SalAnestesico,
  pesoKg: number,
  classificacaoASA: ClassificacaoASA = 'ASA I'
): {
  dmrTotalMg: number;
  maxTubetesPeso: number;
  maxTubetesSeguroFinal: number;
  alertaClinico: string;
} {
  const pesoTratado = Math.max(1, Math.min(150, pesoKg));
  
  // Cálculo baseado no peso
  const dmrCalculada = pesoTratado * sal.dmrMgKg;
  
  // Teto máximo absoluto estabelecido pela literatura
  const dmrTotalMg = Math.min(dmrCalculada, sal.maximoAbsolutoMg);
  
  // Quantidade exata de tubetes pelo peso
  const maxTubetesPeso = Number((dmrTotalMg / sal.mgPorTubete).toFixed(1));
  
  let maxTubetesSeguroFinal = Math.floor(maxTubetesPeso);
  let alertaClinico = `Dose limite calculada em ${dmrTotalMg.toFixed(1)} mg para ${pesoTratado} kg.`;

  // Restrição em pacientes cardiopatas / ASA III / IV para vasoconstritor Epinefrina (Máx 0.04 mg de Epinefrina)
  if ((classificacaoASA === 'ASA III' || classificacaoASA === 'ASA IV') && sal.vasoconstritorPadrao.includes('Epinefrina')) {
    maxTubetesSeguroFinal = Math.min(maxTubetesSeguroFinal, 2);
    alertaClinico = `⚠️ ALERTA ASA III/IV: Limite estrito de 2 TUBETES devido ao vasoconstritor adrenérgico (máx 0.04 mg de Epinefrina).`;
  }

  return {
    dmrTotalMg,
    maxTubetesPeso,
    maxTubetesSeguroFinal,
    alertaClinico
  };
}

export function calcularDoseMedicamentoPediatrico(
  med: MedicamentoPrescricao,
  pesoKg: number
): {
  dosePorTomadaMg: number;
  posologiaCalculadaTexto: string;
} {
  if (med.dosePediatricaMgKg === 0) {
    return {
      dosePorTomadaMg: 0,
      posologiaCalculadaTexto: 'CONTRAINDICADO PARA CRIANÇAS'
    };
  }

  const doseDiariaMg = pesoKg * med.dosePediatricaMgKg;
  const tomadasPorDia = 24 / med.frequenciaHoras;
  const dosePorTomadaMg = Math.round(doseDiariaMg / (med.frequenciaHoras === 24 ? 1 : tomadasPorDia));

  const posologiaCalculadaTexto = `Tomar aproximadamente ${dosePorTomadaMg} mg (${Math.round(dosePorTomadaMg / 10)} gotas ou mL de suspensão) de ${med.frequenciaHoras} em ${med.frequenciaHoras} horas por ${med.duracaoDias} dias.`;

  return {
    dosePorTomadaMg,
    posologiaCalculadaTexto
  };
}

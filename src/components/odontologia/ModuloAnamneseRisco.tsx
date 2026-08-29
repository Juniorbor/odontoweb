import React, { useState } from 'react';
import {
  CheckCircle2,
  ShieldAlert,
  HeartPulse,
  Pill,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import type { ClassificacaoASA } from '../../types/odontologia';
import { INTERACOES_MEDICAMENTOSAS } from '../../services/odontologiaService';

interface ModuloAnamneseRiscoProps {
  darkMode?: boolean;
}

export const ModuloAnamneseRisco: React.FC<ModuloAnamneseRiscoProps> = ({ darkMode }) => {
  const [respostas, setRespostas] = useState<Record<string, boolean>>({
    hasPressaoAlta: false,
    hasInfartoRecente: false,
    hasDiabetes: false,
    hasDiabetesDescompensado: false,
    hasInsuficienciaRenal: false,
    hasAsma: false,
    hasPropranolol: false,
    hasAnticoagulante: false,
    hasBifosfanato: false,
    hasAlergiaPenicilina: false,
    hasRiscoEndocardite: false
  });

  const [guiaEndocarditeAberto, setGuiaEndocarditeAberto] = useState(false);

  const toggleResposta = (key: string) => {
    setRespostas((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Avaliação da Classificação ASA
  let classificacaoASA: ClassificacaoASA = 'ASA I';
  let explicacaoASA = 'Paciente hígido, sem doenças sistêmicas relatadas. Procedimento Odontológico sem restrições.';
  const alertasGraves: string[] = [];

  if (respostas.hasInfartoRecente) {
    classificacaoASA = 'ASA IV';
    explicacaoASA = 'Risco Sistêmico Extremo: Infarto recente (< 6 meses) ou doença sistêmica incapacitante.';
    alertasGraves.push('CONTRAINDICAÇÃO ABSOLUTA para procedimentos odontológicos eletivos. Atendimento emergencial apenas em ambiente hospitalar.');
  } else if (respostas.hasDiabetesDescompensado || respostas.hasInsuficienciaRenal) {
    classificacaoASA = 'ASA III';
    explicacaoASA = 'Doença sistêmica grave que limita a atividade mas não é incapacitante.';
    alertasGraves.push('Contraindicação relativa para cirurgias extensas. Limitar anestésicos vasoconstritores a no máximo 2 tubetes com Epinefrina.');
  } else if (respostas.hasPressaoAlta || respostas.hasDiabetes || respostas.hasAsma) {
    classificacaoASA = 'ASA II';
    explicacaoASA = 'Paciente com doença sistêmica leve a moderada controlada.';
  }

  // Identificação de Interações Medicamentosas Ativas
  const interacoesAtivas = INTERACOES_MEDICAMENTOSAS.filter((inter) => {
    if (respostas.hasPropranolol && inter.farmacoContinuo.includes('Propranolol')) return true;
    if (respostas.hasAnticoagulante && inter.farmacoContinuo.includes('Varfarina')) return true;
    if (respostas.hasBifosfanato && inter.farmacoContinuo.includes('Bifosfanatos')) return true;
    if (respostas.hasDiabetes && inter.farmacoContinuo.includes('Hipoglicemiantes')) return true;
    return false;
  });

  return (
    <div className="space-y-6 font-sans animate-fadeIn">
      {/* Banner Superior com Classificação ASA Resultante */}
      <div className={`p-6 rounded-3xl border shadow-xl transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        classificacaoASA === 'ASA IV'
          ? 'bg-gradient-to-r from-rose-950 to-slate-950 border-rose-500/60 text-white shadow-rose-500/20'
          : classificacaoASA === 'ASA III'
          ? 'bg-gradient-to-r from-amber-950 to-slate-950 border-amber-500/60 text-white shadow-amber-500/20'
          : classificacaoASA === 'ASA II'
          ? 'bg-gradient-to-r from-sky-950 to-slate-950 border-sky-500/60 text-white'
          : 'bg-gradient-to-r from-emerald-950 to-slate-950 border-emerald-500/60 text-white'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`p-3.5 rounded-2xl border ${
            classificacaoASA === 'ASA IV' ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' : 'bg-teal-500/20 border-teal-500/40 text-teal-400'
          }`}>
            <HeartPulse className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest font-extrabold text-slate-400">Classificação Médica de Risco</span>
              <span className={`px-3 py-0.5 rounded-full text-xs font-black uppercase ${
                classificacaoASA === 'ASA IV' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-slate-950'
              }`}>
                {classificacaoASA}
              </span>
            </div>
            <h2 className="text-xl font-black text-white mt-0.5">{explicacaoASA}</h2>
          </div>
        </div>

        {alertasGraves.length > 0 && (
          <div className="bg-rose-500/10 border border-rose-500/40 p-3 rounded-2xl max-w-md text-xs text-rose-200 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-rose-400">
              <ShieldAlert className="w-4 h-4" /> ALERTA DE SEGURANÇA CLÍNICA
            </div>
            {alertasGraves.map((alerta, idx) => (
              <p key={idx} className="leading-relaxed">{alerta}</p>
            ))}
          </div>
        )}
      </div>

      {/* Grid de Triagem da Anamnese Inteligente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lado Esquerdo: Questionário por Sistemas */}
        <div className={`p-6 rounded-3xl border shadow-lg space-y-4 ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <h3 className="font-extrabold text-base flex items-center gap-2 text-teal-400 border-b border-slate-800 pb-3">
            <HeartPulse className="w-5 h-5" /> Questionário de Triagem Sistêmica
          </h3>

          <div className="space-y-2.5 text-xs">
            <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-800/60 bg-slate-950/40 hover:border-teal-500/40 transition-all cursor-pointer">
              <span>Hipertensão Arterial (Pressão Alta)?</span>
              <input
                type="checkbox"
                checked={respostas.hasPressaoAlta}
                onChange={() => toggleResposta('hasPressaoAlta')}
                className="w-4 h-4 accent-teal-500 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-2xl border border-rose-500/30 bg-rose-950/20 hover:border-rose-500/60 transition-all cursor-pointer">
              <span className="text-rose-300 font-semibold">Infarto ou AVC nos últimos 6 meses?</span>
              <input
                type="checkbox"
                checked={respostas.hasInfartoRecente}
                onChange={() => toggleResposta('hasInfartoRecente')}
                className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-800/60 bg-slate-950/40 hover:border-teal-500/40 transition-all cursor-pointer">
              <span>Diabetes Mellitus (Tipo 1 ou Tipo 2)?</span>
              <input
                type="checkbox"
                checked={respostas.hasDiabetes}
                onChange={() => toggleResposta('hasDiabetes')}
                className="w-4 h-4 accent-teal-500 rounded cursor-pointer"
              />
            </label>

            {respostas.hasDiabetes && (
              <label className="flex items-center justify-between p-3 ml-4 rounded-2xl border border-amber-500/40 bg-amber-950/20 transition-all cursor-pointer text-amber-300">
                <span>Glicemia de Jejum &gt; 200 mg/dL (Descompensado)?</span>
                <input
                  type="checkbox"
                  checked={respostas.hasDiabetesDescompensado}
                  onChange={() => toggleResposta('hasDiabetesDescompensado')}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </label>
            )}

            <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-800/60 bg-slate-950/40 hover:border-teal-500/40 transition-all cursor-pointer">
              <span>Insuficiência Renal Crônica / Hemodiálise?</span>
              <input
                type="checkbox"
                checked={respostas.hasInsuficienciaRenal}
                onChange={() => toggleResposta('hasInsuficienciaRenal')}
                className="w-4 h-4 accent-teal-500 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-800/60 bg-slate-950/40 hover:border-teal-500/40 transition-all cursor-pointer">
              <span>Asma Brônquica ou DPOC?</span>
              <input
                type="checkbox"
                checked={respostas.hasAsma}
                onChange={() => toggleResposta('hasAsma')}
                className="w-4 h-4 accent-teal-500 rounded cursor-pointer"
              />
            </label>

            <div className="pt-2 border-t border-slate-800 font-bold text-slate-400 text-[11px] uppercase tracking-wider">
              Uso de Medicamentos Contínuos & Alergias
            </div>

            <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-800/60 bg-slate-950/40 hover:border-teal-500/40 transition-all cursor-pointer">
              <span>Usa Beta-bloqueador (ex: Propranolol)?</span>
              <input
                type="checkbox"
                checked={respostas.hasPropranolol}
                onChange={() => toggleResposta('hasPropranolol')}
                className="w-4 h-4 accent-teal-500 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-800/60 bg-slate-950/40 hover:border-teal-500/40 transition-all cursor-pointer">
              <span>Usa Anticoagulante (Varfarina, Marevan, DOACs)?</span>
              <input
                type="checkbox"
                checked={respostas.hasAnticoagulante}
                onChange={() => toggleResposta('hasAnticoagulante')}
                className="w-4 h-4 accent-teal-500 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-2xl border border-slate-800/60 bg-slate-950/40 hover:border-teal-500/40 transition-all cursor-pointer">
              <span>Usa Bifosfanato (Alendronato/Zoledronato)?</span>
              <input
                type="checkbox"
                checked={respostas.hasBifosfanato}
                onChange={() => toggleResposta('hasBifosfanato')}
                className="w-4 h-4 accent-teal-500 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-2xl border border-rose-500/30 bg-rose-950/20 transition-all cursor-pointer">
              <span className="text-rose-300 font-bold">ALERGIA A PENICILINAS (Amoxicilina)?</span>
              <input
                type="checkbox"
                checked={respostas.hasAlergiaPenicilina}
                onChange={() => toggleResposta('hasAlergiaPenicilina')}
                className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-2xl border border-sky-500/30 bg-sky-950/20 transition-all cursor-pointer">
              <span className="text-sky-300 font-bold">Risco de Endocardite (Prótese valvar/Endocardite prévia)?</span>
              <input
                type="checkbox"
                checked={respostas.hasRiscoEndocardite}
                onChange={() => toggleResposta('hasRiscoEndocardite')}
                className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Lado Direito: Cruzamento de Interações & Profilaxia Antibiótica */}
        <div className="space-y-6">
          {/* Painel de Interações Medicamentosas */}
          <div className={`p-6 rounded-3xl border shadow-lg space-y-4 ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className="font-extrabold text-base flex items-center gap-2 text-amber-400 border-b border-slate-800 pb-3">
              <Pill className="w-5 h-5" /> Cruzamento de Fármacos em Tempo Real
            </h3>

            {interacoesAtivas.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs space-y-2 border border-dashed border-slate-800 rounded-2xl">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto opacity-80" />
                <p>Nenhuma interação medicamentosa grave identificada com os fármacos selecionados.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {interacoesAtivas.map((inter, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border border-rose-500/40 bg-rose-950/20 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-rose-300 uppercase">{inter.farmacoContinuo} × {inter.farmacoOdonto}</span>
                      <span className="bg-rose-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                        {inter.gravidade}
                      </span>
                    </div>
                    <p className="text-slate-300 leading-relaxed font-normal">{inter.mecanismoERisco}</p>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-emerald-400 font-semibold text-[11px]">
                      💡 Recomendação: {inter.recomendacaoClinica}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Guia Expansível de Profilaxia Antibiótica para Endocardite */}
          <div className={`p-6 rounded-3xl border shadow-lg space-y-4 ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <button
              onClick={() => setGuiaEndocarditeAberto(!guiaEndocarditeAberto)}
              className="w-full flex justify-between items-center text-left font-extrabold text-base text-sky-400 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" /> Guia de Profilaxia Antibiótica (AHA / ABO)
              </div>
              {guiaEndocarditeAberto ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {guiaEndocarditeAberto && (
              <div className="space-y-3 pt-2 text-xs border-t border-slate-800 animate-fadeIn">
                <div className="bg-sky-950/40 border border-sky-500/30 p-3 rounded-2xl text-sky-200 space-y-1">
                  <span className="font-bold flex items-center gap-1"><Info className="w-4 h-4" /> Indicações Estritas:</span>
                  <p className="text-[11px] leading-relaxed">
                    Próteses valvares cardíacas, endocardite infecciosa prévia, cardiopatia congênita cianótica não reparada ou transplante cardíaco com valvopatia.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl border border-emerald-500/40 bg-emerald-950/20 space-y-1">
                    <h5 className="font-extrabold text-emerald-400">Esquema Padrão (Sem Alergia)</h5>
                    <p className="font-bold text-white text-sm">Amoxicilina 2g VO</p>
                    <p className="text-[11px] text-slate-300">Adulto: 2g (4 cps de 500mg) 30 a 60 min antes.</p>
                    <p className="text-[11px] text-slate-300">Infantil: 50 mg/kg 30 a 60 min antes.</p>
                  </div>

                  <div className={`p-3.5 rounded-2xl border ${respostas.hasAlergiaPenicilina ? 'border-rose-500 bg-rose-950/40 animate-pulse' : 'border-amber-500/40 bg-amber-950/20'} space-y-1`}>
                    <h5 className="font-extrabold text-amber-400">Alérgicos a Penicilina</h5>
                    <p className="font-bold text-white text-sm">Clindamicina 600mg VO</p>
                    <p className="text-[11px] text-slate-300">Adulto: 600 mg (2 cps de 300mg) 30-60 min antes.</p>
                    <p className="text-[11px] text-slate-300">Alternativa: Azitromicina 500 mg VO.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

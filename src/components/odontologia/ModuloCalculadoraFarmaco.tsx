import React, { useState } from 'react';
import {
  Calculator,
  Syringe,
  Pill,
  Copy,
  Check,
  FileText
} from 'lucide-react';
import {
  SAIS_ANESTESICOS,
  MEDICAMENTOS_PRESCRICAO,
  calcularDMRAnestesico,
  calcularDoseMedicamentoPediatrico
} from '../../services/odontologiaService';
import type { ClassificacaoASA } from '../../types/odontologia';

interface ModuloCalculadoraFarmacoProps {
  darkMode?: boolean;
}

export const ModuloCalculadoraFarmaco: React.FC<ModuloCalculadoraFarmacoProps> = ({ darkMode }) => {
  const [pesoKg, setPesoKg] = useState<number>(70);
  const [classificacaoASA, setClassificacaoASA] = useState<ClassificacaoASA>('ASA I');
  const [salSelecionadoId, setSalSelecionadoId] = useState<string>('lido_2_epi_100');
  const [medSelecionadoId, setMedSelecionadoId] = useState<string>('dipirona');
  const [modoFaixaEtaria, setModoFaixaEtaria] = useState<'adulto' | 'pediatrico'>('adulto');

  const [copiado, setCopiado] = useState(false);

  const salSelecionado = SAIS_ANESTESICOS.find((s) => s.id === salSelecionadoId) || SAIS_ANESTESICOS[0];
  const medSelecionado = MEDICAMENTOS_PRESCRICAO.find((m) => m.id === medSelecionadoId) || MEDICAMENTOS_PRESCRICAO[0];

  // Cálculo Anestésico
  const calculoAnestesico = calcularDMRAnestesico(salSelecionado, pesoKg, classificacaoASA);

  // Cálculo Prescrição Pediátrica/Adulto
  const calculoPediatrico = calcularDoseMedicamentoPediatrico(medSelecionado, pesoKg);

  // Gerador de Texto Prontuário / Receita
  const gerarTextoReceita = () => {
    const dataHoje = new Date().toLocaleDateString('pt-BR');
    if (modoFaixaEtaria === 'adulto') {
      return `RECEITUÁRIO ODONTOLÓGICO - ${dataHoje}

Uso Interno:
1. ${medSelecionado.nome.toUpperCase()} ------------ 1 Caixa/Frasco
   Posologia: ${medSelecionado.posologiaTextoAdulto}

Orientações ao Paciente:
- ${medSelecionado.orientacoesPaciente}`;
    }

    return `RECEITUÁRIO ODONTOLÓGICO (PEDIÁTRICO) - ${dataHoje}
Paciente: Criança (${pesoKg} kg)

Uso Interno:
1. ${medSelecionado.nome.toUpperCase()} (Suspensão/Gotas) ------------ 1 Frasco
   Posologia: ${calculoPediatrico.posologiaCalculadaTexto}

Orientações:
- ${medSelecionado.orientacoesPaciente}`;
  };

  const handleCopiarReceita = () => {
    navigator.clipboard.writeText(gerarTextoReceita());
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  return (
    <div className="space-y-6 font-sans animate-fadeIn">
      {/* Controles do Peso e ASA do Paciente */}
      <div className={`p-6 rounded-3xl border shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center gap-4 flex-1">
          <div className="p-3.5 bg-teal-500/10 text-teal-400 rounded-2xl border border-teal-500/20">
            <Calculator className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-black text-white">Calculadora Farmacológica & Anestésica</h2>
            <p className="text-xs text-slate-400">Parâmetros essenciais para atendimento clínico seguro.</p>
          </div>
        </div>

        {/* Inputs de Peso e Risco ASA */}
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="space-y-1">
            <label className="text-[11px] font-extrabold uppercase text-slate-400 block">Peso Corporal (kg)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={150}
                value={pesoKg}
                onChange={(e) => setPesoKg(Number(e.target.value) || 1)}
                className={`w-24 px-3 py-2 text-sm font-bold rounded-2xl border transition-all text-center ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-teal-400' : 'bg-slate-100 border-slate-200 text-teal-600'
                }`}
              />
              <span className="text-xs font-bold text-slate-400">kg</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-extrabold uppercase text-slate-400 block">Classificação ASA</label>
            <select
              value={classificacaoASA}
              onChange={(e) => setClassificacaoASA(e.target.value as ClassificacaoASA)}
              className={`px-3 py-2 text-xs font-bold rounded-2xl border transition-all ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
              }`}
            >
              <option value="ASA I">ASA I (Hígido)</option>
              <option value="ASA II">ASA II (Leve/Compensado)</option>
              <option value="ASA III">ASA III (Grave/Cardiopata)</option>
              <option value="ASA IV">ASA IV (Risco Severo)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid com 2 Módulos: Anestésicos e Prescritor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lado Esquerdo: Calculadora Anestésica (DMR & Tubetes) */}
        <div className={`p-6 rounded-3xl border shadow-lg space-y-5 ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-extrabold text-base flex items-center gap-2 text-teal-400">
              <Syringe className="w-5 h-5" /> Cálculo Anestésico & Limite de Tubetes
            </h3>
            <span className="text-[10px] bg-teal-500/10 text-teal-400 font-mono px-2 py-0.5 rounded-full border border-teal-500/20">
              1.8 mL / tubete
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-300 block mb-1.5">Selecione o Sal Anestésico:</label>
              <select
                value={salSelecionadoId}
                onChange={(e) => setSalSelecionadoId(e.target.value)}
                className={`w-full p-3 text-xs font-bold rounded-2xl border transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
                }`}
              >
                {SAIS_ANESTESICOS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Painel do Resultado Anestésico */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase text-slate-400 font-extrabold block">DMR Total Calculada</span>
                  <span className="text-lg font-black text-teal-400 font-mono">
                    {calculoAnestesico.dmrTotalMg.toFixed(1)} mg
                  </span>
                  <span className="text-[9px] text-slate-500 block">DMR: {salSelecionado.dmrMgKg} mg/kg</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase text-slate-400 font-extrabold block">Máximo Seguro de Tubetes</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono">
                    {calculoAnestesico.maxTubetesSeguroFinal} <span className="text-xs font-normal">tubetes</span>
                  </span>
                  <span className="text-[9px] text-slate-500 block">({salSelecionado.mgPorTubete} mg por tubete)</span>
                </div>
              </div>

              {/* Alerta Anestésico */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                <p className="font-semibold text-teal-300">{calculoAnestesico.alertaClinico}</p>
                <p className="text-[10px] text-slate-400">Vasoconstritor: {salSelecionado.vasoconstritorPadrao}</p>
              </div>
            </div>

            {/* Detalhes Clínicos do Anestésico */}
            <div className="space-y-2 pt-1 text-[11px]">
              <div className="p-3 rounded-2xl bg-teal-950/20 border border-teal-500/30 text-teal-200">
                <strong className="font-bold block mb-0.5">Indicação Principal:</strong>
                {salSelecionado.indicacoes}
              </div>
              <div className="p-3 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-rose-200">
                <strong className="font-bold block mb-0.5">Contraindicação / Atenção:</strong>
                {salSelecionado.contraindicacoes}
              </div>
            </div>
          </div>
        </div>

        {/* Lado Direito: Prescritor Farmacológico & Gerador de Receitas */}
        <div className={`p-6 rounded-3xl border shadow-lg space-y-5 ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-extrabold text-base flex items-center gap-2 text-sky-400">
              <Pill className="w-5 h-5" /> Prescritor Farmacológico & Receituário
            </h3>

            {/* Toggle Adulto / Pediátrico */}
            <div className="flex bg-slate-800 p-0.5 rounded-xl border border-slate-700 text-[10px] font-bold">
              <button
                onClick={() => setModoFaixaEtaria('adulto')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  modoFaixaEtaria === 'adulto' ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Adulto
              </button>
              <button
                onClick={() => setModoFaixaEtaria('pediatrico')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  modoFaixaEtaria === 'pediatrico' ? 'bg-sky-500 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Pediátrico (mg/kg)
              </button>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-300 block mb-1.5">Selecione o Medicamento:</label>
              <select
                value={medSelecionadoId}
                onChange={(e) => setMedSelecionadoId(e.target.value)}
                className={`w-full p-3 text-xs font-bold rounded-2xl border transition-all ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
                }`}
              >
                {MEDICAMENTOS_PRESCRICAO.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome} ({m.classe.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {/* Resultado do Cálculo da Dose */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-extrabold text-sky-400 uppercase tracking-wider">
                  Dose Recomendada ({modoFaixaEtaria.toUpperCase()})
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {modoFaixaEtaria === 'pediatrico' ? `${medSelecionado.dosePediatricaMgKg} mg/kg` : medSelecionado.doseAdultoPadrao}
                </span>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed bg-slate-900 p-3 rounded-xl border border-slate-800 font-medium">
                {modoFaixaEtaria === 'adulto'
                  ? medSelecionado.posologiaTextoAdulto
                  : calculoPediatrico.posologiaCalculadaTexto}
              </p>
            </div>

            {/* Gerador de Receita Pronta com Botão de Cópia */}
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-slate-300 text-xs flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-sky-400" /> Texto de Prescrição para Prontuário
                </span>
                <button
                  onClick={handleCopiarReceita}
                  className="bg-sky-500 hover:bg-sky-600 text-white font-bold px-3 py-1.5 rounded-xl text-[11px] flex items-center gap-1 shadow-md transition-all cursor-pointer"
                >
                  {copiado ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" /> Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copiar Receita
                    </>
                  )}
                </button>
              </div>

              <textarea
                readOnly
                rows={5}
                value={gerarTextoReceita()}
                className={`w-full p-3 text-[11px] font-mono rounded-2xl border transition-all resize-none focus:outline-none ${
                  darkMode ? 'bg-slate-950 border-slate-800 text-sky-300' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

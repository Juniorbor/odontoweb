import React, { useState } from 'react';
import {
  HeartPulse,
  Calculator,
  Microscope,
  BookOpenCheck,
  Sparkles,
  GraduationCap
} from 'lucide-react';
import { ModuloAnamneseRisco } from './odontologia/ModuloAnamneseRisco';
import { ModuloCalculadoraFarmaco } from './odontologia/ModuloCalculadoraFarmaco';
import { ModuloAtlasEstomatologia } from './odontologia/ModuloAtlasEstomatologia';
import { ModuloProtocolosEspecialidade } from './odontologia/ModuloProtocolosEspecialidade';
import LOGO_BASE64 from '../assets/logoData';

interface OdontologiaMainProps {
  darkMode?: boolean;
  userRole?: 'admin' | 'cliente';
}

export const OdontologiaMain: React.FC<OdontologiaMainProps> = ({
  darkMode
}) => {
  const [abaAtiva, setAbaAtiva] = useState<'anamnese' | 'farmaco' | 'estomatologia' | 'protocolos'>('anamnese');

  return (
    <div className="space-y-6 w-full max-w-full animate-fadeIn font-sans text-slate-200">
      {/* Banner Executivo Principal da Odontologia */}
      <div className="relative overflow-hidden bg-gradient-to-r from-teal-950 via-slate-950 to-sky-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-teal-500/40">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 bg-gradient-to-br from-teal-500/20 to-sky-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0 hidden sm:block">
              <img
                src={LOGO_BASE64}
                alt="Logo Odontologia"
                className="w-14 h-14 object-contain rounded-full border-2 border-teal-400 shadow-xl bg-white p-1"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-teal-400 border-2 border-slate-900 rounded-full animate-ping"></span>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 bg-teal-500/20 text-teal-300 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest border border-teal-500/40">
                  <GraduationCap className="w-3.5 h-3.5 text-teal-300" /> Suporte à Decisão Clínica & Acadêmica
                </span>
                <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 text-[11px] font-extrabold px-3 py-1 rounded-full border border-emerald-500/30">
                  <Sparkles className="w-3.5 h-3.5" /> PWA Atendimento Supervisionado
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                Odontologia Clínica & Guia Acadêmico
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm font-normal max-w-2xl">
                Plataforma integrada de dosagem anestésica, triagem de risco sistêmico ASA, atlas estomatológico e protocolos cirúrgicos/endodônticos.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navegação de Abas do Módulo de Odontologia */}
      <div className="flex flex-wrap gap-2.5 text-xs font-extrabold border-b border-slate-800 pb-3">
        {[
          { id: 'anamnese', label: '1. Anamnese & Risco ASA', icon: HeartPulse },
          { id: 'farmaco', label: '2. Calculadora Anestésica & Fármacos', icon: Calculator },
          { id: 'estomatologia', label: '3. Atlas de Estomatologia', icon: Microscope },
          { id: 'protocolos', label: '4. Protocolos de Especialidade', icon: BookOpenCheck }
        ].map((aba) => {
          const IconComponent = aba.icon;
          const isSelected = abaAtiva === aba.id;

          return (
            <button
              key={aba.id}
              onClick={() => setAbaAtiva(aba.id as any)}
              className={`px-4 py-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-2 text-xs ${
                isSelected
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 border-teal-400 font-black shadow-lg shadow-teal-500/20 scale-[1.02]'
                  : darkMode
                  ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <IconComponent className={`w-4 h-4 ${isSelected ? 'text-slate-950' : 'text-teal-400'}`} />
              {aba.label}
            </button>
          );
        })}
      </div>

      {/* Renderização da Sub-View Ativa */}
      {abaAtiva === 'anamnese' && <ModuloAnamneseRisco darkMode={darkMode} />}
      {abaAtiva === 'farmaco' && <ModuloCalculadoraFarmaco darkMode={darkMode} />}
      {abaAtiva === 'estomatologia' && <ModuloAtlasEstomatologia darkMode={darkMode} />}
      {abaAtiva === 'protocolos' && <ModuloProtocolosEspecialidade darkMode={darkMode} />}
    </div>
  );
};

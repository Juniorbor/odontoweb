import React, { useState } from 'react';
import { VisualizadorRadiografia2D } from './VisualizadorRadiografia2D';
import { ModuloCefalometria } from './ModuloCefalometria';
import { VisualizadorDicomCBCT } from './VisualizadorDicomCBCT';
import {
  Eye,
  Compass,
  Box,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface PainelRadiologiaMainProps {
  darkMode?: boolean;
  pacienteNome?: string;
}

export const PainelRadiologiaMain: React.FC<PainelRadiologiaMainProps> = ({
  darkMode = true,
  pacienteNome = 'Paciente Exemplo'
}) => {
  const [subAba, setSubAba] = useState<'2d' | 'cefalometria' | 'cbct'>('2d');

  return (
    <div className="space-y-6 animate-fadeIn font-sans text-slate-200">
      
      {/* BANNER EXECUTIVO DE RADIOLOGIA ODONTOLÓGICA & DICOM */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-indigo-500/30">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 bg-gradient-to-br from-indigo-500/20 to-sky-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-500/20 to-sky-500/20 text-indigo-300 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest border border-indigo-500/40">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Diagnóstico Por Imagem 2D / 3D
              </span>

              <span className="inline-flex items-center gap-1.5 bg-teal-500/10 text-teal-400 text-[11px] font-extrabold px-3 py-1 rounded-full border border-teal-500/30">
                <ShieldCheck className="w-3.5 h-3.5" /> PACS & DICOM Nativo no Navegador
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Radiologia Odontológica & Cefalometria 3D CBCT
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm font-normal max-w-2xl">
              Visualização avançada de radiografias intra/extrabucais, traçados cefalométricos automatizados (Steiner, Ricketts, McNamara) e reconstrução multiplanar tomográfica (MPR) sem necessidade de hardwares caros.
            </p>
          </div>

          {/* SELETOR DE SUB-ABAS DO PAINEL */}
          <div className="bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 flex flex-wrap gap-2 shadow-inner">
            <button
              onClick={() => setSubAba('2d')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                subAba === '2d'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Eye className="w-4 h-4 text-teal-300" /> Radiografias 2D
            </button>

            <button
              onClick={() => setSubAba('cefalometria')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                subAba === 'cefalometria'
                  ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Compass className="w-4 h-4 text-sky-300" /> Cefalometria Online
            </button>

            <button
              onClick={() => setSubAba('cbct')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                subAba === 'cbct'
                  ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Box className="w-4 h-4 text-amber-300" /> Tomografia DICOM 3D
            </button>
          </div>
        </div>
      </div>

      {/* COMPONENTE DA SUB-ABA SELECIONADA */}
      {subAba === '2d' && (
        <VisualizadorRadiografia2D darkMode={darkMode} pacienteNome={pacienteNome} />
      )}

      {subAba === 'cefalometria' && (
        <ModuloCefalometria darkMode={darkMode} pacienteNome={pacienteNome} />
      )}

      {subAba === 'cbct' && (
        <VisualizadorDicomCBCT darkMode={darkMode} pacienteNome={pacienteNome} />
      )}

    </div>
  );
};

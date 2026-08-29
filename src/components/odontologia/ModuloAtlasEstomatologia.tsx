import React, { useState } from 'react';
import {
  Search,
  Stethoscope,
  Microscope,
  ChevronRight
} from 'lucide-react';
import { ATLAS_ESTOMATOLOGIA } from '../../services/odontologiaService';
import type { LesaoEstomatologia } from '../../types/odontologia';

interface ModuloAtlasEstomatologiaProps {
  darkMode?: boolean;
}

export const ModuloAtlasEstomatologia: React.FC<ModuloAtlasEstomatologiaProps> = ({ darkMode }) => {
  const [filtroLesaoFundamental, setFiltroLesaoFundamental] = useState<string>('todos');
  const [buscaQuery, setBuscaQuery] = useState<string>('');
  const [lesaoSelecionada, setLesaoSelecionada] = useState<LesaoEstomatologia>(ATLAS_ESTOMATOLOGIA[0]);

  const lesoesFiltradas = ATLAS_ESTOMATOLOGIA.filter((lesao) => {
    const matchFiltro = filtroLesaoFundamental === 'todos' || lesao.lesaoFundamental === filtroLesaoFundamental;
    const matchBusca = lesao.nome.toLowerCase().includes(buscaQuery.toLowerCase()) ||
                       lesao.caracteristicasClinicas.toLowerCase().includes(buscaQuery.toLowerCase()) ||
                       lesao.localizacaoComum.toLowerCase().includes(buscaQuery.toLowerCase());
    return matchFiltro && matchBusca;
  });

  return (
    <div className="space-y-6 font-sans animate-fadeIn">
      {/* Banner de Boas-Vindas do Atlas */}
      <div className={`p-6 rounded-3xl border shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
            <Microscope className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">Atlas de Estomatologia & Árvore de Decisão Diagnóstica</h2>
            <p className="text-xs text-slate-400">Guia de diagnóstico diferencial para conduta biopsial e clínica.</p>
          </div>
        </div>

        {/* Campo de Busca Rápida por Lesão */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar lesão, localização..."
            value={buscaQuery}
            onChange={(e) => setBuscaQuery(e.target.value)}
            className={`w-full pl-9 pr-3 py-2 text-xs rounded-2xl border transition-all ${
              darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-100 border-slate-200 text-slate-800'
            }`}
          />
        </div>
      </div>

      {/* Botões das Lesões Fundamentais (Árvore de Decisão) */}
      <div className="flex flex-wrap gap-2 text-xs font-extrabold">
        {[
          { id: 'todos', label: 'Todas as Lesões' },
          { id: 'placa', label: 'Placa' },
          { id: 'papula_nodulo', label: 'Pápula / Nódulo' },
          { id: 'vesicula_bolha', label: 'Vesícula / Bolha' },
          { id: 'ulcera', label: 'Úlcera' },
          { id: 'mancha', label: 'Mancha / Mácula' }
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFiltroLesaoFundamental(f.id)}
            className={`px-4 py-2 rounded-2xl border transition-all cursor-pointer ${
              filtroLesaoFundamental === f.id
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                : darkMode
                ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid Principal: Lista à Esquerda e Detalhes da Lesão Selecionada à Direita */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1: Lista de Lesões Identificadas */}
        <div className={`p-4 rounded-3xl border shadow-lg space-y-3 ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <span className="text-xs font-extrabold uppercase text-slate-400 tracking-wider block px-2">
            Lesões Localizadas ({lesoesFiltradas.length})
          </span>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {lesoesFiltradas.map((lesao) => (
              <div
                key={lesao.id}
                onClick={() => setLesaoSelecionada(lesao)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                  lesaoSelecionada.id === lesao.id
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md font-bold'
                    : darkMode
                    ? 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                    : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <div>
                  <h4 className="font-extrabold text-xs">{lesao.nome}</h4>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-mono mt-0.5">
                    {lesao.lesaoFundamental.replace('_', ' ')}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Coluna 2 e 3: Ficha Clínica e Diagnóstico Diferencial da Lesão Selecionada */}
        <div className={`lg:col-span-2 p-6 rounded-3xl border shadow-lg space-y-6 ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border border-amber-500/30">
                Lesão Fundamental: {lesaoSelecionada.lesaoFundamental.replace('_', ' ')}
              </span>
              <h3 className="text-xl font-black text-white mt-1.5">{lesaoSelecionada.nome}</h3>
            </div>

            {/* Badge de Conduta */}
            <span className={`px-3 py-1.5 rounded-2xl text-xs font-black uppercase tracking-wider ${
              lesaoSelecionada.condutaRecomendada === 'encaminhamento_urgente'
                ? 'bg-rose-500 text-white animate-pulse'
                : lesaoSelecionada.condutaRecomendada === 'biopsia_incisional' || lesaoSelecionada.condutaRecomendada === 'biopsia_excisional'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-emerald-500 text-slate-950'
            }`}>
              Conduta: {lesaoSelecionada.condutaRecomendada.replace('_', ' ')}
            </span>
          </div>

          {/* Características Clínicas */}
          <div className="space-y-4 text-xs">
            <div className="space-y-1 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <h5 className="font-extrabold text-amber-400 uppercase tracking-wider text-[11px]">Aspecto Clínico & Sintomatologia</h5>
              <p className="text-slate-200 leading-relaxed text-xs">{lesaoSelecionada.caracteristicasClinicas}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <h5 className="font-extrabold text-sky-400 uppercase tracking-wider text-[11px]">Localização Típica</h5>
                <p className="text-slate-300">{lesaoSelecionada.localizacaoComum}</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <h5 className="font-extrabold text-emerald-400 uppercase tracking-wider text-[11px]">Perfil de Pacientes</h5>
                <p className="text-slate-300">{lesaoSelecionada.faixaEtariaPredominante}</p>
              </div>
            </div>

            {/* Diagnósticos Diferenciais */}
            <div className="space-y-2">
              <h5 className="font-extrabold text-slate-300 uppercase tracking-wider text-[11px]">Diagnósticos Diferenciais Principais</h5>
              <div className="flex flex-wrap gap-2">
                {lesaoSelecionada.diagnosticosDiferenciais.map((diag, idx) => (
                  <span key={idx} className="bg-slate-800 text-slate-200 px-3 py-1 rounded-xl text-xs border border-slate-700 font-semibold">
                    • {diag}
                  </span>
                ))}
              </div>
            </div>

            {/* Protocolo de Conduta Recomendado */}
            <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/40 text-amber-200 space-y-1.5">
              <div className="flex items-center gap-2 font-black text-amber-400 text-xs">
                <Stethoscope className="w-4 h-4" /> RECOMENDAÇÃO DE CONDUTA ACADÊMICO-CLÍNICA:
              </div>
              <p className="leading-relaxed text-xs">{lesaoSelecionada.detalheConduta}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Box,
  Shield,
  RefreshCw,
  FileCheck,
  FolderOpen,
  RotateCw,
  FlipHorizontal,
  Sparkles
} from 'lucide-react';
import {
  carregarArquivoDicomOuImagem,
  carregarSerieDicomOuArquivos,
  type ParsedDicomResult,
  type DicomSliceData
} from '../../utils/dicomLoader';

interface VisualizadorDicomCBCTProps {
  darkMode?: boolean;
  pacienteNome?: string;
}

export const VisualizadorDicomCBCT: React.FC<VisualizadorDicomCBCTProps> = ({
  darkMode = true,
  pacienteNome = 'Paciente Exemplo'
}) => {
  // Estado dos Cortes Multiplanares MPR (Axial, Coronal, Sagital)
  const [fatiaAxial, setFatiaAxial] = useState<number>(1);
  const [fatiaCoronal, setFatiaCoronal] = useState<number>(1);
  const [fatiaSagital, setFatiaSagital] = useState<number>(1);
  const [totalAxial, setTotalAxial] = useState<number>(100);
  const [totalCoronal, setTotalCoronal] = useState<number>(100);
  const [totalSagital, setTotalSagital] = useState<number>(100);
  const [espacamentoMm, setEspacamentoMm] = useState<number>(0.5);

  // Estados de Rotação e Espelhamento dos Cortes
  const [rotacaoAxial, setRotacaoAxial] = useState<number>(0);
  const [rotacaoCoronal, setRotacaoCoronal] = useState<number>(0);
  const [rotacaoSagital, setRotacaoSagital] = useState<number>(0);
  const [espelharAxial, setEspelharAxial] = useState<boolean>(false);
  const [espelharCoronal, setEspelharCoronal] = useState<boolean>(false);
  const [espelharSagital, setEspelharSagital] = useState<boolean>(false);
  const [nitidezHD, setNitidezHD] = useState<boolean>(true);

  // Presets de Janelamento DICOM (Window Width / Window Level)
  const [janelaPreset, setJanelaPreset] = useState<'osseo' | 'dente' | 'moles'>('osseo');
  const [crosshairAtivo, setCrosshairAtivo] = useState<boolean>(true);
  const [destacarNervoAlveolar, setDestacarNervoAlveolar] = useState<boolean>(true);
  const [simuladorImplante, setSimuladorImplante] = useState<boolean>(true);
  const [tamanhoImplante, setTamanhoImplante] = useState<string>('Ø 4.0mm x 11.5mm');

  // Serie de Fatias Tomograficas DICOM por Plano Ortogonal (.dcm)
  const [dicomSlicesAxial, setDicomSlicesAxial] = useState<DicomSliceData[]>([]);
  const [dicomSlicesCoronal, setDicomSlicesCoronal] = useState<DicomSliceData[]>([]);
  const [dicomSlicesSagital, setDicomSlicesSagital] = useState<DicomSliceData[]>([]);
  const [nomeArquivoDicom, setNomeArquivoDicom] = useState<string>('Tomografia_ConeBeam_Mandibula.dcm');
  const [imagemDicomLoadedUrl, setImagemDicomLoadedUrl] = useState<string | null>(null);
  const [carregandoDicom, setCarregandoDicom] = useState<boolean>(false);
  const [dicomMeta, setDicomMeta] = useState<ParsedDicomResult['meta'] | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setCarregandoDicom(true);
    const qtdArquivos = fileList.length;

    try {
      if (qtdArquivos === 1) {
        const file = fileList[0];
        setNomeArquivoDicom(file.name);
        const result = await carregarArquivoDicomOuImagem(file);
        setImagemDicomLoadedUrl(result.url);
        setDicomMeta(result.meta);
        const serie = await carregarSerieDicomOuArquivos([file]);
        setDicomSlicesAxial(serie.slicesAxial);
        setDicomSlicesCoronal(serie.slicesCoronal);
        setDicomSlicesSagital(serie.slicesSagital);
        setTotalAxial(serie.totalSlicesAxial);
        setTotalCoronal(serie.totalSlicesCoronal);
        setTotalSagital(serie.totalSlicesSagital);
        setEspacamentoMm(serie.sliceSpacingMm);
        setFatiaAxial(1);
        setFatiaCoronal(Math.max(1, Math.floor(serie.totalSlicesCoronal / 2)));
        setFatiaSagital(Math.max(1, Math.floor(serie.totalSlicesSagital / 2)));
      } else {
        setNomeArquivoDicom(`Série Tomográfica (${qtdArquivos} cortes DICOM)`);
        const serie = await carregarSerieDicomOuArquivos(fileList);
        setDicomSlicesAxial(serie.slicesAxial);
        setDicomSlicesCoronal(serie.slicesCoronal);
        setDicomSlicesSagital(serie.slicesSagital);
        setTotalAxial(serie.totalSlicesAxial);
        setTotalCoronal(serie.totalSlicesCoronal);
        setTotalSagital(serie.totalSlicesSagital);
        setEspacamentoMm(serie.sliceSpacingMm);
        setDicomMeta(serie.meta);
        setImagemDicomLoadedUrl(serie.slicesAxial[0]?.url || null);
        setFatiaAxial(1);
        setFatiaCoronal(Math.max(1, Math.floor(serie.totalSlicesCoronal / 2)));
        setFatiaSagital(Math.max(1, Math.floor(serie.totalSlicesSagital / 2)));
      }
    } catch (err) {
      console.error('Erro ao processar cortes DICOM:', err);
    } finally {
      setCarregandoDicom(false);
    }
  };

  const getSliceAxialUrl = (fatiaNum: number) => {
    if (dicomSlicesAxial.length > 0) {
      const idx = Math.min(dicomSlicesAxial.length - 1, Math.max(0, fatiaNum - 1));
      return dicomSlicesAxial[idx]?.url || imagemDicomLoadedUrl;
    }
    return imagemDicomLoadedUrl;
  };

  const getSliceCoronalUrl = (fatiaNum: number) => {
    if (dicomSlicesCoronal.length > 0) {
      const idx = Math.min(dicomSlicesCoronal.length - 1, Math.max(0, fatiaNum - 1));
      return dicomSlicesCoronal[idx]?.url || imagemDicomLoadedUrl;
    }
    return imagemDicomLoadedUrl;
  };

  const getSliceSagitalUrl = (fatiaNum: number) => {
    if (dicomSlicesSagital.length > 0) {
      const idx = Math.min(dicomSlicesSagital.length - 1, Math.max(0, fatiaNum - 1));
      return dicomSlicesSagital[idx]?.url || imagemDicomLoadedUrl;
    }
    return imagemDicomLoadedUrl;
  };

  const getSliceAxialMm = (fatiaNum: number) => {
    if (dicomSlicesAxial.length > 0) {
      const idx = Math.min(dicomSlicesAxial.length - 1, Math.max(0, fatiaNum - 1));
      return dicomSlicesAxial[idx]?.zPosMm.toFixed(1) || ((fatiaNum - 1) * espacamentoMm).toFixed(1);
    }
    return ((fatiaNum - 1) * espacamentoMm).toFixed(1);
  };

  const getSliceCoronalMm = (fatiaNum: number) => {
    if (dicomSlicesCoronal.length > 0) {
      const idx = Math.min(dicomSlicesCoronal.length - 1, Math.max(0, fatiaNum - 1));
      return dicomSlicesCoronal[idx]?.zPosMm.toFixed(1) || ((fatiaNum - 1) * espacamentoMm).toFixed(1);
    }
    return ((fatiaNum - 1) * espacamentoMm).toFixed(1);
  };

  const getSliceSagitalMm = (fatiaNum: number) => {
    if (dicomSlicesSagital.length > 0) {
      const idx = Math.min(dicomSlicesSagital.length - 1, Math.max(0, fatiaNum - 1));
      return dicomSlicesSagital[idx]?.zPosMm.toFixed(1) || ((fatiaNum - 1) * espacamentoMm).toFixed(1);
    }
    return ((fatiaNum - 1) * espacamentoMm).toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* TOOLBAR SUPERIOR DO VISUALIZADOR DICOM CBCT */}
      <div className={`p-4 rounded-3xl border shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-indigo-500/10 px-3 py-1.5 rounded-2xl border border-indigo-500/30">
            <Box className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-mono font-extrabold text-indigo-300">{nomeArquivoDicom}</span>
          </div>

          <label className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white text-xs font-extrabold cursor-pointer shadow-lg shadow-teal-500/20 flex items-center gap-1.5 transition-all">
            <FolderOpen className="w-4 h-4" /> Selecionar Todos os Cortes DICOM da Pasta (.dcm)
            <input type="file" multiple accept=".dcm,.dicom,.zip,image/*" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={() => setNitidezHD(!nitidezHD)}
            className={`px-3 py-2 rounded-2xl border text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              nitidezHD
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Nitidez HD: {nitidezHD ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={() => setCrosshairAtivo(!crosshairAtivo)}
            className={`px-3 py-2 rounded-2xl border text-xs font-extrabold transition-all cursor-pointer ${
              crosshairAtivo
                ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            🎯 Mira (Crosshair): {crosshairAtivo ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* PRESETS DE JANELAMENTO ÓSSEO / DENTAL */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-bold">Janelamento:</span>
          {(['osseo', 'dente', 'moles'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setJanelaPreset(p)}
              className={`px-3 py-1.5 rounded-xl font-extrabold border transition-all cursor-pointer uppercase text-[10px] ${
                janelaPreset === p
                  ? 'bg-teal-600 text-white border-teal-400 shadow'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              {p === 'osseo' ? 'Tecido Ósseo (WW 2000)' : p === 'dente' ? 'Esmalte & Dente (WW 4000)' : 'Tecidos Moles'}
            </button>
          ))}
        </div>
      </div>

      {/* BANNER DE METADADOS DICOM DA SÉRIE DE CORTES */}
      {dicomMeta && (
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-teal-500/40 flex flex-wrap items-center justify-between text-xs text-slate-300 gap-3">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-teal-400" />
            <span className="font-extrabold text-white">Série Tomográfica DICOM HD (MPR 3D):</span>
            <span className="font-mono text-teal-300">
              {dicomSlicesAxial.length > 0 ? `${dicomSlicesAxial.length} Axiais | ${dicomSlicesCoronal.length} Coronais | ${dicomSlicesSagital.length} Sagitais` : 'Volume Carregado'} | {dicomMeta.fileName}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono">
            <span>Espaçamento: <strong className="text-teal-400">{espacamentoMm} mm/corte</strong></span>
            <span>Modalidade: <strong className="text-teal-400">{dicomMeta.modality}</strong></span>
            <span>Resolução: <strong className="text-teal-400">{dicomMeta.columns}x{dicomMeta.rows}</strong></span>
            <span>Paciente: <strong className="text-white">{dicomMeta.patientName}</strong></span>
          </div>
        </div>
      )}

      {carregandoDicom && (
        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center gap-2 text-indigo-300 text-xs font-extrabold animate-pulse">
          <RefreshCw className="w-4 h-4 animate-spin" /> Processando reconstrução 3D MPR (Axial, Coronal e Sagital)...
        </div>
      )}

      {/* PAINEL CENTRAL MULTIPLANAR RECONSTRUCTION (MPR 3-VIEWPORTS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* VIEWPORT 1: CORTE AXIAL (VISTA SUPERIOR) */}
        <div className={`p-4 rounded-3xl border shadow-xl space-y-3 ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-xs font-extrabold text-teal-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400"></span> Corte Axial (Top-Down)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRotacaoAxial((r) => (r + 90) % 360)}
                title="Girar Corte 90°"
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-400 transition-all cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setEspelharAxial((f) => !f)}
                title="Espelhar Horizontal"
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-400 transition-all cursor-pointer"
              >
                <FlipHorizontal className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono font-bold text-slate-400">
                Fat. {fatiaAxial}/{totalAxial} ({getSliceAxialMm(fatiaAxial)} mm)
              </span>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden bg-black flex items-center justify-center min-h-[300px] border border-slate-800 group">
            <div className="relative w-full h-[300px] bg-slate-950 flex items-center justify-center overflow-hidden">
              {getSliceAxialUrl(fatiaAxial) ? (
                <img
                  src={getSliceAxialUrl(fatiaAxial)!}
                  alt={`Corte DICOM Axial ${fatiaAxial}`}
                  className="absolute inset-0 w-full h-full object-contain transition-all duration-200"
                  style={{
                    filter: `${
                      janelaPreset === 'dente'
                        ? 'brightness(135%) contrast(175%)'
                        : janelaPreset === 'moles'
                        ? 'brightness(90%) contrast(90%)'
                        : 'brightness(105%) contrast(135%)'
                    } ${nitidezHD ? 'drop-shadow(0 0 1px rgba(255,255,255,0.3))' : ''}`,
                    transform: `rotate(${rotacaoAxial}deg) scaleX(${espelharAxial ? -1 : 1})`,
                    imageRendering: nitidezHD ? 'crisp-edges' : 'auto'
                  }}
                />
              ) : null}

              <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full p-4 pointer-events-none">
                {!imagemDicomLoadedUrl && dicomSlicesAxial.length === 0 && (
                  <path
                    d="M 40 160 C 40 60, 160 60, 160 160 C 130 150, 70 150, 40 160 Z"
                    fill="none"
                    stroke={janelaPreset === 'osseo' ? '#94A3B8' : '#CBD5E1'}
                    strokeWidth="14"
                    strokeLinecap="round"
                    opacity="0.85"
                  />
                )}

                {destacarNervoAlveolar && (
                  <path
                    d="M 50 145 C 50 80, 150 80, 150 145"
                    fill="none"
                    stroke="#EF4444"
                    strokeWidth="3"
                    strokeDasharray="4 2"
                  />
                )}

                {crosshairAtivo && (
                  <g>
                    <line x1="0" y1={(fatiaAxial / (totalAxial || 1)) * 200} x2="200" y2={(fatiaAxial / (totalAxial || 1)) * 200} stroke="#38BDF8" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1={(fatiaSagital / (totalSagital || 1)) * 200} y1="0" x2={(fatiaSagital / (totalSagital || 1)) * 200} y2="200" stroke="#F43F5E" strokeWidth="1" strokeDasharray="3 3" />
                  </g>
                )}
              </svg>
            </div>

            <div className="absolute bottom-3 left-3 right-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400">Slice:</span>
              <input
                type="range"
                min="1"
                max={totalAxial}
                value={fatiaAxial}
                onChange={(e) => setFatiaAxial(Number(e.target.value))}
                className="w-full accent-teal-400 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* VIEWPORT 2: CORTE CORONAL (VISTA FRONTAL) */}
        <div className={`p-4 rounded-3xl border shadow-xl space-y-3 ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-xs font-extrabold text-sky-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span> Corte Coronal (Frontal Ortogonal)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRotacaoCoronal((r) => (r + 90) % 360)}
                title="Girar Corte 90°"
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 transition-all cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setEspelharCoronal((f) => !f)}
                title="Espelhar Horizontal"
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 transition-all cursor-pointer"
              >
                <FlipHorizontal className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono font-bold text-slate-400">
                Fat. {fatiaCoronal}/{totalCoronal} ({getSliceCoronalMm(fatiaCoronal)} mm)
              </span>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden bg-black flex items-center justify-center min-h-[300px] border border-slate-800">
            <div className="relative w-full h-[300px] bg-slate-950 flex items-center justify-center overflow-hidden">
              {getSliceCoronalUrl(fatiaCoronal) ? (
                <img
                  src={getSliceCoronalUrl(fatiaCoronal)!}
                  alt={`Corte DICOM Coronal ${fatiaCoronal}`}
                  className="absolute inset-0 w-full h-full object-contain transition-all duration-200"
                  style={{
                    filter: `${
                      janelaPreset === 'dente'
                        ? 'brightness(135%) contrast(175%)'
                        : janelaPreset === 'moles'
                        ? 'brightness(90%) contrast(90%)'
                        : 'brightness(105%) contrast(135%)'
                    } ${nitidezHD ? 'drop-shadow(0 0 1px rgba(255,255,255,0.3))' : ''}`,
                    transform: `rotate(${rotacaoCoronal}deg) scaleX(${espelharCoronal ? -1 : 1})`,
                    imageRendering: nitidezHD ? 'crisp-edges' : 'auto'
                  }}
                />
              ) : null}

              <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full p-4 pointer-events-none">
                {!imagemDicomLoadedUrl && dicomSlicesCoronal.length === 0 && (
                  <>
                    <ellipse cx="100" cy="70" rx="60" ry="30" fill="none" stroke="#64748B" strokeWidth="12" />
                    <ellipse cx="100" cy="140" rx="55" ry="25" fill="none" stroke="#94A3B8" strokeWidth="12" />
                    <ellipse cx="70" cy="75" rx="18" ry="12" fill="#020617" stroke="#475569" strokeWidth="1.5" />
                    <ellipse cx="130" cy="75" rx="18" ry="12" fill="#020617" stroke="#475569" strokeWidth="1.5" />
                  </>
                )}

                {destacarNervoAlveolar && (
                  <g>
                    <circle cx="70" cy="142" r="5" fill="#EF4444" opacity="0.9" />
                    <circle cx="130" cy="142" r="5" fill="#EF4444" opacity="0.9" />
                  </g>
                )}

                {simuladorImplante && (
                  <g>
                    <rect x="64" y="115" width="12" height="24" rx="2" fill="#10B981" opacity="0.85" stroke="#FFFFFF" strokeWidth="1" />
                    <line x1="70" y1="139" x2="70" y2="142" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="2 1" />
                  </g>
                )}

                {crosshairAtivo && (
                  <line x1="0" y1={(fatiaCoronal / (totalCoronal || 1)) * 200} x2="200" y2={(fatiaCoronal / (totalCoronal || 1)) * 200} stroke="#38BDF8" strokeWidth="1" strokeDasharray="3 3" />
                )}
              </svg>
            </div>

            <div className="absolute bottom-3 left-3 right-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400">Slice:</span>
              <input
                type="range"
                min="1"
                max={totalCoronal}
                value={fatiaCoronal}
                onChange={(e) => setFatiaCoronal(Number(e.target.value))}
                className="w-full accent-sky-400 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* VIEWPORT 3: CORTE SAGITAL (VISTA LATERAL / SECCIONAL) */}
        <div className={`p-4 rounded-3xl border shadow-xl space-y-3 ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-xs font-extrabold text-rose-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span> Corte Sagital (Lateral Ortogonal)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRotacaoSagital((r) => (r + 90) % 360)}
                title="Girar Corte 90°"
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400 transition-all cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setEspelharSagital((f) => !f)}
                title="Espelhar Horizontal"
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400 transition-all cursor-pointer"
              >
                <FlipHorizontal className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono font-bold text-slate-400">
                Fat. {fatiaSagital}/{totalSagital} ({getSliceSagitalMm(fatiaSagital)} mm)
              </span>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden bg-black flex items-center justify-center min-h-[300px] border border-slate-800">
            <div className="relative w-full h-[300px] bg-slate-950 flex items-center justify-center overflow-hidden">
              {getSliceSagitalUrl(fatiaSagital) ? (
                <img
                  src={getSliceSagitalUrl(fatiaSagital)!}
                  alt={`Corte DICOM Sagital ${fatiaSagital}`}
                  className="absolute inset-0 w-full h-full object-contain transition-all duration-200"
                  style={{
                    filter: `${
                      janelaPreset === 'dente'
                        ? 'brightness(135%) contrast(175%)'
                        : janelaPreset === 'moles'
                        ? 'brightness(90%) contrast(90%)'
                        : 'brightness(105%) contrast(135%)'
                    } ${nitidezHD ? 'drop-shadow(0 0 1px rgba(255,255,255,0.3))' : ''}`,
                    transform: `rotate(${rotacaoSagital}deg) scaleX(${espelharSagital ? -1 : 1})`,
                    imageRendering: nitidezHD ? 'crisp-edges' : 'auto'
                  }}
                />
              ) : null}

              <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full p-4 pointer-events-none">
                {!imagemDicomLoadedUrl && dicomSlicesSagital.length === 0 && (
                  <path
                    d="M 60 40 Q 140 40, 140 160 Q 80 180, 60 140 Z"
                    fill="none"
                    stroke="#94A3B8"
                    strokeWidth="10"
                  />
                )}

                {destacarNervoAlveolar && (
                  <circle cx="105" cy="140" r="6" fill="#EF4444" stroke="#FCA5A5" strokeWidth="1.5" />
                )}

                {simuladorImplante && (
                  <g>
                    <rect x="98" y="70" width="14" height="40" rx="3" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5" />
                    <rect x="96" y="68" width="18" height="44" rx="4" fill="none" stroke="#F59E0B" strokeWidth="1" strokeDasharray="3 2" />
                  </g>
                )}

                {crosshairAtivo && (
                  <line x1={(fatiaSagital / (totalSagital || 1)) * 200} y1="0" x2={(fatiaSagital / (totalSagital || 1)) * 200} y2="200" stroke="#F43F5E" strokeWidth="1" strokeDasharray="3 3" />
                )}
              </svg>
            </div>

            <div className="absolute bottom-3 left-3 right-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400">Slice:</span>
              <input
                type="range"
                min="1"
                max={totalSagital}
                value={fatiaSagital}
                onChange={(e) => setFatiaSagital(Number(e.target.value))}
                className="w-full accent-rose-400 cursor-pointer"
              />
            </div>
          </div>
        </div>

      </div>

      {/* FERRAMENTAS DE PLANEJAMENTO DE IMPLANTES & NERVOS */}
      <div className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="font-extrabold text-sm flex items-center gap-2 text-emerald-400">
            <Shield className="w-4 h-4 text-emerald-400" /> Planejamento Virtual de Implantes & Segurança Anatômica
          </h3>
          <span className="text-xs text-slate-400 font-bold">Paciente: {pacienteNome}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          
          {/* BOTÃO TOGGLE DE NERVO ALVEOLAR */}
          <button
            onClick={() => setDestacarNervoAlveolar(!destacarNervoAlveolar)}
            className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              destacarNervoAlveolar
                ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <div>
              <span className="font-extrabold text-white block">🔴 Nervo Alveolar Inferior</span>
              <span className="text-[11px] text-slate-400">Destacar trajeto do canal mandibular</span>
            </div>
            <span className="font-mono text-xs font-black">{destacarNervoAlveolar ? 'ATIVO' : 'DESL'}</span>
          </button>

          {/* BOTÃO TOGGLE DE SIMULADOR DE IMPLANTE 3D */}
          <button
            onClick={() => setSimuladorImplante(!simuladorImplante)}
            className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              simuladorImplante
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <div>
              <span className="font-extrabold text-white block">🦷 Cilindro de Implante 3D</span>
              <span className="text-[11px] text-slate-400">Simulação dimensional em cortes MPR</span>
            </div>
            <span className="font-mono text-xs font-black">{simuladorImplante ? 'ATIVO' : 'DESL'}</span>
          </button>

          {/* SELETOR DE TAMANHO DO IMPLANTE */}
          <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 space-y-1.5">
            <span className="font-extrabold text-slate-300 block">Tamanho do Implante</span>
            <select
              value={tamanhoImplante}
              onChange={(e) => setTamanhoImplante(e.target.value)}
              className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 font-extrabold text-emerald-400 text-xs"
            >
              <option value="Ø 3.5mm x 10.0mm">Ø 3.5mm x 10.0mm (Estreito)</option>
              <option value="Ø 3.75mm x 11.5mm">Ø 3.75mm x 11.5mm (Padrão)</option>
              <option value="Ø 4.0mm x 11.5mm">Ø 4.0mm x 11.5mm (Padrão Mandíbula)</option>
              <option value="Ø 4.3mm x 13.0mm">Ø 4.3mm x 13.0mm (Largo)</option>
              <option value="Ø 5.0mm x 10.0mm">Ø 5.0mm x 10.0mm (Molar)</option>
            </select>
          </div>

        </div>
      </div>
    </div>
  );
};

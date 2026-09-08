import React, { useState, useRef } from 'react';
import {
  Box,
  Shield,
  RefreshCw,
  FileCheck,
  FolderOpen,
  RotateCw,
  FlipHorizontal,
  Sparkles,
  Maximize2,
  X,
  ZoomIn,
  ZoomOut,
  Sun,
  Sliders,
  ArrowUpRight,
  Square,
  Circle,
  Ruler,
  Trash2,
  MousePointer,
  RotateCcw
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

interface AnotacaoDicom {
  id: string;
  tipo: 'seta' | 'retangulo' | 'circulo' | 'regua';
  corte: 'axial' | 'coronal' | 'sagital';
  fatia: number;
  x1: number; // Porcentagem (0..100)
  y1: number; // Porcentagem (0..100)
  x2: number; // Porcentagem (0..100)
  y2: number; // Porcentagem (0..100)
  cor: string;
  medidaMm?: string;
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

  // Novos Estados: Brilho e Contraste em Tempo Real
  const [brilho, setBrilho] = useState<number>(100); // 30% a 200%
  const [contraste, setContraste] = useState<number>(100); // 30% a 250%

  // Estado de Visualização em Tamanho Real HD (Fullscreen Modal Zoom)
  const [corteExpandido, setCorteExpandido] = useState<'axial' | 'coronal' | 'sagital' | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Ferramentas da Tela Ampliada (Seta, Retângulo, Círculo, Régua)
  const [ferramentaModal, setFerramentaModal] = useState<'moverse' | 'rotacionar' | 'seta' | 'retangulo' | 'circulo' | 'regua'>('moverse');
  const [corAnotacao, setCorAnotacao] = useState<string>('#38BDF8'); // Azul Sky padrão
  const [anotacoes, setAnotacoes] = useState<AnotacaoDicom[]>([]);
  const [anotacaoDesenhando, setAnotacaoDesenhando] = useState<AnotacaoDicom | null>(null);

  // Estado de Arraste do Mouse para Rotação Fluida
  const [dragState, setDragState] = useState<{
    plano: 'axial' | 'coronal' | 'sagital' | 'modal';
    startX: number;
    startY: number;
    startAngle: number;
    hasMoved: boolean;
  } | null>(null);

  // Presets de Janelamento DICOM (Window Width / Window Level)
  const [janelaPreset, setJanelaPreset] = useState<'osseo' | 'dente' | 'moles'>('osseo');
  const [crosshairAtivo, setCrosshairAtivo] = useState<boolean>(false);
  const [destacarNervoAlveolar, setDestacarNervoAlveolar] = useState<boolean>(false);
  const [simuladorImplante, setSimuladorImplante] = useState<boolean>(false);
  const [tamanhoImplante, setTamanhoImplante] = useState<string>('Ø 4.0mm x 11.5mm');

  // Serie de Fatias Tomograficas DICOM por Plano Ortogonal (.dcm)
  const [dicomSlicesAxial, setDicomSlicesAxial] = useState<DicomSliceData[]>([]);
  const [dicomSlicesCoronal, setDicomSlicesCoronal] = useState<DicomSliceData[]>([]);
  const [dicomSlicesSagital, setDicomSlicesSagital] = useState<DicomSliceData[]>([]);
  const [nomeArquivoDicom, setNomeArquivoDicom] = useState<string>('Tomografia_ConeBeam_Mandibula.dcm');
  const [imagemDicomLoadedUrl, setImagemDicomLoadedUrl] = useState<string | null>(null);
  const [carregandoDicom, setCarregandoDicom] = useState<boolean>(false);
  const [dicomMeta, setDicomMeta] = useState<ParsedDicomResult['meta'] | null>(null);

  const modalCanvasRef = useRef<HTMLDivElement>(null);

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

  // --- CONTROLE DE ROTAÇÃO E CLIQUE POR MOUSE (BOTÃO ESQUERDO) ---
  const handleMouseDownViewport = (e: React.MouseEvent, plano: 'axial' | 'coronal' | 'sagital') => {
    if (e.button !== 0) return; // Apenas botão esquerdo do mouse
    const currentAngle = plano === 'axial' ? rotacaoAxial : plano === 'coronal' ? rotacaoCoronal : rotacaoSagital;
    setDragState({
      plano,
      startX: e.clientX,
      startY: e.clientY,
      startAngle: currentAngle,
      hasMoved: false
    });
  };

  const handleMouseMoveGlobal = (e: React.MouseEvent) => {
    if (!dragState) return;
    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 4) {
      setDragState((prev) => (prev ? { ...prev, hasMoved: true } : null));
      const deltaAngle = Math.round(dx * 0.8); // Sensibilidade de rotação
      let newAngle = (dragState.startAngle + deltaAngle) % 360;
      if (newAngle < 0) newAngle += 360;

      if (dragState.plano === 'axial') setRotacaoAxial(newAngle);
      else if (dragState.plano === 'coronal') setRotacaoCoronal(newAngle);
      else if (dragState.plano === 'sagital') setRotacaoSagital(newAngle);
      else if (dragState.plano === 'modal' && corteExpandido) {
        if (corteExpandido === 'axial') setRotacaoAxial(newAngle);
        else if (corteExpandido === 'coronal') setRotacaoCoronal(newAngle);
        else setRotacaoSagital(newAngle);
      }
    }
  };

  const handleMouseUpViewport = (plano: 'axial' | 'coronal' | 'sagital') => {
    if (dragState && dragState.plano === plano && !dragState.hasMoved) {
      // Clique simples na imagem -> Expandir para tela cheia HD!
      setZoomLevel(100);
      setCorteExpandido(plano);
    }
    setDragState(null);
  };

  // --- DESENHO DE ANOTAÇÕES NA TELA AMPLIADA (SVG OVERLAY) ---
  const handleModalMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (ferramentaModal === 'rotacionar') {
      if (e.button !== 0 || !corteExpandido) return;
      const currentAngle = corteExpandido === 'axial' ? rotacaoAxial : corteExpandido === 'coronal' ? rotacaoCoronal : rotacaoSagital;
      setDragState({
        plano: 'modal',
        startX: e.clientX,
        startY: e.clientY,
        startAngle: currentAngle,
        hasMoved: false
      });
      return;
    }

    if (ferramentaModal === 'moverse' || !modalCanvasRef.current || !corteExpandido) return;
    if (e.button !== 0) return;

    const rect = modalCanvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const fatiaAtual = corteExpandido === 'axial' ? fatiaAxial : corteExpandido === 'coronal' ? fatiaCoronal : fatiaSagital;

    setAnotacaoDesenhando({
      id: Date.now().toString(),
      tipo: ferramentaModal as 'seta' | 'retangulo' | 'circulo' | 'regua',
      corte: corteExpandido,
      fatia: fatiaAtual,
      x1: x,
      y1: y,
      x2: x,
      y2: y,
      cor: corAnotacao,
      medidaMm: ferramentaModal === 'regua' ? '0.0 mm' : undefined
    });
  };

  const handleModalMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragState) {
      handleMouseMoveGlobal(e);
      return;
    }

    if (!anotacaoDesenhando || !modalCanvasRef.current) return;

    const rect = modalCanvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    let medidaMm: string | undefined = undefined;
    if (anotacaoDesenhando.tipo === 'regua') {
      const dxPx = ((x - anotacaoDesenhando.x1) / 100) * rect.width;
      const dyPx = ((y - anotacaoDesenhando.y1) / 100) * rect.height;
      const distPx = Math.sqrt(dxPx * dxPx + dyPx * dyPx);
      // Calibração métrica estimada: 100% da viewport = FOV ~160mm
      const distMm = (distPx * (160 / Math.max(rect.width, rect.height))).toFixed(1);
      medidaMm = `${distMm} mm`;
    }

    setAnotacaoDesenhando({
      ...anotacaoDesenhando,
      x2: x,
      y2: y,
      medidaMm
    });
  };

  const handleModalMouseUp = () => {
    if (dragState) {
      setDragState(null);
      return;
    }

    if (anotacaoDesenhando) {
      setAnotacoes((prev) => [...prev, anotacaoDesenhando]);
      setAnotacaoDesenhando(null);
    }
  };

  const limparAnotacoesCorteAtual = () => {
    if (!corteExpandido) return;
    const fatiaAtual = corteExpandido === 'axial' ? fatiaAxial : corteExpandido === 'coronal' ? fatiaCoronal : fatiaSagital;
    setAnotacoes((prev) => prev.filter((a) => !(a.corte === corteExpandido && a.fatia === fatiaAtual)));
  };

  const desfazerUltimaAnotacao = () => {
    setAnotacoes((prev) => prev.slice(0, -1));
  };

  const resetarFiltrosEImagem = () => {
    setBrilho(100);
    setContraste(100);
    setRotacaoAxial(0);
    setRotacaoCoronal(0);
    setRotacaoSagital(0);
    setEspelharAxial(false);
    setEspelharCoronal(false);
    setEspelharSagital(false);
  };

  // Filtro de imagem CSS dinâmico incluindo Preset + Brilho/Contraste personalizados
  const getFilterCSS = () => {
    let presetB = 100;
    let presetC = 100;
    if (janelaPreset === 'dente') {
      presetB = 135;
      presetC = 175;
    } else if (janelaPreset === 'moles') {
      presetB = 90;
      presetC = 90;
    } else {
      presetB = 105;
      presetC = 135;
    }
    const finalB = Math.round((presetB * brilho) / 100);
    const finalC = Math.round((presetC * contraste) / 100);
    return `brightness(${finalB}%) contrast(${finalC}%) ${nitidezHD ? 'drop-shadow(0 0 1px rgba(255,255,255,0.3))' : ''}`;
  };

  return (
    <div className="space-y-4 select-none" onMouseMove={handleMouseMoveGlobal} onMouseUp={() => setDragState(null)}>
      {/* TOOLBAR SUPERIOR DO VISUALIZADOR DICOM CBCT */}
      <div className={`p-3 rounded-2xl border shadow-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-indigo-500/10 px-2.5 py-1 rounded-xl border border-indigo-500/30">
            <Box className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[11px] font-mono font-extrabold text-indigo-300 truncate max-w-[200px]">{nomeArquivoDicom}</span>
          </div>

          <label className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white text-[11px] font-extrabold cursor-pointer shadow-md shadow-teal-500/20 flex items-center gap-1.5 transition-all">
            <FolderOpen className="w-3.5 h-3.5" /> Selecionar Cortes DICOM (.dcm)
            <input type="file" multiple accept=".dcm,.dicom,.zip,image/*" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={() => setNitidezHD(!nitidezHD)}
            className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              nitidezHD
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Nitidez HD: {nitidezHD ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={() => setCrosshairAtivo(!crosshairAtivo)}
            className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-extrabold transition-all cursor-pointer ${
              crosshairAtivo
                ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            🎯 Mira (Crosshair): {crosshairAtivo ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* CONTROLES DE BRILHO, CONTRASTE E JANELAMENTO ÓSSEO */}
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          {/* SLIDER BRILHO */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-2 py-1 rounded-xl border border-slate-700">
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] font-bold text-slate-300">Brilho:</span>
            <input
              type="range"
              min="30"
              max="200"
              value={brilho}
              onChange={(e) => setBrilho(Number(e.target.value))}
              className="w-16 h-1 bg-slate-700 accent-amber-400 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] font-mono font-bold text-amber-300 w-8 text-right">{brilho}%</span>
          </div>

          {/* SLIDER CONTRASTE */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-2 py-1 rounded-xl border border-slate-700">
            <Sliders className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-[10px] font-bold text-slate-300">Contraste:</span>
            <input
              type="range"
              min="30"
              max="250"
              value={contraste}
              onChange={(e) => setContraste(Number(e.target.value))}
              className="w-16 h-1 bg-slate-700 accent-sky-400 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] font-mono font-bold text-sky-300 w-8 text-right">{contraste}%</span>
          </div>

          <button
            onClick={resetarFiltrosEImagem}
            title="Redefinir Imagem, Brilho e Rotações"
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer flex items-center gap-1 text-[10px] font-extrabold"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>

          {/* PRESETS DE JANELAMENTO ÓSSEO / DENTAL */}
          <div className="flex items-center gap-1">
            {(['osseo', 'dente', 'moles'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setJanelaPreset(p)}
                className={`px-2 py-1 rounded-lg font-extrabold border transition-all cursor-pointer uppercase text-[9px] ${
                  janelaPreset === p
                    ? 'bg-teal-600 text-white border-teal-400 shadow'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                {p === 'osseo' ? 'Ósseo' : p === 'dente' ? 'Dente' : 'Moles'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* BANNER DE METADADOS DICOM DA SÉRIE DE CORTES */}
      {dicomMeta && (
        <div className="p-2.5 rounded-xl bg-slate-900 border border-teal-500/40 flex flex-wrap items-center justify-between text-[11px] text-slate-300 gap-2">
          <div className="flex items-center gap-2">
            <FileCheck className="w-3.5 h-3.5 text-teal-400" />
            <span className="font-extrabold text-white">Série Tomográfica DICOM HD (MPR 3D):</span>
            <span className="font-mono text-teal-300">
              {dicomSlicesAxial.length > 0 ? `${dicomSlicesAxial.length} Axiais | ${dicomSlicesCoronal.length} Coronais | ${dicomSlicesSagital.length} Sagitais` : 'Volume Carregado'} | {dicomMeta.fileName}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono">
            <span>Espaçamento: <strong className="text-teal-400">{espacamentoMm} mm</strong></span>
            <span>Modalidade: <strong className="text-teal-400">{dicomMeta.modality}</strong></span>
            <span>Resolução: <strong className="text-teal-400">{dicomMeta.columns}x{dicomMeta.rows}</strong></span>
            <span>Paciente: <strong className="text-white">{dicomMeta.patientName}</strong></span>
          </div>
        </div>
      )}

      {carregandoDicom && (
        <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center gap-2 text-indigo-300 text-[11px] font-extrabold animate-pulse">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processando reconstrução 3D MPR (Axial, Coronal e Sagital)...
        </div>
      )}

      {/* PAINEL CENTRAL MULTIPLANAR RECONSTRUCTION (MPR 3-VIEWPORTS HD) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">

        {/* VIEWPORT 1: CORTE AXIAL (VISTA SUPERIOR) */}
        <div className={`p-3 rounded-2xl border shadow-lg space-y-2 ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
            <span className="text-[11px] font-extrabold text-teal-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-400"></span> Corte Axial (Superior)
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded bg-slate-800 text-teal-300 border border-slate-700">
                {rotacaoAxial}°
              </span>
              <button
                onClick={() => setRotacaoAxial((r) => (r + 90) % 360)}
                title="Girar Corte 90°"
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-400 transition-all cursor-pointer"
              >
                <RotateCw className="w-3 h-3" />
              </button>
              <button
                onClick={() => setEspelharAxial((f) => !f)}
                title="Espelhar Horizontal"
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-400 transition-all cursor-pointer"
              >
                <FlipHorizontal className="w-3 h-3" />
              </button>
              <button
                onClick={() => { setZoomLevel(100); setCorteExpandido('axial'); }}
                title="Ampliar Corte HD"
                className="p-0.5 px-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/40 text-teal-300 transition-all cursor-pointer flex items-center gap-1 text-[9px] font-extrabold"
              >
                <Maximize2 className="w-3 h-3" /> Ampliar
              </button>
              <span className="text-[9px] font-mono font-bold text-slate-400">
                {fatiaAxial}/{totalAxial} ({getSliceAxialMm(fatiaAxial)}mm)
              </span>
            </div>
          </div>

          <div
            onMouseDown={(e) => handleMouseDownViewport(e, 'axial')}
            onMouseUp={() => handleMouseUpViewport('axial')}
            className="relative rounded-xl overflow-hidden bg-black flex items-center justify-center min-h-[350px] h-[350px] border border-slate-800 cursor-grab active:cursor-grabbing group"
            title="Clique e arraste com o botão esquerdo para GIRAR a imagem | Clique simples para AMPLIAR"
          >
            <div className="relative w-full h-[350px] bg-slate-950 flex items-center justify-center overflow-hidden">
              {getSliceAxialUrl(fatiaAxial) ? (
                <img
                  src={getSliceAxialUrl(fatiaAxial)!}
                  alt={`Corte DICOM Axial ${fatiaAxial}`}
                  className="absolute inset-0 w-full h-full object-contain transition-transform duration-75"
                  style={{
                    filter: getFilterCSS(),
                    transform: `rotate(${rotacaoAxial}deg) scaleX(${espelharAxial ? -1 : 1})`,
                    imageRendering: nitidezHD ? 'crisp-edges' : 'auto'
                  }}
                />
              ) : null}

              <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full p-4 pointer-events-none">
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

            <div className="absolute bottom-2 left-2 right-2 bg-slate-900/80 backdrop-blur-md px-2 py-1 rounded-lg border border-slate-800 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <span className="text-[9px] font-mono text-slate-400">Slice:</span>
              <input
                type="range"
                min="1"
                max={totalAxial}
                value={fatiaAxial}
                onChange={(e) => setFatiaAxial(Number(e.target.value))}
                className="w-full accent-teal-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* VIEWPORT 2: CORTE CORONAL (VISTA FRONTAL) */}
        <div className={`p-3 rounded-2xl border shadow-lg space-y-2 ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
            <span className="text-[11px] font-extrabold text-sky-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400"></span> Corte Coronal (Frontal)
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded bg-slate-800 text-sky-300 border border-slate-700">
                {rotacaoCoronal}°
              </span>
              <button
                onClick={() => setRotacaoCoronal((r) => (r + 90) % 360)}
                title="Girar Corte 90°"
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 transition-all cursor-pointer"
              >
                <RotateCw className="w-3 h-3" />
              </button>
              <button
                onClick={() => setEspelharCoronal((f) => !f)}
                title="Espelhar Horizontal"
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 transition-all cursor-pointer"
              >
                <FlipHorizontal className="w-3 h-3" />
              </button>
              <button
                onClick={() => { setZoomLevel(100); setCorteExpandido('coronal'); }}
                title="Ampliar Corte HD"
                className="p-0.5 px-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/40 text-sky-300 transition-all cursor-pointer flex items-center gap-1 text-[9px] font-extrabold"
              >
                <Maximize2 className="w-3 h-3" /> Ampliar
              </button>
              <span className="text-[9px] font-mono font-bold text-slate-400">
                {fatiaCoronal}/{totalCoronal} ({getSliceCoronalMm(fatiaCoronal)}mm)
              </span>
            </div>
          </div>

          <div
            onMouseDown={(e) => handleMouseDownViewport(e, 'coronal')}
            onMouseUp={() => handleMouseUpViewport('coronal')}
            className="relative rounded-xl overflow-hidden bg-black flex items-center justify-center min-h-[350px] h-[350px] border border-slate-800 cursor-grab active:cursor-grabbing group"
            title="Clique e arraste com o botão esquerdo para GIRAR a imagem | Clique simples para AMPLIAR"
          >
            <div className="relative w-full h-[350px] bg-slate-950 flex items-center justify-center overflow-hidden">
              {getSliceCoronalUrl(fatiaCoronal) ? (
                <img
                  src={getSliceCoronalUrl(fatiaCoronal)!}
                  alt={`Corte DICOM Coronal ${fatiaCoronal}`}
                  className="absolute inset-0 w-full h-full object-contain transition-transform duration-75"
                  style={{
                    filter: getFilterCSS(),
                    transform: `rotate(${rotacaoCoronal}deg) scaleX(${espelharCoronal ? -1 : 1})`,
                    imageRendering: nitidezHD ? 'crisp-edges' : 'auto'
                  }}
                />
              ) : null}

              <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full p-4 pointer-events-none">
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

            <div className="absolute bottom-2 left-2 right-2 bg-slate-900/80 backdrop-blur-md px-2 py-1 rounded-lg border border-slate-800 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <span className="text-[9px] font-mono text-slate-400">Slice:</span>
              <input
                type="range"
                min="1"
                max={totalCoronal}
                value={fatiaCoronal}
                onChange={(e) => setFatiaCoronal(Number(e.target.value))}
                className="w-full accent-sky-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* VIEWPORT 3: CORTE SAGITAL (VISTA LATERAL / SECCIONAL) */}
        <div className={`p-3 rounded-2xl border shadow-lg space-y-2 ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
            <span className="text-[11px] font-extrabold text-rose-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span> Corte Sagital (Lateral)
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded bg-slate-800 text-rose-300 border border-slate-700">
                {rotacaoSagital}°
              </span>
              <button
                onClick={() => setRotacaoSagital((r) => (r + 90) % 360)}
                title="Girar Corte 90°"
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400 transition-all cursor-pointer"
              >
                <RotateCw className="w-3 h-3" />
              </button>
              <button
                onClick={() => setEspelharSagital((f) => !f)}
                title="Espelhar Horizontal"
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400 transition-all cursor-pointer"
              >
                <FlipHorizontal className="w-3 h-3" />
              </button>
              <button
                onClick={() => { setZoomLevel(100); setCorteExpandido('sagital'); }}
                title="Ampliar Corte HD"
                className="p-0.5 px-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 transition-all cursor-pointer flex items-center gap-1 text-[9px] font-extrabold"
              >
                <Maximize2 className="w-3 h-3" /> Ampliar
              </button>
              <span className="text-[9px] font-mono font-bold text-slate-400">
                {fatiaSagital}/{totalSagital} ({getSliceSagitalMm(fatiaSagital)}mm)
              </span>
            </div>
          </div>

          <div
            onMouseDown={(e) => handleMouseDownViewport(e, 'sagital')}
            onMouseUp={() => handleMouseUpViewport('sagital')}
            className="relative rounded-xl overflow-hidden bg-black flex items-center justify-center min-h-[350px] h-[350px] border border-slate-800 cursor-grab active:cursor-grabbing group"
            title="Clique e arraste com o botão esquerdo para GIRAR a imagem | Clique simples para AMPLIAR"
          >
            <div className="relative w-full h-[350px] bg-slate-950 flex items-center justify-center overflow-hidden">
              {getSliceSagitalUrl(fatiaSagital) ? (
                <img
                  src={getSliceSagitalUrl(fatiaSagital)!}
                  alt={`Corte DICOM Sagital ${fatiaSagital}`}
                  className="absolute inset-0 w-full h-full object-contain transition-transform duration-75"
                  style={{
                    filter: getFilterCSS(),
                    transform: `rotate(${rotacaoSagital}deg) scaleX(${espelharSagital ? -1 : 1})`,
                    imageRendering: nitidezHD ? 'crisp-edges' : 'auto'
                  }}
                />
              ) : null}

              <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full p-4 pointer-events-none">
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

            <div className="absolute bottom-2 left-2 right-2 bg-slate-900/80 backdrop-blur-md px-2 py-1 rounded-lg border border-slate-800 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <span className="text-[9px] font-mono text-slate-400">Slice:</span>
              <input
                type="range"
                min="1"
                max={totalSagital}
                value={fatiaSagital}
                onChange={(e) => setFatiaSagital(Number(e.target.value))}
                className="w-full accent-rose-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>
          </div>
        </div>

      </div>

      {/* MODAL DE VISUALIZAÇÃO EM TAMANHO REAL HD E ESTUDO COM ANOTAÇÕES */}
      {corteExpandido && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl p-3 md:p-5 flex flex-col justify-between overflow-hidden">
          {/* BARRA SUPERIOR DO MODAL FULLSCREEN */}
          <div className="flex flex-wrap justify-between items-center bg-slate-900 border border-slate-800 p-3 rounded-2xl gap-3">
            <div className="flex items-center gap-2.5">
              <span className={`w-3 h-3 rounded-full ${
                corteExpandido === 'axial' ? 'bg-teal-400' : corteExpandido === 'coronal' ? 'bg-sky-400' : 'bg-rose-400'
              }`}></span>
              <div>
                <h2 className="text-xs font-black text-white flex items-center gap-2">
                  Corte {corteExpandido === 'axial' ? 'Axial (Superior)' : corteExpandido === 'coronal' ? 'Coronal (Frontal)' : 'Sagital (Lateral)'} — Tela Ampliada de Estudo
                </h2>
                <p className="text-[11px] font-mono text-slate-400">
                  Fatia {
                    corteExpandido === 'axial' ? fatiaAxial : corteExpandido === 'coronal' ? fatiaCoronal : fatiaSagital
                  }/{
                    corteExpandido === 'axial' ? totalAxial : corteExpandido === 'coronal' ? totalCoronal : totalSagital
                  } ({
                    corteExpandido === 'axial' ? getSliceAxialMm(fatiaAxial) : corteExpandido === 'coronal' ? getSliceCoronalMm(fatiaCoronal) : getSliceSagitalMm(fatiaSagital)
                  } mm) | Rotação: {
                    corteExpandido === 'axial' ? rotacaoAxial : corteExpandido === 'coronal' ? rotacaoCoronal : rotacaoSagital
                  }°
                </p>
              </div>
            </div>

            {/* SELETOR DE FERRAMENTAS DE ANOTAÇÃO (SETA, RETÂNGULO, CÍRCULO, RÉGUA) */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase px-1">Ferramentas:</span>
              
              <button
                onClick={() => setFerramentaModal('moverse')}
                className={`p-1.5 px-2 rounded-lg text-[11px] font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                  ferramentaModal === 'moverse' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Ponteiro / Mover"
              >
                <MousePointer className="w-3.5 h-3.5" /> Mover
              </button>

              <button
                onClick={() => setFerramentaModal('rotacionar')}
                className={`p-1.5 px-2 rounded-lg text-[11px] font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                  ferramentaModal === 'rotacionar' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Girar Imagem por Arraste"
              >
                <RotateCw className="w-3.5 h-3.5" /> Girar
              </button>

              <button
                onClick={() => setFerramentaModal('seta')}
                className={`p-1.5 px-2 rounded-lg text-[11px] font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                  ferramentaModal === 'seta' ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Desenhar Seta Indicativa"
              >
                <ArrowUpRight className="w-3.5 h-3.5" /> Seta
              </button>

              <button
                onClick={() => setFerramentaModal('retangulo')}
                className={`p-1.5 px-2 rounded-lg text-[11px] font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                  ferramentaModal === 'retangulo' ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Desenhar Retângulo ROI"
              >
                <Square className="w-3.5 h-3.5" /> Retângulo
              </button>

              <button
                onClick={() => setFerramentaModal('circulo')}
                className={`p-1.5 px-2 rounded-lg text-[11px] font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                  ferramentaModal === 'circulo' ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Desenhar Círculo ROI"
              >
                <Circle className="w-3.5 h-3.5" /> Círculo
              </button>

              <button
                onClick={() => setFerramentaModal('regua')}
                className={`p-1.5 px-2 rounded-lg text-[11px] font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                  ferramentaModal === 'regua' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Medição Milimétrica (Régua mm)"
              >
                <Ruler className="w-3.5 h-3.5" /> Régua (mm)
              </button>

              {/* SELETOR DE COR DA FERRAMENTA */}
              <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
                {['#38BDF8', '#EF4444', '#F59E0B', '#10B981', '#FFFFFF'].map((cor) => (
                  <button
                    key={cor}
                    onClick={() => setCorAnotacao(cor)}
                    className={`w-4 h-4 rounded-full border transition-all cursor-pointer ${
                      corAnotacao === cor ? 'border-white scale-125 shadow-lg' : 'border-transparent opacity-70'
                    }`}
                    style={{ backgroundColor: cor }}
                  />
                ))}
              </div>

              {/* ACOES DE ANOTACAO */}
              <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
                <button
                  onClick={desfazerUltimaAnotacao}
                  title="Desfazer Último Desenho"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={limparAnotacoesCorteAtual}
                  title="Limpar Anotações desta Fatia"
                  className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {/* CONTROLES DE ZOOM NATIVO */}
              <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700">
                <button
                  onClick={() => setZoomLevel(z => Math.max(50, z - 25))}
                  className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-all cursor-pointer"
                  title="Diminuir Zoom"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono font-extrabold px-1.5 text-teal-400">{zoomLevel}%</span>
                <button
                  onClick={() => setZoomLevel(z => Math.min(300, z + 25))}
                  className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-all cursor-pointer"
                  title="Aumentar Zoom"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel(100)}
                  className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-[11px] font-extrabold text-slate-200 transition-all cursor-pointer"
                >
                  100% (1:1)
                </button>
              </div>

              <button
                onClick={() => setCorteExpandido(null)}
                className="p-2 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/30 transition-all cursor-pointer flex items-center gap-1.5 font-extrabold text-[11px]"
              >
                <X className="w-3.5 h-3.5" /> Fechar
              </button>
            </div>
          </div>

          {/* VIEWPORT EM TAMANHO REAL HD COM CAMADA DE ANOTAÇÃO SVG */}
          <div className="flex-1 my-3 bg-black rounded-2xl border border-slate-800 relative flex items-center justify-center overflow-hidden p-3">
            <div
              ref={modalCanvasRef}
              onMouseDown={handleModalMouseDown}
              onMouseMove={handleModalMouseMove}
              onMouseUp={handleModalMouseUp}
              className={`relative transition-all duration-200 flex items-center justify-center max-w-full max-h-full ${
                ferramentaModal === 'rotacionar'
                  ? 'cursor-grab active:cursor-grabbing'
                  : ferramentaModal !== 'moverse'
                  ? 'cursor-crosshair'
                  : 'cursor-default'
              }`}
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center center' }}
            >
              {(() => {
                const url = corteExpandido === 'axial' ? getSliceAxialUrl(fatiaAxial) : corteExpandido === 'coronal' ? getSliceCoronalUrl(fatiaCoronal) : getSliceSagitalUrl(fatiaSagital);
                const rot = corteExpandido === 'axial' ? rotacaoAxial : corteExpandido === 'coronal' ? rotacaoCoronal : rotacaoSagital;
                const esp = corteExpandido === 'axial' ? espelharAxial : corteExpandido === 'coronal' ? espelharCoronal : espelharSagital;

                return url ? (
                  <img
                    src={url}
                    alt={`Corte DICOM HD Tamanho Real ${corteExpandido}`}
                    className="rounded-xl shadow-2xl transition-transform duration-75 max-w-[80vh] max-h-[80vh] object-contain pointer-events-none"
                    style={{
                      filter: getFilterCSS(),
                      transform: `rotate(${rot}deg) scaleX(${esp ? -1 : 1})`,
                      imageRendering: nitidezHD ? 'crisp-edges' : 'auto'
                    }}
                  />
                ) : null;
              })()}

              {/* OVERLAY SVG PARA RENDERIZAR ANOTAÇÕES DA FATIA ATUAL */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3.5, 0 7" fill={corAnotacao} />
                  </marker>
                </defs>

                {/* Renderizar Anotações Salvas */}
                {anotacoes
                  .filter((a) => a.corte === corteExpandido && a.fatia === (
                    corteExpandido === 'axial' ? fatiaAxial : corteExpandido === 'coronal' ? fatiaCoronal : fatiaSagital
                  ))
                  .map((a) => (
                    <g key={a.id}>
                      {a.tipo === 'seta' && (
                        <line
                          x1={`${a.x1}%`}
                          y1={`${a.y1}%`}
                          x2={`${a.x2}%`}
                          y2={`${a.y2}%`}
                          stroke={a.cor}
                          strokeWidth="2.5"
                          markerEnd="url(#arrowhead)"
                        />
                      )}

                      {a.tipo === 'retangulo' && (
                        <rect
                          x={`${Math.min(a.x1, a.x2)}%`}
                          y={`${Math.min(a.y1, a.y2)}%`}
                          width={`${Math.abs(a.x2 - a.x1)}%`}
                          height={`${Math.abs(a.y2 - a.y1)}%`}
                          fill="none"
                          stroke={a.cor}
                          strokeWidth="2.5"
                          strokeDasharray="4 2"
                        />
                      )}

                      {a.tipo === 'circulo' && (
                        <ellipse
                          cx={`${(a.x1 + a.x2) / 2}%`}
                          cy={`${(a.y1 + a.y2) / 2}%`}
                          rx={`${Math.abs(a.x2 - a.x1) / 2}%`}
                          ry={`${Math.abs(a.y2 - a.y1) / 2}%`}
                          fill="none"
                          stroke={a.cor}
                          strokeWidth="2.5"
                        />
                      )}

                      {a.tipo === 'regua' && (
                        <g>
                          <line
                            x1={`${a.x1}%`}
                            y1={`${a.y1}%`}
                            x2={`${a.x2}%`}
                            y2={`${a.y2}%`}
                            stroke={a.cor}
                            strokeWidth="2.5"
                          />
                          <circle cx={`${a.x1}%`} cy={`${a.y1}%`} r="4" fill={a.cor} />
                          <circle cx={`${a.x2}%`} cy={`${a.y2}%`} r="4" fill={a.cor} />
                          {a.medidaMm && (
                            <text
                              x={`${(a.x1 + a.x2) / 2}%`}
                              y={`${(a.y1 + a.y2) / 2 - 2}%`}
                              fill="#FFFFFF"
                              fontSize="12"
                              fontWeight="bold"
                              textAnchor="middle"
                              className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] font-mono"
                            >
                              {a.medidaMm}
                            </text>
                          )}
                        </g>
                      )}
                    </g>
                  ))}

                {/* Renderizar Anotação Sendo Desenhada em Tempo Real */}
                {anotacaoDesenhando && (
                  <g>
                    {anotacaoDesenhando.tipo === 'seta' && (
                      <line
                        x1={`${anotacaoDesenhando.x1}%`}
                        y1={`${anotacaoDesenhando.y1}%`}
                        x2={`${anotacaoDesenhando.x2}%`}
                        y2={`${anotacaoDesenhando.y2}%`}
                        stroke={anotacaoDesenhando.cor}
                        strokeWidth="2.5"
                        markerEnd="url(#arrowhead)"
                      />
                    )}

                    {anotacaoDesenhando.tipo === 'retangulo' && (
                      <rect
                        x={`${Math.min(anotacaoDesenhando.x1, anotacaoDesenhando.x2)}%`}
                        y={`${Math.min(anotacaoDesenhando.y1, anotacaoDesenhando.y2)}%`}
                        width={`${Math.abs(anotacaoDesenhando.x2 - anotacaoDesenhando.x1)}%`}
                        height={`${Math.abs(anotacaoDesenhando.y2 - anotacaoDesenhando.y1)}%`}
                        fill="none"
                        stroke={anotacaoDesenhando.cor}
                        strokeWidth="2.5"
                        strokeDasharray="4 2"
                      />
                    )}

                    {anotacaoDesenhando.tipo === 'circulo' && (
                      <ellipse
                        cx={`${(anotacaoDesenhando.x1 + anotacaoDesenhando.x2) / 2}%`}
                        cy={`${(anotacaoDesenhando.y1 + anotacaoDesenhando.y2) / 2}%`}
                        rx={`${Math.abs(anotacaoDesenhando.x2 - anotacaoDesenhando.x1) / 2}%`}
                        ry={`${Math.abs(anotacaoDesenhando.y2 - anotacaoDesenhando.y1) / 2}%`}
                        fill="none"
                        stroke={anotacaoDesenhando.cor}
                        strokeWidth="2.5"
                      />
                    )}

                    {anotacaoDesenhando.tipo === 'regua' && (
                      <g>
                        <line
                          x1={`${anotacaoDesenhando.x1}%`}
                          y1={`${anotacaoDesenhando.y1}%`}
                          x2={`${anotacaoDesenhando.x2}%`}
                          y2={`${anotacaoDesenhando.y2}%`}
                          stroke={anotacaoDesenhando.cor}
                          strokeWidth="2.5"
                        />
                        <circle cx={`${anotacaoDesenhando.x1}%`} cy={`${anotacaoDesenhando.y1}%`} r="4" fill={anotacaoDesenhando.cor} />
                        <circle cx={`${anotacaoDesenhando.x2}%`} cy={`${anotacaoDesenhando.y2}%`} r="4" fill={anotacaoDesenhando.cor} />
                        {anotacaoDesenhando.medidaMm && (
                          <text
                            x={`${(anotacaoDesenhando.x1 + anotacaoDesenhando.x2) / 2}%`}
                            y={`${(anotacaoDesenhando.y1 + anotacaoDesenhando.y2) / 2 - 2}%`}
                            fill="#FFFFFF"
                            fontSize="12"
                            fontWeight="bold"
                            textAnchor="middle"
                            className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] font-mono"
                          >
                            {anotacaoDesenhando.medidaMm}
                          </text>
                        )}
                      </g>
                    )}
                  </g>
                )}
              </svg>
            </div>
          </div>

          {/* SLIDER DE FATIA EM TAMANHO REAL */}
          <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex items-center gap-3">
            <span className="text-[11px] font-mono font-bold text-slate-300 min-w-[120px]">
              Slice {
                corteExpandido === 'axial' ? fatiaAxial : corteExpandido === 'coronal' ? fatiaCoronal : fatiaSagital
              } / {
                corteExpandido === 'axial' ? totalAxial : corteExpandido === 'coronal' ? totalCoronal : totalSagital
              }:
            </span>
            <input
              type="range"
              min="1"
              max={corteExpandido === 'axial' ? totalAxial : corteExpandido === 'coronal' ? totalCoronal : totalSagital}
              value={corteExpandido === 'axial' ? fatiaAxial : corteExpandido === 'coronal' ? fatiaCoronal : fatiaSagital}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (corteExpandido === 'axial') setFatiaAxial(val);
                else if (corteExpandido === 'coronal') setFatiaCoronal(val);
                else setFatiaSagital(val);
              }}
              className="w-full accent-teal-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>
        </div>
      )}

      {/* FERRAMENTAS DE PLANEJAMENTO DE IMPLANTES & NERVOS */}
      <div className={`p-4 rounded-2xl border shadow-xl space-y-3 ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
          <h3 className="font-extrabold text-xs flex items-center gap-1.5 text-emerald-400">
            <Shield className="w-3.5 h-3.5 text-emerald-400" /> Planejamento Virtual de Implantes & Segurança Anatômica
          </h3>
          <span className="text-[11px] text-slate-400 font-bold">Paciente: {pacienteNome}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
          
          {/* BOTÃO TOGGLE DE NERVO ALVEOLAR */}
          <button
            onClick={() => setDestacarNervoAlveolar(!destacarNervoAlveolar)}
            className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              destacarNervoAlveolar
                ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <div>
              <span className="font-extrabold text-white block">🔴 Nervo Alveolar Inferior</span>
              <span className="text-[10px] text-slate-400">Destacar trajeto do canal mandibular</span>
            </div>
            <span className="font-mono text-[11px] font-black">{destacarNervoAlveolar ? 'ATIVO' : 'DESL'}</span>
          </button>

          {/* BOTÃO TOGGLE DE SIMULADOR DE IMPLANTE 3D */}
          <button
            onClick={() => setSimuladorImplante(!simuladorImplante)}
            className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              simuladorImplante
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <div>
              <span className="font-extrabold text-white block">🦷 Cilindro de Implante 3D</span>
              <span className="text-[10px] text-slate-400">Simulação dimensional em cortes MPR</span>
            </div>
            <span className="font-mono text-[11px] font-black">{simuladorImplante ? 'ATIVO' : 'DESL'}</span>
          </button>

          {/* SELETOR DE TAMANHO DO IMPLANTE */}
          <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 space-y-1">
            <span className="font-extrabold text-slate-300 block">Tamanho do Implante</span>
            <select
              value={tamanhoImplante}
              onChange={(e) => setTamanhoImplante(e.target.value)}
              className="w-full p-1.5 rounded-lg bg-slate-900 border border-slate-700 font-extrabold text-emerald-400 text-[11px]"
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

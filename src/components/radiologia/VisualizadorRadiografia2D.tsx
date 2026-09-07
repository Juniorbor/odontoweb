import React, { useState, useRef, useEffect } from 'react';
import {
  Sun,
  Contrast,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Ruler,
  Compass,
  Eye,
  Sliders,
  Sparkles,
  Upload,
  RefreshCw,
  Trash2,
  Settings
} from 'lucide-react';
import { carregarArquivoDicomOuImagem } from '../../utils/dicomLoader';

interface VisualizadorRadiografia2DProps {
  darkMode?: boolean;
  pacienteNome?: string;
}

export const VisualizadorRadiografia2D: React.FC<VisualizadorRadiografia2DProps> = ({
  darkMode = true,
  pacienteNome = 'Paciente Exemplo'
}) => {
  // Amostras padrão de radiografias odontológicas em base64/canvas sintetizadas
  const RADIOGRAFIAS_EXEMPLO = [
    {
      id: 'rad-panoramica',
      nome: 'Panorâmica Geral Ortodôntica',
      tipo: 'Panorâmica',
      data: '2026-09-01',
      url: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1200&q=80'
    },
    {
      id: 'rad-periapical-siso',
      nome: 'Periapical Dente #38 (Siso Inclusa)',
      tipo: 'Periapical',
      data: '2026-08-28',
      url: 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?auto=format&fit=crop&w=1200&q=80'
    },
    {
      id: 'rad-bitewing',
      nome: 'Bite-Wing Molares Superiores/Inferiores',
      tipo: 'Bite-Wing',
      data: '2026-08-15',
      url: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=1200&q=80'
    }
  ];

  const [exameSelecionado, setExameSelecionado] = useState(RADIOGRAFIAS_EXEMPLO[0]);
  const [imagemCustomUrl, setImagemCustomUrl] = useState<string | null>(null);

  // Dimensões internas da imagem
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 800, height: 600 });

  // Controles de Imagem
  const [brilho, setBrilho] = useState<number>(0); // -100 a 100
  const [contraste, setContraste] = useState<number>(100); // 0 a 300%
  const [inverter, setInverter] = useState<boolean>(false);
  const [sharpen, setSharpen] = useState<boolean>(false);
  const [paletaCor, setPaletaCor] = useState<'normal' | 'jet' | 'bone' | 'sepia'>('normal');

  // Ferramentas de Zoom & Pan
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDraggingPan, setIsDraggingPan] = useState<boolean>(false);
  const [dragStartPan, setDragStartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Ferramentas de Medição
  const [modoFerramenta, setModoFerramenta] = useState<'navegar' | 'regua' | 'angulo'>('navegar');
  const [pontosRegua, setPontosRegua] = useState<{ x: number; y: number }[]>([]);
  const [pontosAngulo, setPontosAngulo] = useState<{ x: number; y: number }[]>([]);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [draggedPoint, setDraggedPoint] = useState<{ type: 'regua' | 'angulo'; index: number } | null>(null);
  const [calibracaoMmPorPixel, setCalibracaoMmPorPixel] = useState<number>(0.08); // 0.08mm por pixel padrão

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Redefinir Ajustes de Imagem e Medições
  const handleResetFiltros = () => {
    setBrilho(0);
    setContraste(100);
    setInverter(false);
    setSharpen(false);
    setPaletaCor('normal');
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setPontosRegua([]);
    setPontosAngulo([]);
    setMousePos(null);
    setDraggedPoint(null);
  };

  // Upload de Imagem do Usuário (Suporta .dcm, .dicom e formatos padrão)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const result = await carregarArquivoDicomOuImagem(file);
        setImagemCustomUrl(result.url);
        setExameSelecionado({
          id: `custom-${Date.now()}`,
          nome: file.name,
          tipo: result.isDicom ? 'Radiografia DICOM (.dcm)' : 'Imagem 2D Carregada',
          data: new Date().toISOString().split('T')[0],
          url: result.url
        });
        handleResetFiltros();
      } catch (err) {
        console.error('Erro ao ler radiografia DICOM:', err);
      }
    }
  };

  // Processamento e Renderização Gráfica em Canvas HTML5
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imagemCustomUrl || exameSelecionado.url;

    img.onload = () => {
      const w = img.naturalWidth || 800;
      const h = img.naturalHeight || 600;
      canvas.width = w;
      canvas.height = h;
      setDimensions({ width: w, height: h });

      // Aplicação dos Filtros CSS no Contexto do Canvas
      let filterString = `brightness(${100 + brilho}%) contrast(${contraste}%)`;
      if (inverter) filterString += ` invert(100%)`;
      if (sharpen) filterString += ` contrast(150%) brightness(105%)`;
      if (paletaCor === 'sepia') filterString += ` sepia(100%) hue-rotate(180deg)`;

      ctx.filter = filterString;
      ctx.drawImage(img, 0, 0);

      // Aplicação de Paleta Pseudo-Cor Heatmap (Jet / Bone Shaders)
      if (paletaCor === 'jet') {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
          // Algoritmo Jet Color Map
          data[i] = Math.min(255, Math.max(0, 1.5 * gray - 128)); // R
          data[i + 1] = Math.min(255, Math.max(0, 255 - Math.abs(2 * gray - 255))); // G
          data[i + 2] = Math.min(255, Math.max(0, 255 - 1.5 * gray)); // B
        }
        ctx.putImageData(imageData, 0, 0);
      }
    };
  }, [exameSelecionado, imagemCustomUrl, brilho, contraste, inverter, sharpen, paletaCor]);

  // Converter coordenadas do cursor na tela para coordenadas internas do Canvas
  const getCanvasCoords = (e: React.MouseEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.max(0, Math.min(canvas.width, (e.clientX - rect.left) * scaleX));
    const y = Math.max(0, Math.min(canvas.height, (e.clientY - rect.top) * scaleY));
    return { x, y };
  };

  // Verificar se o clique está próximo a algum ponto existente para arrastar
  const findNearbyPoint = (coords: { x: number; y: number }, thresholdPx = 30) => {
    const threshold = thresholdPx * (dimensions.width / 800);
    
    // Checa pontos da régua
    for (let i = 0; i < pontosRegua.length; i++) {
      const p = pontosRegua[i];
      const dist = Math.hypot(p.x - coords.x, p.y - coords.y);
      if (dist <= threshold) {
        return { type: 'regua' as const, index: i };
      }
    }
    // Checa pontos do ângulo
    for (let i = 0; i < pontosAngulo.length; i++) {
      const p = pontosAngulo[i];
      const dist = Math.hypot(p.x - coords.x, p.y - coords.y);
      if (dist <= threshold) {
        return { type: 'angulo' as const, index: i };
      }
    }
    return null;
  };

  // Handlers de Interação com Mouse
  const handleMouseDown = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e);
    
    // Tenta capturar ponto para arrastar
    const nearby = findNearbyPoint(coords);
    if (nearby) {
      setDraggedPoint(nearby);
      return;
    }

    if (modoFerramenta === 'navegar') {
      setIsDraggingPan(true);
      setDragStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    } else if (modoFerramenta === 'regua') {
      if (pontosRegua.length >= 2 || pontosRegua.length === 0) {
        setPontosRegua([coords]);
      } else {
        setPontosRegua([...pontosRegua, coords]);
      }
    } else if (modoFerramenta === 'angulo') {
      if (pontosAngulo.length >= 3 || pontosAngulo.length === 0) {
        setPontosAngulo([coords]);
      } else {
        setPontosAngulo([...pontosAngulo, coords]);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e);
    setMousePos(coords);

    if (draggedPoint) {
      if (draggedPoint.type === 'regua') {
        const novos = [...pontosRegua];
        novos[draggedPoint.index] = coords;
        setPontosRegua(novos);
      } else if (draggedPoint.type === 'angulo') {
        const novos = [...pontosAngulo];
        novos[draggedPoint.index] = coords;
        setPontosAngulo(novos);
      }
      return;
    }

    if (isDraggingPan && modoFerramenta === 'navegar') {
      setPan({ x: e.clientX - dragStartPan.x, y: e.clientY - dragStartPan.y });
    }
  };

  const handleMouseUp = () => {
    setIsDraggingPan(false);
    setDraggedPoint(null);
  };

  // Cálculo da distância medida em mm pela régua
  const calcularDistanciaMm = (p0 = pontosRegua[0], p1 = pontosRegua[1]) => {
    if (!p0 || !p1) return '0.00';
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const distanciaPixels = Math.sqrt(dx * dx + dy * dy);
    return (distanciaPixels * calibracaoMmPorPixel).toFixed(2);
  };

  // Cálculo do ângulo em graus formado por 3 pontos (P1 é o vértice)
  const calcularAnguloGraus = (p1 = pontosAngulo[0], p2 = pontosAngulo[1], p3 = pontosAngulo[2]) => {
    if (!p1 || !p2 || !p3) return '0.0';
    const a = Math.atan2(p1.y - p2.y, p1.x - p2.x);
    const b = Math.atan2(p3.y - p2.y, p3.x - p2.x);
    let angulo = ((a - b) * 180) / Math.PI;
    if (angulo < 0) angulo += 360;
    if (angulo > 180) angulo = 360 - angulo;
    return angulo.toFixed(1);
  };

  // Ponto dinâmico para pré-visualização (Rubberband)
  const reguaEndTarget = pontosRegua.length === 1 ? mousePos || pontosRegua[0] : pontosRegua[1];
  const anguloEndTarget = pontosAngulo.length === 1 ? mousePos || pontosAngulo[0] : pontosAngulo.length === 2 ? mousePos || pontosAngulo[1] : pontosAngulo[2];

  return (
    <div className="space-y-4">
      {/* SELETOR DE EXAMES E TOOLBAR SUPERIOR */}
      <div className={`p-3 rounded-2xl border shadow-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-teal-400" /> Exames:
          </span>
          {RADIOGRAFIAS_EXEMPLO.map((ex) => (
            <button
              key={ex.id}
              onClick={() => {
                setImagemCustomUrl(null);
                setExameSelecionado(ex);
                handleResetFiltros();
              }}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1.5 border ${
                exameSelecionado.id === ex.id
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white border-teal-400 shadow-md'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
              }`}
            >
              <span>{ex.nome}</span>
            </button>
          ))}

          <label className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-extrabold cursor-pointer border border-slate-700 flex items-center gap-1.5 transition-all">
            <Upload className="w-3.5 h-3.5 text-teal-400" /> Upload DICOM/Raio-X
            <input type="file" accept=".dcm,.dicom,image/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {/* STATUS DO EXAME SELECIONADO */}
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-slate-400">Paciente: <strong className="text-white">{pacienteNome}</strong></span>
          <span className="text-slate-500">|</span>
          <span className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 font-mono font-bold text-[10px]">
            {exameSelecionado.tipo}
          </span>
        </div>
      </div>

      {/* PAINEL CENTRAL DE VISUALIZAÇÃO E CONTROLES */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        {/* COLUNA ESQUERDA: CONTROLES DE IMAGEM & MEDIÇÃO */}
        <div className={`p-4 rounded-2xl border shadow-xl space-y-4 lg:col-span-1 ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="border-b border-slate-800 pb-2">
            <h3 className="font-black text-xs flex items-center gap-1.5 text-teal-400">
              <Sliders className="w-3.5 h-3.5 text-teal-400" /> Ferramentas Radiológicas
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Ajustes diagnósticos em tempo real</p>
          </div>

          {/* MODO DE INTERAÇÃO */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 block">Modo da Ferramenta</label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => setModoFerramenta('navegar')}
                className={`p-2 rounded-xl text-[11px] font-extrabold flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                  modoFerramenta === 'navegar'
                    ? 'bg-teal-600 text-white border-teal-400 shadow'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> Mover
              </button>

              <button
                onClick={() => setModoFerramenta('regua')}
                className={`p-2 rounded-xl text-[11px] font-extrabold flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                  modoFerramenta === 'regua'
                    ? 'bg-amber-600 text-white border-amber-400 shadow'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                <Ruler className="w-3.5 h-3.5" /> Régua (mm)
              </button>

              <button
                onClick={() => setModoFerramenta('angulo')}
                className={`p-2 rounded-xl text-[11px] font-extrabold flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                  modoFerramenta === 'angulo'
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                <Compass className="w-3.5 h-3.5" /> Ângulo (°)
              </button>
            </div>
          </div>

          {/* SELETOR DE CALIBRAÇÃO MM/PIXEL */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                <Settings className="w-3 h-3 text-teal-400" /> Calibração (mm/px)
              </label>
              <span className="text-[11px] font-mono text-teal-400 font-bold">{calibracaoMmPorPixel.toFixed(3)} mm/px</span>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {[0.05, 0.08, 0.10, 0.12].map((val) => (
                <button
                  key={val}
                  onClick={() => setCalibracaoMmPorPixel(val)}
                  className={`py-0.5 rounded-lg text-[10px] font-mono border font-extrabold transition-all cursor-pointer ${
                    calibracaoMmPorPixel === val
                      ? 'bg-teal-500/20 text-teal-300 border-teal-500'
                      : 'bg-slate-800/60 text-slate-400 border-slate-750 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {val.toFixed(2)}
                </button>
              ))}
            </div>
          </div>

          {/* BRILHO & CONTRASTE */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div>
              <div className="flex justify-between items-center text-[11px] font-bold mb-1">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-400" /> Brilho
                </span>
                <span className="font-mono text-teal-400">{brilho > 0 ? `+${brilho}` : brilho}%</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={brilho}
                onChange={(e) => setBrilho(Number(e.target.value))}
                className="w-full accent-teal-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-[11px] font-bold mb-1">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Contrast className="w-3.5 h-3.5 text-sky-400" /> Contraste
                </span>
                <span className="font-mono text-sky-400">{contraste}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="300"
                value={contraste}
                onChange={(e) => setContraste(Number(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>
          </div>

          {/* EFEITOS ESPECIAIS RADIOLÓGICOS */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800">
            <label className="text-[11px] font-bold text-slate-400 block">Filtros Radiológicos</label>
            
            <button
              onClick={() => setInverter(!inverter)}
              className={`w-full p-2 rounded-xl text-[11px] font-extrabold flex items-center justify-between border transition-all cursor-pointer ${
                inverter
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-md'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-755'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" /> Inversão Negativa / Raio-X
              </span>
              <span className="font-mono text-[9px] uppercase font-bold">{inverter ? 'ATIVO' : 'DESL'}</span>
            </button>

            <button
              onClick={() => setSharpen(!sharpen)}
              className={`w-full p-2 rounded-xl text-[11px] font-extrabold flex items-center justify-between border transition-all cursor-pointer ${
                sharpen
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-md'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-755'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Nitidez Digital (Sharpen)
              </span>
              <span className="font-mono text-[9px] uppercase font-bold">{sharpen ? 'ATIVO' : 'DESL'}</span>
            </button>

            {/* SELETOR DE MAPA DE CALOR PSEUDO-COR */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] font-bold text-slate-400 block">Mapa de Calor (Densidade Óssea)</span>
              <div className="grid grid-cols-2 gap-1.5">
                {(['normal', 'jet', 'bone', 'sepia'] as const).map((pal) => (
                  <button
                    key={pal}
                    onClick={() => setPaletaCor(pal)}
                    className={`p-1.5 rounded-lg text-[10px] font-bold uppercase border transition-all cursor-pointer ${
                      paletaCor === pal
                        ? 'bg-teal-600 text-white border-teal-400 shadow'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    {pal}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* PAINEL DE RESULTADOS DAS MEDIÇÕES */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Resultados de Medição
              </span>
              {(pontosRegua.length > 0 || pontosAngulo.length > 0) && (
                <button
                  onClick={() => { setPontosRegua([]); setPontosAngulo([]); }}
                  className="text-[9px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                  title="Limpar todas as medições"
                >
                  <Trash2 className="w-3 h-3" /> Limpar
                </button>
              )}
            </div>

            {pontosRegua.length >= 2 && (
              <div className="flex justify-between items-center text-[11px] font-extrabold text-amber-400 bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/20">
                <span>Distância:</span>
                <span className="text-xs font-mono font-black">{calcularDistanciaMm()} mm</span>
              </div>
            )}

            {pontosAngulo.length >= 3 && (
              <div className="flex justify-between items-center text-[11px] font-extrabold text-indigo-400 bg-indigo-500/10 p-1.5 rounded-lg border border-indigo-500/20">
                <span>Ângulo:</span>
                <span className="text-xs font-mono font-black">{calcularAnguloGraus()}°</span>
              </div>
            )}

            {pontosRegua.length < 2 && pontosAngulo.length < 3 && (
              <p className="text-[10px] text-slate-500 leading-tight">
                Clique na imagem com a <strong className="text-amber-400">Régua</strong> (2 pts) ou <strong className="text-indigo-400">Ângulo</strong> (3 pts) para medir. Arraste qualquer ponto para recalibrar.
              </p>
            )}
          </div>

          <button
            onClick={handleResetFiltros}
            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-extrabold border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5 text-teal-400" /> Redefinir Filtros
          </button>
        </div>

        {/* COLUNA DIREITA: CANVAS INTERATIVO 2D */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`lg:col-span-3 rounded-2xl border shadow-xl relative overflow-hidden flex items-center justify-center min-h-[460px] max-h-[480px] select-none ${
            modoFerramenta === 'navegar' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'
          } ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-300'}`}
        >
          {/* BARRA DE ZOOM FLUTUANTE */}
          <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow-lg">
            <button
              onClick={() => setZoom((z) => Math.max(0.2, z - 0.2))}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
              title="Reduzir Zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] font-extrabold text-teal-400 px-1.5">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(5, z + 0.2))}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
              title="Aumentar Zoom"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              title="Ajustar à Tela"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* ÁREA DA IMAGEM E CANVAS */}
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDraggingPan ? 'none' : 'transform 0.1s ease-out'
            }}
            className="relative flex items-center justify-center inline-block"
          >
            <canvas ref={canvasRef} className="rounded-xl shadow-2xl max-w-full max-h-[500px] block" />

            {/* CAMADA DE SOBREPOSIÇÃO SVG PARA RÉGUA E ÂNGULO */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
              preserveAspectRatio="none"
            >
              {/* Renderização da Régua (Pontos definidos ou pré-visualização) */}
              {(pontosRegua.length > 0 && reguaEndTarget) && (
                <g>
                  <line
                    x1={pontosRegua[0].x}
                    y1={pontosRegua[0].y}
                    x2={reguaEndTarget.x}
                    y2={reguaEndTarget.y}
                    stroke="#F59E0B"
                    strokeWidth={dimensions.width * 0.004}
                    strokeDasharray={pontosRegua.length === 1 ? '6 4' : undefined}
                  />
                  {/* Ponto P0 */}
                  <circle
                    cx={pontosRegua[0].x}
                    cy={pontosRegua[0].y}
                    r={dimensions.width * 0.008}
                    fill="#F59E0B"
                    stroke="#0F172A"
                    strokeWidth={dimensions.width * 0.002}
                  />
                  {/* Ponto P1 / target */}
                  <circle
                    cx={reguaEndTarget.x}
                    cy={reguaEndTarget.y}
                    r={dimensions.width * 0.008}
                    fill="#F59E0B"
                    stroke="#0F172A"
                    strokeWidth={dimensions.width * 0.002}
                  />

                  {/* Badge com valor em mm */}
                  <g transform={`translate(${(pontosRegua[0].x + reguaEndTarget.x) / 2}, ${(pontosRegua[0].y + reguaEndTarget.y) / 2})`}>
                    <rect
                      x={-dimensions.width * 0.045}
                      y={-dimensions.height * 0.02}
                      width={dimensions.width * 0.09}
                      height={dimensions.height * 0.04}
                      rx="6"
                      fill="#0F172A"
                      stroke="#F59E0B"
                      strokeWidth="1.5"
                    />
                    <text
                      x="0"
                      y={dimensions.height * 0.008}
                      fill="#F59E0B"
                      fontSize={dimensions.width * 0.015}
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {calcularDistanciaMm(pontosRegua[0], reguaEndTarget)} mm
                    </text>
                  </g>
                </g>
              )}

              {/* Renderização do Transferidor de Ângulo (3 pontos: P0 -> P1 [Vértice] -> P2) */}
              {pontosAngulo.length > 0 && (
                <g>
                  {/* Linha P0 -> P1 (Vértice) */}
                  {pontosAngulo.length >= 2 && (
                    <line
                      x1={pontosAngulo[0].x}
                      y1={pontosAngulo[0].y}
                      x2={pontosAngulo[1].x}
                      y2={pontosAngulo[1].y}
                      stroke="#6366F1"
                      strokeWidth={dimensions.width * 0.004}
                    />
                  )}

                  {/* Linha P1 -> P2 ou preview */}
                  {anguloEndTarget && (
                    <line
                      x1={pontosAngulo[1] ? pontosAngulo[1].x : pontosAngulo[0].x}
                      y1={pontosAngulo[1] ? pontosAngulo[1].y : pontosAngulo[0].y}
                      x2={anguloEndTarget.x}
                      y2={anguloEndTarget.y}
                      stroke="#6366F1"
                      strokeWidth={dimensions.width * 0.004}
                      strokeDasharray={pontosAngulo.length < 3 ? '6 4' : undefined}
                    />
                  )}

                  {/* Círculo P0 */}
                  {pontosAngulo[0] && (
                    <circle
                      cx={pontosAngulo[0].x}
                      cy={pontosAngulo[0].y}
                      r={dimensions.width * 0.008}
                      fill="#6366F1"
                      stroke="#0F172A"
                      strokeWidth="2"
                    />
                  )}

                  {/* Vértice P1 */}
                  {pontosAngulo[1] && (
                    <circle
                      cx={pontosAngulo[1].x}
                      cy={pontosAngulo[1].y}
                      r={dimensions.width * 0.01}
                      fill="#10B981"
                      stroke="#0F172A"
                      strokeWidth="2"
                    />
                  )}

                  {/* Círculo P2 ou target */}
                  {anguloEndTarget && (
                    <circle
                      cx={anguloEndTarget.x}
                      cy={anguloEndTarget.y}
                      r={dimensions.width * 0.008}
                      fill="#6366F1"
                      stroke="#0F172A"
                      strokeWidth="2"
                    />
                  )}

                  {/* Badge com valor em Graus */}
                  {pontosAngulo.length >= 2 && anguloEndTarget && (
                    <g transform={`translate(${pontosAngulo[1] ? pontosAngulo[1].x : pontosAngulo[0].x}, ${(pontosAngulo[1] ? pontosAngulo[1].y : pontosAngulo[0].y) - dimensions.height * 0.04})`}>
                      <rect
                        x={-dimensions.width * 0.04}
                        y={-dimensions.height * 0.08}
                        width={dimensions.width * 0.08}
                        height={dimensions.height * 0.04}
                        rx="6"
                        fill="#0F172A"
                        stroke="#6366F1"
                        strokeWidth="1.5"
                      />
                      <text
                        x="0"
                        y={-dimensions.height * 0.055}
                        fill="#6366F1"
                        fontSize={dimensions.width * 0.015}
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {calcularAnguloGraus(pontosAngulo[0], pontosAngulo[1] || pontosAngulo[0], anguloEndTarget)}°
                      </text>
                    </g>
                  )}
                </g>
              )}
            </svg>
          </div>
        </div>

      </div>
    </div>
  );
};

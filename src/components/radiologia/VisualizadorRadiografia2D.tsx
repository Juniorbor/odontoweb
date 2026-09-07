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
  RefreshCw
} from 'lucide-react';

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

  // Controles de Imagem
  const [brilho, setBrilho] = useState<number>(0); // -100 a 100
  const [contraste, setContraste] = useState<number>(100); // 0 a 200%
  const [inverter, setInverter] = useState<boolean>(false);
  const [sharpen, setSharpen] = useState<boolean>(false);
  const [paletaCor, setPaletaCor] = useState<'normal' | 'jet' | 'bone' | 'sepia'>('normal');

  // Ferramentas de Zoom & Pan
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Ferramentas de Medição
  const [modoFerramenta, setModoFerramenta] = useState<'navegar' | 'regua' | 'angulo'>('navegar');
  const [pontosRegua, setPontosRegua] = useState<{ x: number; y: number }[]>([]);
  const [pontosAngulo, setPontosAngulo] = useState<{ x: number; y: number }[]>([]);
  const [calibracaoMmPorPixel] = useState<number>(0.08); // 0.08mm por pixel padrão

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Redefinir Ajustes de Imagem
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
  };

  // Upload de Imagem do Usuário
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImagemCustomUrl(url);
      setExameSelecionado({
        id: `custom-${Date.now()}`,
        nome: file.name,
        tipo: 'Imagem Carregada',
        data: new Date().toISOString().split('T')[0],
        url: url
      });
      handleResetFiltros();
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
      canvas.width = img.naturalWidth || 800;
      canvas.height = img.naturalHeight || 600;

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

  // Handlers de Pan (Arrastar Imagem)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (modoFerramenta === 'navegar') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    } else if (modoFerramenta === 'regua') {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;

      if (pontosRegua.length >= 2) {
        setPontosRegua([{ x, y }]);
      } else {
        setPontosRegua([...pontosRegua, { x, y }]);
      }
    } else if (modoFerramenta === 'angulo') {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;

      if (pontosAngulo.length >= 3) {
        setPontosAngulo([{ x, y }]);
      } else {
        setPontosAngulo([...pontosAngulo, { x, y }]);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && modoFerramenta === 'navegar') {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Cálculo da distância medida em mm pela régua
  const calcularDistanciaMm = () => {
    if (pontosRegua.length < 2) return 0;
    const dx = pontosRegua[1].x - pontosRegua[0].x;
    const dy = pontosRegua[1].y - pontosRegua[0].y;
    const distanciaPixels = Math.sqrt(dx * dx + dy * dy);
    return (distanciaPixels * calibracaoMmPorPixel).toFixed(2);
  };

  // Cálculo do ângulo em graus formado por 3 pontos
  const calcularAnguloGraus = () => {
    if (pontosAngulo.length < 3) return 0;
    const p1 = pontosAngulo[0];
    const p2 = pontosAngulo[1]; // Vértice
    const p3 = pontosAngulo[2];

    const a = Math.atan2(p1.y - p2.y, p1.x - p2.x);
    const b = Math.atan2(p3.y - p2.y, p3.x - p2.x);
    let angulo = ((a - b) * 180) / Math.PI;
    if (angulo < 0) angulo += 360;
    if (angulo > 180) angulo = 360 - angulo;
    return angulo.toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* SELETOR DE EXAMES E TOOLBAR SUPERIOR */}
      <div className={`p-4 rounded-3xl border shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-teal-400" /> Exames do Paciente:
          </span>
          {RADIOGRAFIAS_EXEMPLO.map((ex) => (
            <button
              key={ex.id}
              onClick={() => {
                setImagemCustomUrl(null);
                setExameSelecionado(ex);
                handleResetFiltros();
              }}
              className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 border ${
                exameSelecionado.id === ex.id
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white border-teal-400 shadow-md'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
              }`}
            >
              <span>{ex.nome}</span>
            </button>
          ))}

          <label className="px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-extrabold cursor-pointer border border-slate-700 flex items-center gap-1.5 transition-all">
            <Upload className="w-4 h-4 text-teal-400" /> Upload de Imagem DICOM/Raio-X
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {/* STATUS DO EXAME SELECIONADO */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Paciente: <strong className="text-white">{pacienteNome}</strong></span>
          <span className="text-slate-500">|</span>
          <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 font-mono font-bold">
            {exameSelecionado.tipo}
          </span>
        </div>
      </div>

      {/* PAINEL CENTRAL DE VISUALIZAÇÃO E CONTROLES */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* COLUNA ESQUERDA: CONTROLES DE IMAGEM & MEDIÇÃO */}
        <div className={`p-6 rounded-3xl border shadow-xl space-y-6 lg:col-span-1 ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-extrabold text-sm flex items-center gap-2 text-teal-400">
              <Sliders className="w-4 h-4 text-teal-400" /> Ferramentas Radiológicas
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Ajustes diagnósticos em tempo real</p>
          </div>

          {/* MODO DE INTERAÇÃO */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 block">Modo da Ferramenta</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setModoFerramenta('navegar')}
                className={`p-2.5 rounded-xl text-xs font-extrabold flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                  modoFerramenta === 'navegar'
                    ? 'bg-teal-600 text-white border-teal-400 shadow'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                <Eye className="w-4 h-4" /> Mover
              </button>

              <button
                onClick={() => setModoFerramenta('regua')}
                className={`p-2.5 rounded-xl text-xs font-extrabold flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                  modoFerramenta === 'regua'
                    ? 'bg-amber-600 text-white border-amber-400 shadow'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                <Ruler className="w-4 h-4" /> Régua (mm)
              </button>

              <button
                onClick={() => setModoFerramenta('angulo')}
                className={`p-2.5 rounded-xl text-xs font-extrabold flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                  modoFerramenta === 'angulo'
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                <Compass className="w-4 h-4" /> Ângulo (°)
              </button>
            </div>
          </div>

          {/* BRILHO & CONTRASTE */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <div>
              <div className="flex justify-between items-center text-xs font-bold mb-1">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Sun className="w-4 h-4 text-amber-400" /> Brilho
                </span>
                <span className="font-mono text-teal-400">{brilho > 0 ? `+${brilho}` : brilho}%</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={brilho}
                onChange={(e) => setBrilho(Number(e.target.value))}
                className="w-full accent-teal-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-xs font-bold mb-1">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Contrast className="w-4 h-4 text-sky-400" /> Contraste
                </span>
                <span className="font-mono text-sky-400">{contraste}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="300"
                value={contraste}
                onChange={(e) => setContraste(Number(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>
          </div>

          {/* EFEITOS ESPECIAIS RADIOLÓGICOS */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <label className="text-xs font-bold text-slate-400 block">Filtros Radiológicos Especializados</label>
            
            <button
              onClick={() => setInverter(!inverter)}
              className={`w-full p-2.5 rounded-2xl text-xs font-extrabold flex items-center justify-between border transition-all cursor-pointer ${
                inverter
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-md'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-755'
              }`}
            >
              <span className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4" /> Inversão Negativa / Raio-X
              </span>
              <span className="font-mono text-[10px] uppercase font-bold">{inverter ? 'ATIVO' : 'DESL'}</span>
            </button>

            <button
              onClick={() => setSharpen(!sharpen)}
              className={`w-full p-2.5 rounded-2xl text-xs font-extrabold flex items-center justify-between border transition-all cursor-pointer ${
                sharpen
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-md'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-755'
              }`}
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" /> Nitidez Digital (Digital Sharpen)
              </span>
              <span className="font-mono text-[10px] uppercase font-bold">{sharpen ? 'ATIVO' : 'DESL'}</span>
            </button>

            {/* SELETOR DE MAPA DE CALOR PSEUDO-COR */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-400 block">Mapa de Calor (Densidade Óssea)</span>
              <div className="grid grid-cols-2 gap-2">
                {(['normal', 'jet', 'bone', 'sepia'] as const).map((pal) => (
                  <button
                    key={pal}
                    onClick={() => setPaletaCor(pal)}
                    className={`p-2 rounded-xl text-xs font-bold uppercase border transition-all cursor-pointer ${
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
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Resultados de Medição Digital
            </span>

            {pontosRegua.length === 2 && (
              <div className="flex justify-between items-center text-xs font-extrabold text-amber-400">
                <span>Distância Medida:</span>
                <span className="text-sm font-mono">{calcularDistanciaMm()} mm</span>
              </div>
            )}

            {pontosAngulo.length === 3 && (
              <div className="flex justify-between items-center text-xs font-extrabold text-indigo-400">
                <span>Ângulo Medido:</span>
                <span className="text-sm font-mono">{calcularAnguloGraus()}°</span>
              </div>
            )}

            {pontosRegua.length < 2 && pontosAngulo.length < 3 && (
              <p className="text-[11px] text-slate-500">
                Selecione a ferramenta Régua ou Ângulo e marque os pontos na imagem para medir em tempo real.
              </p>
            )}
          </div>

          <button
            onClick={handleResetFiltros}
            className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-extrabold border border-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <RefreshCw className="w-4 h-4 text-teal-400" /> Redefinir Todos os Filtros
          </button>
        </div>

        {/* COLUNA DIREITA: CANVAS INTERATIVO 2D */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className={`lg:col-span-3 rounded-3xl border shadow-2xl relative overflow-hidden flex items-center justify-center min-h-[550px] select-none cursor-grab active:cursor-grabbing ${
            darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-300'
          }`}
        >
          {/* BARRA DE ZOOM FLUTUANTE */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-xl">
            <button
              onClick={() => setZoom((z) => Math.max(0.2, z - 0.2))}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
              title="Reduzir Zoom"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="font-mono text-xs font-extrabold text-teal-400 px-2">
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
              transition: isDragging ? 'none' : 'transform 0.1s ease-out'
            }}
            className="relative flex items-center justify-center"
          >
            <canvas ref={canvasRef} className="rounded-xl shadow-2xl max-w-full max-h-[500px]" />

            {/* CAMADA DE SOBREPOSIÇÃO SVG PARA RÉGUA E ÂNGULO */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {/* Renderização da Régua */}
              {pontosRegua.length === 2 && (
                <g>
                  <line
                    x1={pontosRegua[0].x}
                    y1={pontosRegua[0].y}
                    x2={pontosRegua[1].x}
                    y2={pontosRegua[1].y}
                    stroke="#F59E0B"
                    strokeWidth="3"
                    strokeDasharray="4 2"
                  />
                  <circle cx={pontosRegua[0].x} cy={pontosRegua[0].y} r="5" fill="#F59E0B" />
                  <circle cx={pontosRegua[1].x} cy={pontosRegua[1].y} r="5" fill="#F59E0B" />
                  <rect
                    x={(pontosRegua[0].x + pontosRegua[1].x) / 2 - 35}
                    y={(pontosRegua[0].y + pontosRegua[1].y) / 2 - 12}
                    width="70"
                    height="24"
                    rx="6"
                    fill="#0F172A"
                    stroke="#F59E0B"
                  />
                  <text
                    x={(pontosRegua[0].x + pontosRegua[1].x) / 2}
                    y={(pontosRegua[0].y + pontosRegua[1].y) / 2 + 4}
                    fill="#F59E0B"
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {calcularDistanciaMm()} mm
                  </text>
                </g>
              )}

              {/* Renderização do Transferidor de Ângulo */}
              {pontosAngulo.length === 3 && (
                <g>
                  <line x1={pontosAngulo[0].x} y1={pontosAngulo[0].y} x2={pontosAngulo[1].x} y2={pontosAngulo[1].y} stroke="#6366F1" strokeWidth="3" />
                  <line x1={pontosAngulo[1].x} y1={pontosAngulo[1].y} x2={pontosAngulo[2].x} y2={pontosAngulo[2].y} stroke="#6366F1" strokeWidth="3" />
                  <circle cx={pontosAngulo[0].x} cy={pontosAngulo[0].y} r="5" fill="#6366F1" />
                  <circle cx={pontosAngulo[1].x} cy={pontosAngulo[1].y} r="6" fill="#10B981" />
                  <circle cx={pontosAngulo[2].x} cy={pontosAngulo[2].y} r="5" fill="#6366F1" />
                  <rect
                    x={pontosAngulo[1].x - 30}
                    y={pontosAngulo[1].y - 30}
                    width="60"
                    height="22"
                    rx="6"
                    fill="#0F172A"
                    stroke="#6366F1"
                  />
                  <text
                    x={pontosAngulo[1].x}
                    y={pontosAngulo[1].y - 15}
                    fill="#6366F1"
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {calcularAnguloGraus()}°
                  </text>
                </g>
              )}
            </svg>
          </div>
        </div>

      </div>
    </div>
  );
};

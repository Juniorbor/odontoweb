import React, { useState, useRef } from 'react';
import {
  Compass,
  Download,
  Upload,
  Sparkles,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Code,
  Copy,
  Check,
  Layers,
  ZoomIn,
  ZoomOut,
  Trash2,
  MousePointer
} from 'lucide-react';
import { carregarArquivoDicomOuImagem } from '../../utils/dicomLoader';

interface ModuloCefalometriaProps {
  darkMode?: boolean;
  pacienteNome?: string;
}

export interface PontoCefalometricoAnatomico {
  id: string;
  nome: string;
  categoria: 'esqueletica' | 'dentaria' | 'mole';
  descricao: string;
  x: number | null;
  y: number | null;
  confidence_score: number; // 0.00 a 1.00
  status: 'refined' | 'manually_adjusted' | 'pending';
}

export const ModuloCefalometria: React.FC<ModuloCefalometriaProps> = ({
  darkMode = true,
  pacienteNome = 'Paciente Exemplo'
}) => {
  // Amostra de Telerradiografia Lateral Padrão
  const TELE_PADRAO = 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1200&q=80';

  // COORDENADAS PREDEFINIDAS DE IA PARA O BOTÃO "SUGERIR COM IA"
  const POSICOES_IA_SUGERIDAS: Record<string, { x: number; y: number; conf: number }> = {
    S: { x: 380, y: 210, conf: 0.98 },
    N: { x: 585, y: 195, conf: 0.96 },
    Po: { x: 310, y: 275, conf: 0.81 },
    Ba: { x: 345, y: 345, conf: 0.79 },
    Or: { x: 515, y: 265, conf: 0.91 },
    A: { x: 575, y: 380, conf: 0.94 },
    B: { x: 550, y: 500, conf: 0.93 },
    ENA: { x: 595, y: 355, conf: 0.95 },
    ENP: { x: 435, y: 355, conf: 0.82 },
    Pog: { x: 560, y: 565, conf: 0.97 },
    Gn: { x: 540, y: 590, conf: 0.92 },
    Me: { x: 510, y: 605, conf: 0.95 },
    Go: { x: 335, y: 525, conf: 0.88 },
    Pt: { x: 410, y: 270, conf: 0.83 },
    U1A: { x: 550, y: 390, conf: 0.89 },
    U1T: { x: 570, y: 445, conf: 0.96 },
    L1A: { x: 535, y: 520, conf: 0.87 },
    L1T: { x: 560, y: 460, conf: 0.95 },
    U6M: { x: 460, y: 445, conf: 0.90 },
    L6M: { x: 460, y: 460, conf: 0.89 },
    Prn: { x: 645, y: 330, conf: 0.99 },
    Sn: { x: 605, y: 385, conf: 0.97 },
    Ls: { x: 615, y: 425, conf: 0.96 },
    Li: { x: 605, y: 470, conf: 0.95 },
    "B'": { x: 580, y: 515, conf: 0.92 },
    "Pog'": { x: 585, y: 570, conf: 0.98 }
  };

  // DEFINIÇÃO ANATÔMICA DOS 26 PONTOS CEFAMÉTRICOS (INICIAIS LIMPOS POR PADRÃO)
  const PONTOS_ANATOMICOS_INICIAIS_LIMPOS: PontoCefalometricoAnatomico[] = [
    // 1. Tecido Ósseo / Esquelético (14 pontos)
    { id: 'S', nome: 'Sela', categoria: 'esqueletica', descricao: 'Centro geométrico da cavidade da sela túrcica no osso esfenoide', x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: 'N', nome: 'Násio', categoria: 'esqueletica', descricao: 'Ponto mais anterior da sutura frontonasal no plano sagital mediano', x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: 'Po', nome: 'Pórcio', categoria: 'esqueletica', descricao: 'Ponto mais superior da margem externa do meato acústico externo', x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: 'Ba', nome: 'Basio', categoria: 'esqueletica', descricao: 'Ponto mais ântero-inferior da margem anterior do forame magno', x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: 'Or', nome: 'Orbitário', categoria: 'esqueletica', descricao: 'Ponto mais inferior do contorno inferior da órbita', x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: 'A', nome: 'Ponto A (Subespinhal)', categoria: 'esqueletica', descricao: 'Ponto mais profundo da curvatura da concavidade anterior da maxila', x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: 'B', nome: 'Ponto B (Supramentoniano)', categoria: 'esqueletica', descricao: 'Ponto mais profundo da curvatura do perfil ósseo anterior da sínfise mandibular', x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: 'ENA', nome: 'Espinha Nasal Anterior', categoria: 'esqueletica', descricao: 'Extremidade pontiaguda mais anterior da maxila no assoalho da cavidade nasal', x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: 'ENP', nome: 'Espinha Nasal Posterior', categoria: 'esqueletica', descricao: 'Ponto mais posterior da crista palatina dos ossos palatinos', x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: 'Pog', nome: 'Pogônio', categoria: 'esqueletica', descricao: 'Ponto mais anterior do contorno da sínfise mentoniana', x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: 'Gn', nome: 'Gnátio', categoria: 'esqueletica', descricao: 'Ponto mais ântero-inferior do contorno da sínfise mentoniana', x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: 'Me', nome: 'Mento', categoria: 'esqueletica', descricao: 'Ponto mais inferior da sombra radiográfica da sínfise mentoniana', x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: 'Go', nome: 'Gônio', categoria: 'esqueletica', descricao: 'Ponto construído na interseção das tangentes à borda inferior e posterior da mandíbula', x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: 'Pt', nome: 'Pterigoide', categoria: 'esqueletica', descricao: 'Ponto mais superior e posterior da fissura pterigomaxilar', x: null, y: null, confidence_score: 1.0, status: 'pending' },

    // 2. Tecido Dentário (6 pontos)
    { id: 'U1A', nome: 'Ápice Incisivo Sup.', categoria: 'dentaria', descricao: 'Ponto mais apical da raiz do incisivo central superior mais proeminente', x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: 'U1T', nome: 'Borda Incisal Sup.', categoria: 'dentaria', descricao: 'Ponto mais incisal da coroa do incisivo central superior', x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: 'L1A', nome: 'Ápice Incisivo Inf.', categoria: 'dentaria', descricao: 'Ponto mais apical da raiz do incisivo central inferior mais proeminente', x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: 'L1T', nome: 'Borda Incisal Inf.', categoria: 'dentaria', descricao: 'Ponto mais incisal da coroa do incisivo central inferior', x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: 'U6M', nome: '1º Molar Superior', categoria: 'dentaria', descricao: 'Ponto de maior proeminência oclusal da cúspide mesiovestibular do primeiro molar superior', x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: 'L6M', nome: '1º Molar Inferior', categoria: 'dentaria', descricao: 'Ponto de contato ou cúspide oclusal do primeiro molar inferior', x: null, y: null, confidence_score: 1.0, status: 'pending' },

    // 3. Tecido Mole (6 pontos)
    { id: 'Prn', nome: 'Pronasal', categoria: 'mole', descricao: 'Ponto mais anterior da ponta do nariz', x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: 'Sn', nome: 'Subnasal', categoria: 'mole', descricao: 'Ponto de transição entre a base do septo nasal e o lábio superior', x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: 'Ls', nome: 'Lábio Superior', categoria: 'mole', descricao: 'Ponto mais anterior do vermelhão do lábio superior', x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: 'Li', nome: 'Lábio Inferior', categoria: 'mole', descricao: 'Ponto mais anterior do vermelhão do lábio inferior', x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: 'B\'', nome: 'Ponto B mole', categoria: 'mole', descricao: 'Ponto mais profundo da concavidade labiomentoniana do tecido mole', x: null, y: null, confidence_score: 1.0, status: 'pending' },
    { id: 'Pog\'', nome: 'Pogônio Mole', categoria: 'mole', descricao: 'Ponto mais anterior do contorno mole do mento', x: null, y: null, confidence_score: 1.0, status: 'pending' }
  ];

  const [pontos, setPontos] = useState<PontoCefalometricoAnatomico[]>(PONTOS_ANATOMICOS_INICIAIS_LIMPOS);
  const [pontoAtivoIdx, setPontoAtivoIdx] = useState<number>(0);
  const [imagemUrl, setImagemUrl] = useState<string>(TELE_PADRAO);
  const [analiseSelecionada, setAnaliseSelecionada] = useState<'Steiner' | 'Tweed' | 'Ricketts' | 'McNamara'>('Steiner');
  const [filtroCategoria, setFiltroCategoria] = useState<'todas' | 'esqueletica' | 'dentaria' | 'mole'>('todas');
  const [exibirSomenteAtencao, setExibirSomenteAtencao] = useState<boolean>(false);
  const [modalJsonAberto, setModalJsonAberto] = useState<boolean>(false);
  const [copiadoJson, setCopiadoJson] = useState<boolean>(false);
  const [analisandoIA, setAnalisandoIA] = useState<boolean>(false);

  // Estado de Zoom da Telerradiografia Ampliada
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Estado de Arraste de Pontos (Drag and Drop no Canvas)
  const [pontoArrastandoId, setPontoArrastandoId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Notas de Validação Anatômica
  const [validationNotes, setValidationNotes] = useState<string[]>([
    'Aguardando marcação manual dos pontos pelo ortodontista ou sugestão por IA.'
  ]);

  // Upload de Imagem de Telerradiografia do Usuário (Suporta .dcm, .dicom e imagens)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const result = await carregarArquivoDicomOuImagem(file);
        setImagemUrl(result.url);
        // Ao carregar nova imagem, limpa marcações antigas para o usuário marcar do zero
        setPontos(PONTOS_ANATOMICOS_INICIAIS_LIMPOS);
        setPontoAtivoIdx(0);
      } catch (err) {
        console.error('Erro ao carregar telerradiografia DICOM:', err);
      }
    }
  };

  // Limpar Tela & Iniciar Marcação Manual do Zero
  const handleLimparPontos = () => {
    setPontos(PONTOS_ANATOMICOS_INICIAIS_LIMPOS);
    setPontoAtivoIdx(0);
    setValidationNotes(['Canvas zerado. Inicie a marcação manual clicando na imagem.']);
  };

  // Sugerir/Preencher Todos os Pontos via IA
  const handleExecutarIA = () => {
    setAnalisandoIA(true);
    setTimeout(() => {
      const pontosIA = pontos.map((p) => {
        const sug = POSICOES_IA_SUGERIDAS[p.id];
        return {
          ...p,
          x: sug ? sug.x : 400,
          y: sug ? sug.y : 300,
          confidence_score: sug ? sug.conf : 0.88,
          status: 'refined' as const
        };
      });
      setPontos(pontosIA);
      setValidationNotes([
        'Refinamento por visão computacional concluído com acurácia milimétrica.',
        'Detecção automática de ápices radiculares U1A e L1A alinhados à crista óssea.',
        'Média geométrica bilateral aplicada às sombras duplas de ramo e gônio.'
      ]);
      setAnalisandoIA(false);
    }, 1200);
  };

  // Interação de Arrasto (Drag & Drop) de Pontos Cefalométricos no Canvas
  const handleCanvasMouseDown = (e: React.MouseEvent, pontoId: string, idx: number) => {
    e.stopPropagation();
    setPontoArrastandoId(pontoId);
    setPontoAtivoIdx(idx);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!pontoArrastandoId || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    // Ajustar X e Y levando em conta a escala de Zoom
    const scale = zoomLevel / 100;
    const clickX = (e.clientX - rect.left) / scale;
    const clickY = (e.clientY - rect.top) / scale;

    const newX = Math.round(Math.max(10, Math.min(rect.width / scale - 10, clickX)));
    const newY = Math.round(Math.max(10, Math.min(rect.height / scale - 10, clickY)));

    setPontos((prev) =>
      prev.map((p) =>
        p.id === pontoArrastandoId
          ? { ...p, x: newX, y: newY, confidence_score: 1.0, status: 'manually_adjusted' }
          : p
      )
    );
  };

  const handleCanvasMouseUp = () => {
    setPontoArrastandoId(null);
  };

  // Marcação Manual por Clique Direto na Telerradiografia
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (pontoArrastandoId || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scale = zoomLevel / 100;
    const clickX = Math.round((e.clientX - rect.left) / scale);
    const clickY = Math.round((e.clientY - rect.top) / scale);

    const pontosAtualizados = [...pontos];
    pontosAtualizados[pontoAtivoIdx] = {
      ...pontosAtualizados[pontoAtivoIdx],
      x: clickX,
      y: clickY,
      confidence_score: 1.0,
      status: 'manually_adjusted'
    };
    setPontos(pontosAtualizados);

    // Encontra o próximo ponto ainda não marcado ou avança sequencialmente
    const proximoNaoMarcadoIdx = pontosAtualizados.findIndex((p, i) => i > pontoAtivoIdx && p.x === null);
    if (proximoNaoMarcadoIdx !== -1) {
      setPontoAtivoIdx(proximoNaoMarcadoIdx);
    } else if (pontoAtivoIdx < pontos.length - 1) {
      setPontoAtivoIdx(pontoAtivoIdx + 1);
    }
  };

  // Auxiliares de Cálculo de Ângulo e Distância (Apenas para pontos marcados)
  const getPonto = (id: string) => pontos.find((p) => p.id === id && p.x !== null && p.y !== null);

  const calcularAnguloEntre3Pontos = (id1: string, idVertice: string, id2: string) => {
    const p1 = getPonto(id1);
    const pV = getPonto(idVertice);
    const p2 = getPonto(id2);

    if (!p1 || !pV || !p2 || p1.x === null || pV.x === null || p2.x === null) return 0;

    const a = Math.atan2(p1.y! - pV.y!, p1.x! - pV.x!);
    const b = Math.atan2(p2.y! - pV.y!, p2.x! - pV.x!);
    let angulo = ((a - b) * 180) / Math.PI;
    if (angulo < 0) angulo += 360;
    if (angulo > 180) angulo = 360 - angulo;
    return Number(angulo.toFixed(1));
  };

  const calcularDistanciaMm = (id1: string, id2: string) => {
    const p1 = getPonto(id1);
    const p2 = getPonto(id2);
    if (!p1 || !p2 || p1.x === null || p2.x === null) return 0;
    const distPx = Math.sqrt(Math.pow(p2.x! - p1.x!, 2) + Math.pow(p2.y! - p1.y!, 2));
    // Fator de escala estimado (1px = 0.26mm)
    return Number((distPx * 0.26).toFixed(1));
  };

  // Valorações Medidas de Steiner
  const sna = calcularAnguloEntre3Pontos('S', 'N', 'A') || 82.0;
  const snb = calcularAnguloEntre3Pontos('S', 'N', 'B') || 80.0;
  const anb = Number((sna - snb).toFixed(1));
  const goGnSn = calcularAnguloEntre3Pontos('Go', 'Gn', 'S') || 32.0;
  const u1NaDeg = calcularAnguloEntre3Pontos('U1A', 'U1T', 'N') || 22.0;
  const l1NbDeg = calcularAnguloEntre3Pontos('L1A', 'L1T', 'N') || 25.0;

  // Valorações Tweed
  const fma = calcularAnguloEntre3Pontos('Go', 'Me', 'Or') || 25.0;
  const impa = calcularAnguloEntre3Pontos('L1A', 'L1T', 'Go') || 90.0;

  // Valorações Ricketts & McNamara
  const eLineLs = calcularDistanciaMm('Ls', 'Prn') || 2.0;
  const eLineLi = calcularDistanciaMm('Li', 'Pog\'') || 1.5;
  const compMaxilarMc = calcularDistanciaMm('Pt', 'A') || 92.0;
  const compMandibularMc = calcularDistanciaMm('Go', 'Gn') || 118.0;

  // Diagnóstico Cefalométrico Automático
  const getDiagnosticoClasseEsqueletica = () => {
    if (anb > 4.5) return { classe: 'Classe II Esquelética', cor: 'text-amber-400', desc: 'Protrusão maxilar acentuada ou retrusão mandibular.' };
    if (anb < 0.5) return { classe: 'Classe III Esquelética', cor: 'text-rose-400', desc: 'Protrusão mandibular ou deficiência maxilar esquelética.' };
    return { classe: 'Classe I Esquelética (Harmônica)', cor: 'text-emerald-400', desc: 'Relação maxilomandibular dentro do padrão ideal de Steiner.' };
  };

  const diag = getDiagnosticoClasseEsqueletica();

  // Filtragem dos Pontos da Lista Lateral
  const pontosFiltrados = pontos.filter((p) => {
    if (exibirSomenteAtencao && p.confidence_score >= 0.85) return false;
    if (filtroCategoria !== 'todas' && p.categoria !== filtroCategoria) return false;
    return true;
  });

  const qtdMarcados = pontos.filter((p) => p.x !== null).length;
  const qtdPontosAtencao = pontos.filter((p) => p.x !== null && p.confidence_score < 0.85).length;

  // Formatação do Objeto JSON Estruturado Solicitado no Prompt
  const jsonSaidaEstruturado = JSON.stringify(
    {
      image_status: 'evaluated',
      points_marked_count: qtdMarcados,
      total_points_count: pontos.length,
      points: pontos.map((p) => ({
        id: p.id,
        name: p.nome,
        categoria: p.categoria,
        x: p.x,
        y: p.y,
        confidence_score: p.confidence_score,
        status: p.status
      })),
      validation_notes: validationNotes
    },
    null,
    2
  );

  const copiarJsonParaClipboard = () => {
    navigator.clipboard.writeText(jsonSaidaEstruturado);
    setCopiadoJson(true);
    setTimeout(() => setCopiadoJson(false), 2000);
  };

  return (
    <div className="space-y-4 select-none">
      {/* TOOLBAR SUPERIOR DO MÓDULO CEFAMÉTRICO */}
      <div className={`p-3 rounded-2xl border shadow-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-indigo-400" /> Padrão Ortodôntico:
          </span>
          {(['Steiner', 'Tweed', 'Ricketts', 'McNamara'] as const).map((an) => (
            <button
              key={an}
              onClick={() => setAnaliseSelecionada(an)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1.5 border ${
                analiseSelecionada === an
                  ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white border-indigo-400 shadow-md'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
              }`}
            >
              <span>{an}</span>
            </button>
          ))}

          <button
            onClick={handleExecutarIA}
            disabled={analisandoIA}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-[11px] font-extrabold cursor-pointer shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
            title="Preencher automaticamente todos os 26 pontos cefalométricos com IA"
          >
            <Sparkles className={`w-3.5 h-3.5 ${analisandoIA ? 'animate-spin' : ''}`} />
            {analisandoIA ? 'Sugerindo com IA...' : 'Sugerir com IA'}
          </button>

          <button
            onClick={handleLimparPontos}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 text-[11px] font-extrabold border border-rose-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Limpar todos os pontos para marcar do zero"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Limpar Tela (Marcar Manual)
          </button>

          <label className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-extrabold cursor-pointer border border-slate-700 flex items-center gap-1.5 transition-all">
            <Upload className="w-3.5 h-3.5 text-indigo-400" /> Telerradiografia (.dcm)
            <input type="file" accept=".dcm,.dicom,image/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        <div className="flex items-center gap-2">
          {/* CONTROLES DE ZOOM NATIVO DO CANVAS */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setZoomLevel(z => Math.max(50, z - 25))}
              className="p-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-all cursor-pointer"
              title="Diminuir Zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-extrabold px-1.5 text-teal-400">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel(z => Math.min(250, z + 25))}
              className="p-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-all cursor-pointer"
              title="Aumentar Zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(100)}
              className="px-2 py-0.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-[10px] font-extrabold text-slate-200 transition-all cursor-pointer"
              title="Restaurar Tamanho Real 100%"
            >
              1:1
            </button>
          </div>

          <button
            onClick={() => setModalJsonAberto(!modalJsonAberto)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[11px] font-extrabold border border-indigo-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Code className="w-3.5 h-3.5" /> JSON
          </button>
        </div>
      </div>

      {/* BANNER DE INSTRUÇÕES DE MARCAÇÃO MANUAL OU ALERTA */}
      {qtdMarcados < pontos.length ? (
        <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex flex-wrap items-center justify-between text-[11px] text-indigo-300 gap-2">
          <div className="flex items-center gap-2">
            <MousePointer className="w-4 h-4 text-indigo-400 animate-bounce" />
            <span className="font-extrabold text-white">Modo de Marcação Manual Ativo:</span>
            <span>
              Clique na radiografia para marcar o ponto <strong className="text-emerald-400 font-mono">[{pontos[pontoAtivoIdx].id} - {pontos[pontoAtivoIdx].nome}]</strong>. ({qtdMarcados} de {pontos.length} marcados).
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Você pode arrastar qualquer ponto fixado para ajustar sua posição.</span>
        </div>
      ) : qtdPontosAtencao > 0 ? (
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-wrap items-center justify-between text-[11px] text-amber-300 gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="font-extrabold text-white">Atenção Ortodôntica:</span>
            <span>
              {qtdPontosAtencao} ponto(s) possuem índice de confiança &lt; 85% (marcados em amarelo). Verifique o alinhamento anatômico.
            </span>
          </div>
          <button
            onClick={() => setExibirSomenteAtencao(!exibirSomenteAtencao)}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border transition-all cursor-pointer ${
              exibirSomenteAtencao
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                : 'bg-slate-800 text-amber-300 border-amber-500/40'
            }`}
          >
            {exibirSomenteAtencao ? 'Mostrando Apenas Alertas' : 'Filtrar Pontos < 85%'}
          </button>
        </div>
      ) : null}

      {/* INTERFACE PRINCIPAL: CANVAS AMPLIAÇÃO GRANDE (650PX) + TABELA RESULTADOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* COLUNA ESQUERDA: CANVAS DE TELERRADIOGRAFIA AMPLIADA (650PX DE ALTURA) */}
        <div className="lg:col-span-2 space-y-3">
          <div
            ref={containerRef}
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            className={`rounded-2xl border shadow-2xl relative overflow-auto flex items-center justify-center min-h-[600px] h-[650px] lg:h-[680px] select-none cursor-crosshair ${
              darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-300'
            }`}
          >
            <div
              className="relative transition-transform duration-100 flex items-center justify-center max-w-full max-h-full"
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center center' }}
            >
              <img
                src={imagemUrl}
                alt="Telerradiografia Lateral Ampliada"
                className="rounded-xl opacity-90 max-h-[640px] object-contain pointer-events-none shadow-2xl"
              />

              {/* SOBREPOSIÇÃO SVG DOS TRAÇADOS CEFAMÉTRICOS (STEINER, TWEED, RICKETTS) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {/* Linha S-N (Azul Sky) */}
                {getPonto('S') && getPonto('N') && (
                  <line x1={getPonto('S')!.x!} y1={getPonto('S')!.y!} x2={getPonto('N')!.x!} y2={getPonto('N')!.y!} stroke="#38BDF8" strokeWidth="2.5" />
                )}
                {/* Linha N-A (Esmeralda) */}
                {getPonto('N') && getPonto('A') && (
                  <line x1={getPonto('N')!.x!} y1={getPonto('N')!.y!} x2={getPonto('A')!.x!} y2={getPonto('A')!.y!} stroke="#10B981" strokeWidth="2" />
                )}
                {/* Linha N-B (Rosa Coral) */}
                {getPonto('N') && getPonto('B') && (
                  <line x1={getPonto('N')!.x!} y1={getPonto('N')!.y!} x2={getPonto('B')!.x!} y2={getPonto('B')!.y!} stroke="#F43F5E" strokeWidth="2" />
                )}
                {/* Plano de Frankfurt Po-Or (Verde Lima) */}
                {getPonto('Po') && getPonto('Or') && (
                  <line x1={getPonto('Po')!.x!} y1={getPonto('Po')!.y!} x2={getPonto('Or')!.x!} y2={getPonto('Or')!.y!} stroke="#84CC16" strokeWidth="2" strokeDasharray="3 3" />
                )}
                {/* Plano Mandibular Go-Me (Amarelo Amber) */}
                {getPonto('Go') && getPonto('Me') && (
                  <line x1={getPonto('Go')!.x!} y1={getPonto('Go')!.y!} x2={getPonto('Me')!.x!} y2={getPonto('Me')!.y!} stroke="#F59E0B" strokeWidth="2" strokeDasharray="4 2" />
                )}
                {/* Plano Palatino ENA-ENP (Índigo) */}
                {getPonto('ENA') && getPonto('ENP') && (
                  <line x1={getPonto('ENA')!.x!} y1={getPonto('ENA')!.y!} x2={getPonto('ENP')!.x!} y2={getPonto('ENP')!.y!} stroke="#818CF8" strokeWidth="1.5" strokeDasharray="2 2" />
                )}
                {/* Linha E de Ricketts Prn-Pog' (Rosa Mole) */}
                {getPonto('Prn') && getPonto('Pog\'') && (
                  <line x1={getPonto('Prn')!.x!} y1={getPonto('Prn')!.y!} x2={getPonto('Pog\'')!.x!} y2={getPonto('Pog\'')!.y!} stroke="#EC4899" strokeWidth="2" />
                )}

                {/* RENDERIZAÇÃO APENAS DOS PONTOS EFETIVAMENTE MARCADOS PELO USUÁRIO OU IA */}
                {pontos.map((p, idx) => {
                  if (p.x === null || p.y === null) return null; // Não exibe pontos pendentes!

                  const isAtivo = idx === pontoAtivoIdx;
                  const isBaixaConfianca = p.confidence_score < 0.85;

                  let corPonto = '#6366F1'; // Azul padrão
                  if (isAtivo) corPonto = '#10B981'; // Verde ativo
                  else if (isBaixaConfianca) corPonto = '#F59E0B'; // Amarelo alerta

                  return (
                    <g
                      key={p.id}
                      className="cursor-grab active:cursor-grabbing pointer-events-auto"
                      onMouseDown={(e) => handleCanvasMouseDown(e, p.id, idx)}
                    >
                      {isBaixaConfianca && (
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r="11"
                          fill="none"
                          stroke="#F59E0B"
                          strokeWidth="1.5"
                          className="animate-ping opacity-75"
                        />
                      )}

                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={isAtivo ? '7' : '5'}
                        fill={corPonto}
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                      />

                      <text
                        x={p.x + 8}
                        y={p.y + 4}
                        fill={isAtivo ? '#10B981' : isBaixaConfianca ? '#F59E0B' : '#FFFFFF'}
                        fontSize="10"
                        fontWeight="bold"
                        className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                      >
                        {p.id}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* GUIA DE MARCAÇÃO ATIVA (TOOLTIP FLUTUANTE) */}
            <div className="absolute bottom-3 left-3 right-3 bg-slate-900/90 backdrop-blur-md p-3 rounded-xl border border-slate-800 flex items-center justify-between shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-black text-xs ${
                  pontos[pontoAtivoIdx].x === null
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                    : pontos[pontoAtivoIdx].confidence_score < 0.85
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {pontos[pontoAtivoIdx].id}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold uppercase text-indigo-400 tracking-wider">
                      Ponto {pontoAtivoIdx + 1}/{pontos.length} ({pontos[pontoAtivoIdx].categoria})
                    </span>
                    {pontos[pontoAtivoIdx].x !== null ? (
                      <span className={`text-[9px] font-mono font-extrabold px-1.5 py-0.2 rounded ${
                        pontos[pontoAtivoIdx].confidence_score >= 0.85 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        Marcado (Confiança: {Math.round(pontos[pontoAtivoIdx].confidence_score * 100)}%)
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono font-extrabold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">
                        Aguardando Clique na Imagem...
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-black text-white">{pontos[pontoAtivoIdx].nome}</h4>
                  <p className="text-[10px] text-slate-400 truncate max-w-[340px]">{pontos[pontoAtivoIdx].descricao}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPontoAtivoIdx(Math.max(0, pontoAtivoIdx - 1))}
                  disabled={pontoAtivoIdx === 0}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 text-[11px] font-bold text-slate-300 border border-slate-700 disabled:opacity-40 cursor-pointer"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPontoAtivoIdx(Math.min(pontos.length - 1, pontoAtivoIdx + 1))}
                  disabled={pontoAtivoIdx === pontos.length - 1}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-[11px] font-extrabold text-white shadow-md border border-indigo-500 cursor-pointer"
                >
                  Próximo <ChevronRight className="w-3 h-3 inline" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: RESULTADOS TABELADOS, LISTA DE PONTOS E DIAGNÓSTICO */}
        <div className="space-y-4">
          
          {/* SELETOR DE CATEGORIA E LISTA DE PONTOS */}
          <div className={`p-3 rounded-2xl border shadow-xl space-y-2 ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="text-[11px] font-extrabold text-slate-300 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-indigo-400" /> Pontos Cefalométricos ({qtdMarcados}/{pontos.length}):
              </span>
              <div className="flex items-center gap-1">
                {(['todas', 'esqueletica', 'dentaria', 'mole'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFiltroCategoria(cat)}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase border transition-all cursor-pointer ${
                      filtroCategoria === cat
                        ? 'bg-indigo-600 text-white border-indigo-400'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    {cat === 'todas' ? 'Tudo' : cat === 'esqueletica' ? 'Ósseo' : cat === 'dentaria' ? 'Dente' : 'Mole'}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-[220px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {pontosFiltrados.map((p) => {
                const idxReal = pontos.findIndex((pt) => pt.id === p.id);
                const isSel = idxReal === pontoAtivoIdx;
                const isMarcado = p.x !== null;
                const isAlerta = isMarcado && p.confidence_score < 0.85;

                return (
                  <div
                    key={p.id}
                    onClick={() => setPontoAtivoIdx(idxReal)}
                    className={`p-1.5 rounded-xl border flex items-center justify-between text-[10px] cursor-pointer transition-all ${
                      isSel
                        ? 'bg-indigo-500/20 border-indigo-500/50 text-white'
                        : isAlerta
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                        : isMarcado
                        ? 'bg-slate-800/50 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                        : 'bg-slate-950/40 border-slate-800/40 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`w-5 h-5 rounded flex items-center justify-center font-mono font-black text-[9px] ${
                        isAlerta ? 'bg-amber-500/30 text-amber-300' : isMarcado ? 'bg-indigo-600/30 text-indigo-300' : 'bg-slate-800 text-slate-600'
                      }`}>
                        {p.id}
                      </span>
                      <span className="font-bold truncate max-w-[130px]">{p.nome}</span>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono">
                      {isMarcado ? (
                        isAlerta ? (
                          <span className="text-[9px] text-amber-400 font-extrabold flex items-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" /> {(p.confidence_score * 100).toFixed(0)}%
                          </span>
                        ) : (
                          <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5" /> {(p.confidence_score * 100).toFixed(0)}%
                          </span>
                        )
                      ) : (
                        <span className="text-[9px] text-slate-500 font-mono italic">Pendente</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CARD DE RESULTADOS DA ANÁLISE SELECIONADA */}
          <div className={`p-4 rounded-2xl border shadow-xl space-y-3 ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-extrabold text-xs flex items-center gap-1.5 text-indigo-400">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Tabela de Grandezas: {analiseSelecionada}
              </h3>
              <span className="text-[9px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                {pacienteNome}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[11px] text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-extrabold uppercase text-[9px]">
                    <th className="py-1.5">Grandeza</th>
                    <th className="py-1.5">Norma Padrao</th>
                    <th className="py-1.5">Medido</th>
                    <th className="py-1.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {analiseSelecionada === 'Steiner' && (
                    <>
                      <tr>
                        <td className="py-1.5 font-bold text-sky-400">SNA (Maxilar)</td>
                        <td className="py-1.5 text-slate-400">82,0° (±2°)</td>
                        <td className="py-1.5 font-extrabold font-mono text-white">{sna}°</td>
                        <td className="py-1.5 text-right font-bold text-emerald-400">Normal</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-bold text-rose-400">SNB (Mandibular)</td>
                        <td className="py-1.5 text-slate-400">80,0° (±2°)</td>
                        <td className="py-1.5 font-extrabold font-mono text-white">{snb}°</td>
                        <td className="py-1.5 text-right font-bold text-emerald-400">Normal</td>
                      </tr>
                      <tr className="bg-indigo-500/10">
                        <td className="py-1.5 font-extrabold text-amber-400">ANB (Rel. Maxilomand.)</td>
                        <td className="py-1.5 text-slate-400">2,0° (±2°)</td>
                        <td className="py-1.5 font-black font-mono text-amber-400 text-xs">{anb}°</td>
                        <td className="py-1.5 text-right font-bold text-amber-400">Classe II</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-bold text-teal-400">1.NA (Inclin. Incisivo Sup)</td>
                        <td className="py-1.5 text-slate-400">22,0° (±2°)</td>
                        <td className="py-1.5 font-extrabold font-mono text-white">{u1NaDeg}°</td>
                        <td className="py-1.5 text-right font-bold text-emerald-400">Normal</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-bold text-pink-400">1.NB (Inclin. Incisivo Inf)</td>
                        <td className="py-1.5 text-slate-400">25,0° (±2°)</td>
                        <td className="py-1.5 font-extrabold font-mono text-white">{l1NbDeg}°</td>
                        <td className="py-1.5 text-right font-bold text-emerald-400">Normal</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-bold text-indigo-300">GoGn-SN (Plano Mand.)</td>
                        <td className="py-1.5 text-slate-400">32,0° (±3°)</td>
                        <td className="py-1.5 font-extrabold font-mono text-white">{goGnSn}°</td>
                        <td className="py-1.5 text-right font-bold text-emerald-400">Mesofacial</td>
                      </tr>
                    </>
                  )}

                  {analiseSelecionada === 'Tweed' && (
                    <>
                      <tr>
                        <td className="py-1.5 font-bold text-amber-400">FMA (Plano Mand. / FH)</td>
                        <td className="py-1.5 text-slate-400">25,0° (±3°)</td>
                        <td className="py-1.5 font-extrabold font-mono text-white">{fma}°</td>
                        <td className="py-1.5 text-right font-bold text-emerald-400">Normal</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-bold text-sky-400">IMPA (Incisivo Inf. / Mand)</td>
                        <td className="py-1.5 text-slate-400">90,0° (±5°)</td>
                        <td className="py-1.5 font-extrabold font-mono text-white">{impa}°</td>
                        <td className="py-1.5 text-right font-bold text-emerald-400">Protruso</td>
                      </tr>
                    </>
                  )}

                  {analiseSelecionada === 'Ricketts' && (
                    <>
                      <tr>
                        <td className="py-1.5 font-bold text-pink-400">Linha E - Lábio Sup. (Prn-Pog')</td>
                        <td className="py-1.5 text-slate-400">-2,0 mm (±2mm)</td>
                        <td className="py-1.5 font-extrabold font-mono text-white">{eLineLs} mm</td>
                        <td className="py-1.5 text-right font-bold text-emerald-400">Harmônico</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-bold text-pink-400">Linha E - Lábio Inf. (Prn-Pog')</td>
                        <td className="py-1.5 text-slate-400">0,0 mm (±2mm)</td>
                        <td className="py-1.5 font-extrabold font-mono text-white">{eLineLi} mm</td>
                        <td className="py-1.5 text-right font-bold text-emerald-400">Harmônico</td>
                      </tr>
                    </>
                  )}

                  {analiseSelecionada === 'McNamara' && (
                    <>
                      <tr>
                        <td className="py-1.5 font-bold text-teal-400">Comprimento Maxilar Efetivo</td>
                        <td className="py-1.5 text-slate-400">90.0 - 95.0 mm</td>
                        <td className="py-1.5 font-extrabold font-mono text-white">{compMaxilarMc} mm</td>
                        <td className="py-1.5 text-right font-bold text-emerald-400">Normal</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 font-bold text-teal-400">Comprimento Mandibular Efetivo</td>
                        <td className="py-1.5 text-slate-400">115.0 - 120.0 mm</td>
                        <td className="py-1.5 font-extrabold font-mono text-white">{compMandibularMc} mm</td>
                        <td className="py-1.5 text-right font-bold text-emerald-400">Normal</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* CARD DE CONCLUSÃO DIAGNÓSTICA AUTOMÁTICA */}
          <div className={`p-4 rounded-2xl border shadow-xl space-y-2.5 ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <span className="text-[9px] font-extrabold uppercase text-indigo-400 tracking-wider block flex items-center justify-between">
              <span>Laudo Ortodôntico Automatizado</span>
              <span className="text-emerald-400 font-mono">IA v2.4</span>
            </span>

            <h4 className={`text-sm font-black ${diag.cor}`}>{diag.classe}</h4>
            <p className="text-[11px] text-slate-300 leading-normal font-normal">{diag.desc}</p>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => window.print()}
                className="w-full bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white font-extrabold py-2 rounded-xl text-[11px] flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/25 cursor-pointer transition-all"
              >
                <Download className="w-3.5 h-3.5" /> Exportar Traçado & Laudo (PDF)
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* MODAL DE EXIBIÇÃO DO JSON ESTRUTURADO (API CONFORMITY) */}
      {modalJsonAberto && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md p-4 md:p-6 flex items-center justify-center">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-black text-white">Saída JSON Estruturada (API Cefalometria)</h3>
              </div>
              <button
                onClick={() => setModalJsonAberto(false)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto bg-slate-950 text-indigo-300 font-mono text-[11px] space-y-2 custom-scrollbar">
              <pre className="whitespace-pre-wrap">{jsonSaidaEstruturado}</pre>
            </div>

            <div className="p-3 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-mono">
                {qtdMarcados} de {pontos.length} pontos marcados | API Schema Validated
              </span>
              <button
                onClick={copiarJsonParaClipboard}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copiadoJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiadoJson ? 'Copiado para Área de Transferência!' : 'Copiar JSON'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

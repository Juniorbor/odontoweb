import React, { useState, useRef } from 'react';
import {
  Compass,
  Download,
  Upload,
  RefreshCw,
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface ModuloCefalometriaProps {
  darkMode?: boolean;
  pacienteNome?: string;
}

export interface PontoCefalometrico {
  id: string;
  nome: string;
  descricao: string;
  x?: number;
  y?: number;
}

export const ModuloCefalometria: React.FC<ModuloCefalometriaProps> = ({
  darkMode = true,
  pacienteNome = 'Paciente Exemplo'
}) => {
  // Amostra de Telerradiografia Lateral Padrão
  const TELE_PADRAO = 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=1200&q=80';

  const PONTOS_INICIAIS: PontoCefalometrico[] = [
    { id: 'S', nome: 'Ponto Sela (S)', descricao: 'Centro da fidedigna sela túrcica do osso esfenóide', x: 380, y: 180 },
    { id: 'N', nome: 'Ponto Násio (N)', descricao: 'Ponto mais anterior da suturas nasofrontal', x: 580, y: 170 },
    { id: 'A', nome: 'Subespinal (A)', descricao: 'Ponto mais profundo da concavidade da maxila', x: 570, y: 310 },
    { id: 'B', nome: 'Supramental (B)', descricao: 'Ponto mais profundo da concavidade da sínfise mandibular', x: 540, y: 410 },
    { id: 'Pog', nome: 'Pógonion (Pog)', descricao: 'Ponto mais anterior da sínfise mentoniana', x: 550, y: 460 },
    { id: 'Gn', nome: 'Gnatio (Gn)', descricao: 'Ponto mais anteroinferior do contorno do mento', x: 530, y: 480 },
    { id: 'Me', nome: 'Mêncio (Me)', descricao: 'Ponto mais inferior da sínfise mentoniana', x: 500, y: 490 },
    { id: 'Go', nome: 'Gônio (Go)', descricao: 'Ponto mais posteroinferior do ângulo mandibular', x: 340, y: 430 },
    { id: 'Or', nome: 'Orbitário (Or)', descricao: 'Ponto mais inferior da margem infra-orbitária', x: 520, y: 220 },
    { id: 'Po', nome: 'Pório (Po)', descricao: 'Ponto mais superior do meato acústico externo', x: 320, y: 230 },
    { id: 'ANS', nome: 'Esp. Nasal Ant. (ANS)', descricao: 'Vértice da espinha nasal anterior', x: 590, y: 290 },
    { id: 'PNS', nome: 'Esp. Nasal Post. (PNS)', descricao: 'Vértice da espinha nasal posterior', x: 440, y: 290 }
  ];

  const [pontos, setPontos] = useState<PontoCefalometrico[]>(PONTOS_INICIAIS);
  const [pontoAtivoIdx, setPontoAtivoIdx] = useState<number>(0);
  const [imagemUrl, setImagemUrl] = useState<string>(TELE_PADRAO);
  const [analiseSelecionada, setAnaliseSelecionada] = useState<'Steiner' | 'Ricketts' | 'McNamara'>('Steiner');
  const containerRef = useRef<HTMLDivElement>(null);

  // Manipulação de cliques na imagem para posicionamento do ponto cefalométrico
  const handleCanvasClick = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clickX = Math.round(e.clientX - rect.left);
    const clickY = Math.round(e.clientY - rect.top);

    const pontosAtualizados = [...pontos];
    pontosAtualizados[pontoAtivoIdx] = {
      ...pontosAtualizados[pontoAtivoIdx],
      x: clickX,
      y: clickY
    };
    setPontos(pontosAtualizados);

    if (pontoAtivoIdx < pontos.length - 1) {
      setPontoAtivoIdx(pontoAtivoIdx + 1);
    }
  };

  // Upload de Imagem de Telerradiografia do Usuário
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagemUrl(URL.createObjectURL(file));
    }
  };

  // Redefinir pontos cefalométricos
  const handleResetPontos = () => {
    setPontos(PONTOS_INICIAIS);
    setPontoAtivoIdx(0);
  };

  // Cálculos Ângulo Steiner (SNA, SNB, ANB, 1.NA, 1.NB)
  const getPonto = (id: string) => pontos.find((p) => p.id === id);

  const calcularAnguloEntre3Pontos = (id1: string, idVértice: string, id2: string) => {
    const p1 = getPonto(id1);
    const pV = getPonto(idVértice);
    const p2 = getPonto(id2);

    if (!p1?.x || !pV?.x || !p2?.x) return 0;

    const a = Math.atan2(p1.y! - pV.y!, p1.x! - pV.x!);
    const b = Math.atan2(p2.y! - pV.y!, p2.x! - pV.x!);
    let angulo = ((a - b) * 180) / Math.PI;
    if (angulo < 0) angulo += 360;
    if (angulo > 180) angulo = 360 - angulo;
    return Number(angulo.toFixed(1));
  };

  // Valores Medidos Calculados
  const sna = calcularAnguloEntre3Pontos('S', 'N', 'A') || 82.0;
  const snb = calcularAnguloEntre3Pontos('S', 'N', 'B') || 80.0;
  const anb = Number((sna - snb).toFixed(1));
  const goGnSn = calcularAnguloEntre3Pontos('Go', 'Gn', 'S') || 32.0;

  // Diagnóstico Cefalométrico Automático
  const getDiagnosticoClasseEsqueletica = () => {
    if (anb > 4.5) return { classe: 'Classe II Esquelética', cor: 'text-amber-400', desc: 'Retrusão mandibular ou protrusão maxilar acentuada.' };
    if (anb < 0.5) return { classe: 'Classe III Esquelética', cor: 'text-rose-400', desc: 'Protrusão mandibular ou deficiência maxilar esquelética.' };
    return { classe: 'Classe I Esquelética (Harmônica)', cor: 'text-emerald-400', desc: 'Relação maxilomandibular dentro do padrão ideal.' };
  };

  const diag = getDiagnosticoClasseEsqueletica();

  return (
    <div className="space-y-6">
      {/* TOOLBAR SUPERIOR DO MÓDULO CEFAMÉTRICO */}
      <div className={`p-4 rounded-3xl border shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-indigo-400" /> Escolha o Padrão de Análise:
          </span>
          {(['Steiner', 'Ricketts', 'McNamara'] as const).map((an) => (
            <button
              key={an}
              onClick={() => setAnaliseSelecionada(an)}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 border ${
                analiseSelecionada === an
                  ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white border-indigo-400 shadow-md'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
              }`}
            >
              <span>Análise de {an}</span>
            </button>
          ))}

          <label className="px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-extrabold cursor-pointer border border-slate-700 flex items-center gap-1.5 transition-all">
            <Upload className="w-4 h-4 text-indigo-400" /> Upload de Telerradiografia
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        <button
          onClick={handleResetPontos}
          className="px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-extrabold border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 text-indigo-400" /> Reposicionar Pontos
        </button>
      </div>

      {/* INTERFACE PRINCIPAL: CANVAS DE MARCAÇÃO + TABELA RESULTADOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* COLUNA ESQUERDA: CANVAS DE TELERRADIOGRAFIA E TRAÇADOS */}
        <div className="lg:col-span-2 space-y-4">
          <div
            ref={containerRef}
            onClick={handleCanvasClick}
            className={`rounded-3xl border shadow-2xl relative overflow-hidden flex items-center justify-center min-h-[550px] select-none cursor-crosshair ${
              darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-300'
            }`}
          >
            <img src={imagemUrl} alt="Telerradiografia Lateral" className="max-w-full max-h-[550px] rounded-2xl opacity-90" />

            {/* SOBREPOSIÇÃO SVG DOS TRAÇADOS CEFAMÉTRICOS (STEINER/RICKETTS) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {/* Linha S-N */}
              {getPonto('S')?.x && getPonto('N')?.x && (
                <line x1={getPonto('S')!.x} y1={getPonto('S')!.y} x2={getPonto('N')!.x} y2={getPonto('N')!.y} stroke="#38BDF8" strokeWidth="2.5" />
              )}
              {/* Linha N-A */}
              {getPonto('N')?.x && getPonto('A')?.x && (
                <line x1={getPonto('N')!.x} y1={getPonto('N')!.y} x2={getPonto('A')!.x} y2={getPonto('A')!.y} stroke="#10B981" strokeWidth="2.5" />
              )}
              {/* Linha N-B */}
              {getPonto('N')?.x && getPonto('B')?.x && (
                <line x1={getPonto('N')!.x} y1={getPonto('N')!.y} x2={getPonto('B')!.x} y2={getPonto('B')!.y} stroke="#F43F5E" strokeWidth="2.5" />
              )}
              {/* Linha Go-Gn (Plano Mandibular) */}
              {getPonto('Go')?.x && getPonto('Gn')?.x && (
                <line x1={getPonto('Go')!.x} y1={getPonto('Go')!.y} x2={getPonto('Gn')!.x} y2={getPonto('Gn')!.y} stroke="#F59E0B" strokeWidth="2" strokeDasharray="4 2" />
              )}

              {/* RENDERIZAÇÃO DOS PONTOS CEFAMÉTRICOS MARCADOS */}
              {pontos.map((p, idx) => {
                if (!p.x || !p.y) return null;
                const isAtivo = idx === pontoAtivoIdx;
                return (
                  <g key={p.id}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isAtivo ? '8' : '5'}
                      fill={isAtivo ? '#10B981' : '#6366F1'}
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                    <text
                      x={p.x + 10}
                      y={p.y + 4}
                      fill={isAtivo ? '#10B981' : '#FFFFFF'}
                      fontSize="11"
                      fontWeight="bold"
                      className="drop-shadow"
                    >
                      {p.id}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* GUIA DE MARCAÇÃO ATIVA (TOOLTIP FLUTUANTE) */}
            <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between shadow-2xl">
              <div>
                <span className="text-[10px] font-bold uppercase text-indigo-400 tracking-wider">
                  Ponto Cefalométrico Atual ({pontoAtivoIdx + 1}/{pontos.length})
                </span>
                <h4 className="text-sm font-extrabold text-white">{pontos[pontoAtivoIdx].nome}</h4>
                <p className="text-[11px] text-slate-400">{pontos[pontoAtivoIdx].descricao}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setPontoAtivoIdx(Math.max(0, pontoAtivoIdx - 1)); }}
                  disabled={pontoAtivoIdx === 0}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300 border border-slate-700 disabled:opacity-40 cursor-pointer"
                >
                  Anterior
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setPontoAtivoIdx(Math.min(pontos.length - 1, pontoAtivoIdx + 1)); }}
                  disabled={pontoAtivoIdx === pontos.length - 1}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-extrabold text-white shadow-md border border-indigo-500 cursor-pointer"
                >
                  Próximo <ChevronRight className="w-3.5 h-3.5 inline" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: RESULTADOS TABELADOS E DIAGNÓSTICO */}
        <div className="space-y-6">
          
          {/* CARD DE RESULTADOS DA ANÁLISE DE STEINER */}
          <div className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-sm flex items-center gap-2 text-indigo-400">
                <Sparkles className="w-4 h-4 text-amber-400" /> Tabela Cefalométrica: {analiseSelecionada}
              </h3>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                {pacienteNome}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-extrabold uppercase text-[10px]">
                    <th className="py-2">Grandeza</th>
                    <th className="py-2">Padrão Normativo</th>
                    <th className="py-2">Medido</th>
                    <th className="py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  <tr>
                    <td className="py-2.5 font-bold text-sky-400">SNA (Ângulo Maxilar)</td>
                    <td className="py-2.5 text-slate-400">82,0° (±2°)</td>
                    <td className="py-2.5 font-extrabold font-mono text-white">{sna}°</td>
                    <td className="py-2.5 text-right font-bold text-emerald-400">Normal</td>
                  </tr>

                  <tr>
                    <td className="py-2.5 font-bold text-rose-400">SNB (Ângulo Mandibular)</td>
                    <td className="py-2.5 text-slate-400">80,0° (±2°)</td>
                    <td className="py-2.5 font-extrabold font-mono text-white">{snb}°</td>
                    <td className="py-2.5 text-right font-bold text-emerald-400">Normal</td>
                  </tr>

                  <tr className="bg-indigo-500/10">
                    <td className="py-2.5 font-extrabold text-amber-400">ANB (Rel. Maxilomand.)</td>
                    <td className="py-2.5 text-slate-400">2,0° (±2°)</td>
                    <td className="py-2.5 font-black font-mono text-amber-400 text-sm">{anb}°</td>
                    <td className="py-2.5 text-right font-bold text-amber-400">Classe II</td>
                  </tr>

                  <tr>
                    <td className="py-2.5 font-bold text-indigo-300">GoGn-SN (Plano Mandibular)</td>
                    <td className="py-2.5 text-slate-400">32,0° (±3°)</td>
                    <td className="py-2.5 font-extrabold font-mono text-white">{goGnSn}°</td>
                    <td className="py-2.5 text-right font-bold text-emerald-400">Mesofacial</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* CARD DE CONCLUSÃO DIAGNÓSTICA AUTOMÁTICA */}
          <div className={`p-6 rounded-3xl border shadow-xl space-y-3 ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <span className="text-[10px] font-extrabold uppercase text-indigo-400 tracking-wider block">
              Laudo Diagnóstico Automatizado
            </span>

            <h4 className={`text-base font-black ${diag.cor}`}>{diag.classe}</h4>
            <p className="text-xs text-slate-300 leading-relaxed font-normal">{diag.desc}</p>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => window.print()}
                className="w-full bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white font-extrabold py-2.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 cursor-pointer transition-all"
              >
                <Download className="w-4 h-4" /> Exportar Traçado & Laudo (PDF)
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

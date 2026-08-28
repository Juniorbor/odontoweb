import React, { useState } from 'react';
import { Target, Plus, Trash2 } from 'lucide-react';

interface MetaSonho {
  id: string;
  titulo: string;
  valorMeta: number;
  valorAcumulado: number;
  prazoMeses: number;
  categoria: 'Viagem' | 'Veículo' | 'Reserva' | 'Equipamento' | 'Imóvel' | 'Outro';
}

interface SimuladorSonhosMetasProps {
  darkMode?: boolean;
}

export const SimuladorSonhosMetas: React.FC<SimuladorSonhosMetasProps> = ({ darkMode }) => {
  const [metas, setMetas] = useState<MetaSonho[]>([
    {
      id: 'm1',
      titulo: 'Viagem de Férias da Família',
      valorMeta: 15000,
      valorAcumulado: 6200,
      prazoMeses: 10,
      categoria: 'Viagem'
    },
    {
      id: 'm2',
      titulo: 'Troca de Veículo / Carro Novo',
      valorMeta: 60000,
      valorAcumulado: 18000,
      prazoMeses: 24,
      categoria: 'Veículo'
    },
    {
      id: 'm3',
      titulo: 'Reserva de Emergência de 6 Meses',
      valorMeta: 30000,
      valorAcumulado: 19500,
      prazoMeses: 12,
      categoria: 'Reserva'
    }
  ]);

  const [modalNovo, setModalNovo] = useState<boolean>(false);
  const [titulo, setTitulo] = useState<string>('');
  const [valorMeta, setValorMeta] = useState<number>(10000);
  const [valorAcumulado, setValorAcumulado] = useState<number>(1000);
  const [prazoMeses, setPrazoMeses] = useState<number>(12);
  const [categoria, setCategoria] = useState<'Viagem' | 'Veículo' | 'Reserva' | 'Equipamento' | 'Imóvel' | 'Outro'>('Viagem');

  const handleAdicionarMeta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    const nova: MetaSonho = {
      id: `meta-${Date.now()}`,
      titulo,
      valorMeta,
      valorAcumulado,
      prazoMeses,
      categoria
    };

    setMetas([nova, ...metas]);
    setModalNovo(false);
    setTitulo('');
  };

  const handleRemoverMeta = (id: string) => {
    setMetas(metas.filter((m) => m.id !== id));
  };

  return (
    <div className="space-y-6 font-sans animate-fadeIn">
      {/* Banner Metas & Sonhos */}
      <div className={`p-6 rounded-3xl border shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
        darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-2xl border border-purple-500/20 shrink-0">
            <Target className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/30 uppercase tracking-widest">
              Planejamento Familiar & Conquistas
            </span>
            <h3 className="text-xl font-bold mt-1 flex items-center gap-2 text-white">
              Simulador de Sonhos & Objetivos Financeiros de Longo Prazo
            </h3>
            <p className="text-xs text-slate-400 font-normal">
              Acompanhamento de metas de economia da família, viagens, veículos e reservas com cálculo mensal de aporte.
            </p>
          </div>
        </div>

        <button
          onClick={() => setModalNovo(true)}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-purple-600/20 cursor-pointer shrink-0"
        >
          <Plus className="w-4.5 h-4.5" /> + Cadastrar Nova Meta / Sonho
        </button>
      </div>

      {/* CARDS DE METAS E SONHOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {metas.map((m) => {
          const falta = Math.max(0, m.valorMeta - m.valorAcumulado);
          const pct = Math.min(100, Math.round((m.valorAcumulado / m.valorMeta) * 100));
          const aporteMensalNecessario = m.prazoMeses > 0 ? Math.round(falta / m.prazoMeses) : 0;

          return (
            <div
              key={m.id}
              className={`p-6 rounded-3xl border shadow-xl space-y-4 relative transition-all ${
                darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/30 uppercase tracking-widest">
                  {m.categoria}
                </span>

                <button
                  onClick={() => handleRemoverMeta(m.id)}
                  className="text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h4 className="font-bold text-base text-white">{m.titulo}</h4>
                <div className="flex justify-between items-baseline mt-1">
                  <span className="text-xl font-bold text-emerald-400">
                    R$ {m.valorAcumulado.toLocaleString('pt-BR')}
                  </span>
                  <span className="text-xs text-slate-400">Meta: R$ {m.valorMeta.toLocaleString('pt-BR')}</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs font-normal">
                <div className="flex justify-between text-slate-400">
                  <span>Progresso do Sonho:</span>
                  <strong className="text-purple-400 font-bold">{pct}% Concluído</strong>
                </div>

                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  ></div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs flex justify-between items-center">
                <span className="text-slate-400">Aporte mensal necessário:</span>
                <strong className="text-amber-400 font-bold">R$ {aporteMensalNecessario.toLocaleString('pt-BR')}/mês ({m.prazoMeses} meses)</strong>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL ADICIONAR NOVA META */}
      {modalNovo && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className={`p-6 rounded-3xl border max-w-md w-full shadow-2xl space-y-4 ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className="font-bold text-base text-white border-b border-slate-800 pb-2">Nova Meta / Sonho da Família</h3>

            <form onSubmit={handleAdicionarMeta} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] text-slate-400 font-semibold mb-1">Título do Objetivo</label>
                <input
                  type="text"
                  placeholder="Ex: Reforma da Casa, Viagem para Disney"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 font-semibold mb-1">Valor Meta (R$)</label>
                  <input
                    type="number"
                    value={valorMeta}
                    onChange={(e) => setValorMeta(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 font-semibold mb-1">Valor Guardado (R$)</label>
                  <input
                    type="number"
                    value={valorAcumulado}
                    onChange={(e) => setValorAcumulado(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-purple-400 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 font-semibold mb-1">Prazo em Meses</label>
                  <input
                    type="number"
                    value={prazoMeses}
                    onChange={(e) => setPrazoMeses(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 font-semibold mb-1">Categoria</label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold"
                  >
                    <option value="Viagem">Viagem</option>
                    <option value="Veículo">Veículo</option>
                    <option value="Reserva">Reserva</option>
                    <option value="Equipamento">Equipamento</option>
                    <option value="Imóvel">Imóvel</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalNovo(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl shadow-lg cursor-pointer"
                >
                  Salvar Meta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

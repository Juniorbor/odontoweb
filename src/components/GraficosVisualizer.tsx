import React from 'react';
import { BarChart3, PieChart } from 'lucide-react';
import type { ItemProducaoTomo, TransacaoPessoal } from '../types';

interface GraficosVisualizerProps {
  itensProducao: ItemProducaoTomo[];
  transacoesFinanceiras: TransacaoPessoal[];
  darkMode?: boolean;
}

export const GraficosVisualizer: React.FC<GraficosVisualizerProps> = ({
  itensProducao,
  transacoesFinanceiras,
  darkMode
}) => {
  const clinicas = ['Ariquemes', 'Porto Velho', 'Machadinho', 'Cacoal', 'Rolim de Moura', 'Ouro Preto', 'Ji-Paraná'];

  const faturamentoPorClinica = clinicas.map((c) => {
    const total = itensProducao.filter((i) => i.unidade === c).reduce((acc, i) => acc + i.valor, 0);
    return { clinica: c, total };
  });

  const maiorFaturamento = Math.max(...faturamentoPorClinica.map((c) => c.total), 1);

  const categoriasMap: Record<string, number> = {};
  transacoesFinanceiras
    .filter((t) => t.tipo !== 'Entrada')
    .forEach((t) => {
      categoriasMap[t.categoria] = (categoriasMap[t.categoria] || 0) + t.valor;
    });

  const despesasCategorias = Object.entries(categoriasMap).map(([categoria, valor]) => ({ categoria, valor }));
  const totalDespesas = despesasCategorias.reduce((acc, c) => acc + c.valor, 1);

  return (
    <div className="space-y-6 font-sans animate-fadeIn">
      {/* Top Banner Gráficos */}
      <div className={`p-6 rounded-3xl border shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
        darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-sky-500/10 text-sky-400 rounded-2xl border border-sky-500/20 shrink-0">
            <BarChart3 className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-500/30 uppercase tracking-widest">
              Visualizador de Dados 2026
            </span>
            <h3 className="text-xl font-bold mt-1 flex items-center gap-2 text-white">
              Gráficos de Produção por Clínica & Gastos por Categoria
            </h3>
            <p className="text-xs text-slate-400 font-normal">
              Análise em barras dinâmicas para acompanhar a distribuição de entradas e despesas domésticas.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-normal">
        {/* GRÁFICO 1: Faturamento por Clínica */}
        <div className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
          darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <h4 className="font-bold text-sm text-white uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-teal-400" /> Produção por Clínica (R$)
          </h4>

          <div className="space-y-3 pt-2">
            {faturamentoPorClinica.map((item) => {
              const pct = Math.round((item.total / maiorFaturamento) * 100);
              return (
                <div key={item.clinica} className="space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-300">{item.clinica}</span>
                    <span className="text-teal-400 font-bold">R$ {item.total.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(4, pct)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* GRÁFICO 2: Gastos do Lar por Categoria */}
        <div className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
          darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <h4 className="font-bold text-sm text-white uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-rose-400" /> Gastos por Categoria (Orçamento)
          </h4>

          <div className="space-y-3 pt-2">
            {despesasCategorias.length === 0 ? (
              <p className="text-slate-400 text-center py-6">Nenhuma despesa cadastrada para exibir o gráfico.</p>
            ) : (
              despesasCategorias.map((item) => {
                const pct = Math.round((item.valor / totalDespesas) * 100);
                return (
                  <div key={item.categoria} className="space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-300">{item.categoria}</span>
                      <span className="text-rose-400 font-bold">R$ {item.valor.toLocaleString('pt-BR')} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-rose-500 to-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(4, pct)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { BarChart3, PieChart, DollarSign } from 'lucide-react';
import type { TransacaoPessoal } from '../types';

interface GraficosVisualizerProps {
  transacoesFinanceiras: TransacaoPessoal[];
  darkMode?: boolean;
}

export const GraficosVisualizer: React.FC<GraficosVisualizerProps> = ({
  transacoesFinanceiras,
  darkMode
}) => {
  const totalEntradas = transacoesFinanceiras
    .filter((t) => t.tipo === 'Entrada')
    .reduce((acc, t) => acc + t.valor, 0);

  const totalFixas = transacoesFinanceiras
    .filter((t) => t.tipo === 'Despesa Fixa')
    .reduce((acc, t) => acc + t.valor, 0);

  const totalVariaveis = transacoesFinanceiras
    .filter((t) => t.tipo === 'Despesa Variável')
    .reduce((acc, t) => acc + t.valor, 0);

  const totalDespesas = totalFixas + totalVariaveis;
  const saldoLiquido = totalEntradas - totalDespesas;

  const maiorValorBalanço = Math.max(totalEntradas, totalDespesas, 1);

  const categoriasMap: Record<string, number> = {};
  transacoesFinanceiras
    .filter((t) => t.tipo !== 'Entrada')
    .forEach((t) => {
      categoriasMap[t.categoria] = (categoriasMap[t.categoria] || 0) + t.valor;
    });

  const despesasCategorias = Object.entries(categoriasMap).map(([categoria, valor]) => ({ categoria, valor }));
  const totalDespesasCategoria = despesasCategorias.reduce((acc, c) => acc + c.valor, 1);

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
              Visualizador de Dados Financeiros
            </span>
            <h3 className="text-xl font-bold mt-1 flex items-center gap-2 text-white">
              Gráficos de Entradas vs Despesas & Distribuição por Categoria
            </h3>
            <p className="text-xs text-slate-400 font-normal">
              Análise em barras dinâmicas para acompanhar a evolução das suas receitas e despesas domésticas.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-normal">
        {/* GRÁFICO 1: Balanço de Entradas vs Saídas */}
        <div className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
          darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <h4 className="font-bold text-sm text-white uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" /> Balanço de Entradas vs Saídas (R$)
          </h4>

          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="text-emerald-400">Renda & Entradas Totais</span>
                <span className="text-emerald-400 font-bold">R$ {totalEntradas.toLocaleString('pt-BR')}</span>
              </div>
              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round((totalEntradas / maiorValorBalanço) * 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="text-rose-400">Despesas Totais do Lar</span>
                <span className="text-rose-400 font-bold">R$ {totalDespesas.toLocaleString('pt-BR')}</span>
              </div>
              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round((totalDespesas / maiorValorBalanço) * 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">Saldo Restante:</span>
              <strong className={saldoLiquido >= 0 ? 'text-teal-400 font-bold' : 'text-rose-400 font-bold'}>
                R$ {saldoLiquido.toLocaleString('pt-BR')}
              </strong>
            </div>
          </div>
        </div>

        {/* GRÁFICO 2: Gastos do Lar por Categoria */}
        <div className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
          darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <h4 className="font-bold text-sm text-white uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-rose-400" /> Gastos por Categoria (Orçamento)
          </h4>

          <div className="space-y-3 pt-2 max-h-56 overflow-y-auto pr-1">
            {despesasCategorias.length === 0 ? (
              <p className="text-slate-400 text-center py-6">Nenhuma despesa cadastrada para exibir o gráfico.</p>
            ) : (
              despesasCategorias.map((item) => {
                const pct = Math.round((item.valor / totalDespesasCategoria) * 100);
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

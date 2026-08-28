import React, { useState, useEffect } from 'react';
import type { TransacaoPessoal } from '../types';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Download,
  PieChart,
  Printer,
  Filter,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  Clock
} from 'lucide-react';

import { getUserKeys } from '../services/cloudSync';

interface RelatoriosProps {
  darkMode?: boolean;
  userRole?: 'admin' | 'cliente';
  usuarioId?: string;
}

export const Relatorios: React.FC<RelatoriosProps> = ({ darkMode, usuarioId }) => {
  const userKeys = getUserKeys(usuarioId);
  const chaveFinanceiro = userKeys.FINANCEIRO;

  const [transacoesFinanceiras, setTransacoesFinanceiras] = useState<TransacaoPessoal[]>(() => {
    const salvo = localStorage.getItem(chaveFinanceiro);
    if (salvo) {
      try { return JSON.parse(salvo); } catch (e) {}
    }
    return [];
  });

  const [filtroPeriodo, setFiltroPeriodo] = useState<string>('todos');

  useEffect(() => {
    const atualizar = () => {
      const f = localStorage.getItem(chaveFinanceiro);
      if (f) {
        try { setTransacoesFinanceiras(JSON.parse(f)); } catch (e) {}
      } else {
        setTransacoesFinanceiras([]);
      }
    };

    atualizar();
    window.addEventListener('storage', atualizar);
    const interval = setInterval(atualizar, 1000);

    return () => {
      window.removeEventListener('storage', atualizar);
      clearInterval(interval);
    };
  }, [chaveFinanceiro]);

  // FILTRAGEM POR PERÍODO DE DATA
  const hoje = new Date();
  const primeiroDiaMesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];

  const transacoesFiltradas = transacoesFinanceiras.filter((t) => {
    if (filtroPeriodo === 'mes_atual') return t.data >= primeiroDiaMesAtual;
    return true;
  });

  // --- ESTATÍSTICAS DO FINANCEIRO DO USUÁRIO ---
  const totalEntradas = transacoesFiltradas
    .filter((t) => t.tipo === 'Entrada')
    .reduce((acc, t) => acc + t.valor, 0);

  const totalDespesasFixas = transacoesFiltradas
    .filter((t) => t.tipo === 'Despesa Fixa')
    .reduce((acc, t) => acc + t.valor, 0);

  const totalDespesasVariaveis = transacoesFiltradas
    .filter((t) => t.tipo === 'Despesa Variável')
    .reduce((acc, t) => acc + t.valor, 0);

  const totalDespesasGerais = totalDespesasFixas + totalDespesasVariaveis;
  const saldoLiquidoGeral = totalEntradas - totalDespesasGerais;
  const comprometimentoRenda = totalEntradas > 0 ? Math.round((totalDespesasGerais / totalEntradas) * 100) : 0;

  const totalContasPagas = transacoesFiltradas.filter((t) => t.status === 'Pago').length;
  const totalContasPendentes = transacoesFiltradas.filter((t) => t.status === 'Pendente').length;

  // CATEGORIAS FINANCEIRAS
  const categoriasMap: Record<string, number> = {};
  transacoesFiltradas.forEach((t) => {
    if (t.tipo !== 'Entrada') {
      categoriasMap[t.categoria] = (categoriasMap[t.categoria] || 0) + t.valor;
    }
  });

  const categoriasData = Object.keys(categoriasMap).map((cat) => ({
    categoria: cat,
    valor: categoriasMap[cat],
    pct: totalDespesasGerais > 0 ? Math.round((categoriasMap[cat] / totalDespesasGerais) * 100) : 0
  })).sort((a, b) => b.valor - a.valor);

  // EXPORTAÇÃO CSV DE RELATÓRIO DO USUÁRIO
  const handleExportarCSV = () => {
    let csv = 'MÓDULO,DESCRIÇÃO,CATEGORIA,TIPO,STATUS,DATA,VALOR (R$)\n';

    transacoesFiltradas.forEach((t) => {
      csv += `"FINANCEIRO PESSOAL","${t.descricao}","${t.categoria}","${t.tipo}","${t.status}","${t.data}","R$ ${t.valor.toFixed(2)}"\n`;
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Relatorio_Financeiro_Pessoal_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 w-full max-w-full animate-fadeIn font-sans text-slate-200">
      
      {/* Header Top Bar */}
      <div className={`p-6 rounded-3xl border shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-teal-500/10 text-teal-400 rounded-2xl border border-teal-500/20 shrink-0">
            <BarChart3 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/30 uppercase tracking-widest">
                Relatórios Pessoais Prontos
              </span>
              <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                Sincronizado
              </span>
            </div>
            <h2 className="text-xl font-bold mt-0.5 flex items-center gap-2">
              Relatórios Analíticos do Seu Financeiro
            </h2>
            <p className="text-xs text-slate-400 font-normal">
              Indicadores de Entradas, Despesas Fixas/Variáveis do Lar e Balanço Orçamentário Pessoal.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={() => window.print()}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer shadow flex-1 md:flex-none"
          >
            <Printer className="w-4 h-4 text-teal-400" /> Imprimir Relatório (PDF)
          </button>

          <button
            type="button"
            onClick={handleExportarCSV}
            className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 transition-all cursor-pointer flex-1 md:flex-none"
          >
            <Download className="w-4 h-4" /> Exportar Planilha (CSV)
          </button>
        </div>
      </div>

      {/* SELETOR DE FILTROS DE PERÍODO */}
      <div className="bg-slate-950 p-2 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 shadow-inner text-xs font-semibold">
        <span className="text-slate-400 flex items-center gap-1.5 pl-2">
          <Filter className="w-3.5 h-3.5 text-teal-400" /> Período dos Dados:
        </span>

        <select
          value={filtroPeriodo}
          onChange={(e) => setFiltroPeriodo(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-white px-3 py-1.5 rounded-xl font-medium focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
        >
          <option value="todos">Todos os Lançamentos Registrados</option>
          <option value="mes_atual">Mês Atual</option>
        </select>
      </div>

      {/* 4 CARDS KPI ANALÍTICOS PRINCIPAIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI 1: Entradas */}
        <div className="card-cyber p-5 rounded-3xl">
          <div className="flex justify-between items-center text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <span>Renda & Entradas</span>
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black mt-2 text-emerald-400 tracking-tight">
            R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] font-bold text-emerald-300 mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Total registrado no painel
          </span>
        </div>

        {/* KPI 2: Custo Total do Lar */}
        <div className="card-cyber p-5 rounded-3xl">
          <div className="flex justify-between items-center text-xs font-bold text-rose-400 uppercase tracking-wider">
            <span>Despesas do Lar</span>
            <TrendingUp className="w-5 h-5 text-rose-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black mt-2 text-rose-400 tracking-tight">
            R$ {totalDespesasGerais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] font-bold text-rose-300 mt-1 block">
            {comprometimentoRenda}% da renda comprometida
          </span>
        </div>

        {/* KPI 3: Saldo Líquido Real */}
        <div className="card-cyber p-5 rounded-3xl">
          <div className="flex justify-between items-center text-xs font-bold text-teal-400 uppercase tracking-wider">
            <span>Saldo Líquido Real</span>
            <Wallet className="w-5 h-5 text-teal-400" />
          </div>
          <p className={`text-2xl sm:text-3xl font-black mt-2 tracking-tight ${
            saldoLiquidoGeral >= 0 ? 'text-teal-300' : 'text-rose-400'
          }`}>
            R$ {saldoLiquidoGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] font-bold text-slate-400 mt-1 block">
            {saldoLiquidoGeral >= 0 ? 'Balanço orçamentário positivo' : 'Atenção ao déficit orçamentário'}
          </span>
        </div>

        {/* KPI 4: Status de Liquidação */}
        <div className="card-cyber p-5 rounded-3xl">
          <div className="flex justify-between items-center text-xs font-bold text-sky-400 uppercase tracking-wider">
            <span>Status de Liquidação</span>
            <CheckCircle2 className="w-5 h-5 text-sky-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black mt-2 text-white tracking-tight">
            {totalContasPagas} <span className="text-sm font-semibold text-slate-400">pagas</span>
          </p>
          <span className="text-[11px] font-bold text-amber-300 mt-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" /> {totalContasPendentes} pendentes em aberto
          </span>
        </div>
      </div>

      {/* SEÇÃO FINANCEIRA: RELATÓRIO DE DESPESAS DO LAR & CATEGORIAS */}
      <div className={`p-6 rounded-3xl border shadow-xl space-y-5 ${
        darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800/40 pb-3">
          <div>
            <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wider">
              RELATÓRIO FINANCEIRO PESSOAL
            </span>
            <h3 className="text-base font-bold flex items-center gap-2 text-white mt-1">
              <PieChart className="w-5 h-5 text-emerald-400" /> Distribuição de Gastos do Lar por Categoria
            </h3>
          </div>

          <div className="text-xs font-semibold text-slate-400 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
            {totalContasPagas} Liquidadas • {totalContasPendentes} Pendentes
          </div>
        </div>

        {categoriasData.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 bg-slate-950/50 rounded-2xl border border-slate-800">
            Nenhuma despesa lançada no período selecionado.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoriasData.map((cat) => (
              <div key={cat.categoria} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-200">{cat.categoria}</span>
                  <span className="text-rose-400 font-bold">R$ {cat.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(5, cat.pct)}%` }}
                  ></div>
                </div>

                <span className="text-[10px] text-slate-400 font-medium block">
                  Representa {cat.pct}% do total de despesas domésticas
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

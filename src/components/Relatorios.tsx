import React, { useState, useEffect } from 'react';
import type { ItemProducaoTomo, TransacaoPessoal } from '../types';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Download,
  Building2,
  PieChart,
  FileSpreadsheet,
  Printer,
  Filter,
  Wallet
} from 'lucide-react';

interface RelatoriosProps {
  darkMode?: boolean;
}

const PRODUCAO_KEY = 'odonto_producao_registros_v2';
const FINANCEIRO_KEY = 'odonto_financeiro_pessoal_v1';

const UNIDADES_PRODUCAO = [
  { id: 'cli-1', nome: 'Clínica Ariquemes', unidade: 'Ariquemes', proprietario: 'Fernando' },
  { id: 'cli-2', nome: 'Clínica Porto Velho', unidade: 'Porto Velho', proprietario: 'Fernando' },
  { id: 'cli-3', nome: 'Clínica Machadinho', unidade: 'Machadinho', proprietario: 'Fernando' },
  { id: 'cli-4', nome: 'Clínica Cacoal', unidade: 'Cacoal', proprietario: 'Fernando' },
  { id: 'cli-5', nome: 'Clínica Rolim de Moura', unidade: 'Rolim de Moura', proprietario: 'Bernardo' },
  { id: 'cli-6', nome: 'Clínica Ouro Preto', unidade: 'Ouro Preto', proprietario: 'Bernardo' },
  { id: 'cli-7', nome: 'Clínica Ji-Paraná', unidade: 'Ji-Paraná', proprietario: 'Bernardo' }
];

export const Relatorios: React.FC<RelatoriosProps> = ({ darkMode }) => {
  const [itensProducao, setItensProducao] = useState<ItemProducaoTomo[]>(() => {
    const salvo = localStorage.getItem(PRODUCAO_KEY);
    if (salvo) {
      try { return JSON.parse(salvo); } catch (e) {}
    }
    return [];
  });

  const [transacoesFinanceiras, setTransacoesFinanceiras] = useState<TransacaoPessoal[]>(() => {
    const salvo = localStorage.getItem(FINANCEIRO_KEY);
    if (salvo) {
      try { return JSON.parse(salvo); } catch (e) {}
    }
    return [];
  });

  const [filtroPeriodo, setFiltroPeriodo] = useState<string>('todos');
  const [filtroModulo, setFiltroModulo] = useState<string>('geral');

  useEffect(() => {
    const handleStorage = () => {
      const p = localStorage.getItem(PRODUCAO_KEY);
      if (p) { try { setItensProducao(JSON.parse(p)); } catch (e) {} }
      const f = localStorage.getItem(FINANCEIRO_KEY);
      if (f) { try { setTransacoesFinanceiras(JSON.parse(f)); } catch (e) {} }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // FILTRAGEM POR PERÍODO DE DATA
  const hoje = new Date();
  const primeiroDiaMesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];

  const itensProducaoFiltrados = itensProducao.filter((i) => {
    if (filtroPeriodo === 'mes_atual') return i.data >= primeiroDiaMesAtual;
    return true;
  });

  const transacoesFiltradas = transacoesFinanceiras.filter((t) => {
    if (filtroPeriodo === 'mes_atual') return t.data >= primeiroDiaMesAtual;
    return true;
  });

  // --- 1. ESTATÍSTICAS DE PRODUÇÃO ---
  const totalFaturamentoProducao = itensProducaoFiltrados.reduce((acc, i) => acc + i.valor, 0);
  const totalExamesProducao = itensProducaoFiltrados.length;
  const ticketMedioGeralExame = totalExamesProducao > 0 ? totalFaturamentoProducao / totalExamesProducao : 0;

  const itensFernando = itensProducaoFiltrados.filter((i) => i.proprietario === 'Fernando');
  const itensBernardo = itensProducaoFiltrados.filter((i) => i.proprietario === 'Bernardo');

  const totalFernandoR$ = itensFernando.reduce((acc, i) => acc + i.valor, 0);
  const totalBernardoR$ = itensBernardo.reduce((acc, i) => acc + i.valor, 0);

  // DESEMPENHO POR UNIDADE
  const resumoClinicas = UNIDADES_PRODUCAO.map((u) => {
    const lancamentos = itensProducaoFiltrados.filter((i) => i.unidade === u.unidade);
    const count = lancamentos.length;
    const valor = lancamentos.reduce((acc, i) => acc + i.valor, 0);
    const ticket = count > 0 ? valor / count : 0;
    const participacaoPct = totalFaturamentoProducao > 0 ? Math.round((valor / totalFaturamentoProducao) * 100) : 0;

    const regioesCount: Record<string, number> = {};
    lancamentos.forEach((i) => {
      regioesCount[i.regiao] = (regioesCount[i.regiao] || 0) + 1;
    });
    const regiaoMaisFrequente = Object.keys(regioesCount).sort((a, b) => regioesCount[b] - regioesCount[a])[0] || 'N/A';

    return {
      ...u,
      count,
      valor,
      ticket,
      participacaoPct,
      regiaoMaisFrequente
    };
  }).sort((a, b) => b.valor - a.valor);

  const maxClinicaVal = Math.max(1, ...resumoClinicas.map((c) => c.valor));

  // --- 2. ESTATÍSTICAS DO FINANCEIRO ---
  const totalEntradasOutras = transacoesFiltradas
    .filter((t) => t.tipo === 'Entrada')
    .reduce((acc, t) => acc + t.valor, 0);

  const totalEntradasGeral = totalFaturamentoProducao + totalEntradasOutras;

  const totalDespesasFixas = transacoesFiltradas
    .filter((t) => t.tipo === 'Despesa Fixa')
    .reduce((acc, t) => acc + t.valor, 0);

  const totalDespesasVariaveis = transacoesFiltradas
    .filter((t) => t.tipo === 'Despesa Variável')
    .reduce((acc, t) => acc + t.valor, 0);

  const totalDespesasGerais = totalDespesasFixas + totalDespesasVariaveis;
  const saldoLiquidoGeral = totalEntradasGeral - totalDespesasGerais;
  const comprometimentoRenda = totalEntradasGeral > 0 ? Math.round((totalDespesasGerais / totalEntradasGeral) * 100) : 0;

  const totalContasPagas = transacoesFiltradas.filter((t) => t.status === 'Pago').length + (totalExamesProducao > 0 ? 1 : 0);
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

  // EXPORTAÇÃO CSV DE RELATÓRIO COMPLETO
  const handleExportarCSV = () => {
    let csv = 'MÓDULO,UNIDADE / CATEGORIA,PROPRIETÁRIO / TIPO,QTD EXAMES / STATUS,VALOR TOTAL (R$)\n';

    resumoClinicas.forEach((c) => {
      csv += `"PRODUÇÃO","${c.nome} (${c.unidade})","${c.proprietario}","${c.count} exames","R$ ${c.valor.toFixed(2)}"\n`;
    });

    transacoesFiltradas.forEach((t) => {
      csv += `"FINANCEIRO PESSOAL","${t.categoria}","${t.tipo}","${t.status}","R$ ${t.valor.toFixed(2)}"\n`;
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Relatorio_Financas_Pessoal_${new Date().toISOString().split('T')[0]}.csv`);
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
              <span className="text-[10px] font-semibold text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/30 uppercase tracking-widest">
                Relatórios Gerenciais Prontos
              </span>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                Sincronizado
              </span>
            </div>
            <h2 className="text-xl font-bold mt-0.5 flex items-center gap-2">
              Relatórios Analíticos & Consolidados
            </h2>
            <p className="text-xs text-slate-400 font-normal">
              Indicadores quantitativos de Produção das Clínicas e Orçamento Familiar com dados em tempo real.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={() => window.print()}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2.5 rounded-2xl text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer shadow flex-1 md:flex-none"
          >
            <Printer className="w-4 h-4 text-teal-400" /> Imprimir Relatório (PDF)
          </button>

          <button
            type="button"
            onClick={handleExportarCSV}
            className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold px-4 py-2.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-teal-600/20 transition-all cursor-pointer flex-1 md:flex-none"
          >
            <Download className="w-4 h-4" /> Exportar Planilha (CSV)
          </button>
        </div>
      </div>

      {/* SELETOR DE FILTROS E MÓDULOS */}
      <div className="bg-slate-950 p-2 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-inner">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 pl-2">
            <Filter className="w-3.5 h-3.5 text-teal-400" /> Módulo:
          </span>

          <button
            onClick={() => setFiltroModulo('geral')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filtroModulo === 'geral'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            Geral Consolidado
          </button>

          <button
            onClick={() => setFiltroModulo('producao')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filtroModulo === 'producao'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            Produção por Clínica
          </button>

          <button
            onClick={() => setFiltroModulo('financeiro')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              filtroModulo === 'financeiro'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            Orçamento Pessoal & Lar
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="text-slate-400">Período:</span>
          <select
            value={filtroPeriodo}
            onChange={(e) => setFiltroPeriodo(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-white px-3 py-1.5 rounded-xl font-medium focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
          >
            <option value="todos">Todos os Lançamentos</option>
            <option value="mes_atual">Mês Atual</option>
          </select>
        </div>
      </div>

      {/* 4 CARDS KPI ANALÍTICOS PRINCIPAIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Faturamento Produção */}
        <div className={`p-5 rounded-3xl border shadow-md ${
          darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="flex justify-between items-center text-xs font-semibold text-teal-400 uppercase tracking-wider">
            <span>Produção Total</span>
            <FileSpreadsheet className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold mt-2 text-white tracking-tight">
            R$ {totalFaturamentoProducao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] font-normal text-teal-400 mt-1 block">
            {totalExamesProducao} exames faturados (Méd. R$ {ticketMedioGeralExame.toFixed(2)})
          </span>
        </div>

        {/* KPI 2: Entradas Totais */}
        <div className={`p-5 rounded-3xl border shadow-md ${
          darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="flex justify-between items-center text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <span>Renda & Entradas Totais</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold mt-2 text-emerald-400 tracking-tight">
            R$ {totalEntradasGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] font-normal text-emerald-400 mt-1 block">
            Produção + Outras Entradas do Lar
          </span>
        </div>

        {/* KPI 3: Despesas Gerais */}
        <div className={`p-5 rounded-3xl border shadow-md ${
          darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="flex justify-between items-center text-xs font-semibold text-rose-400 uppercase tracking-wider">
            <span>Custo Total do Lar</span>
            <TrendingUp className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold mt-2 text-rose-400 tracking-tight">
            R$ {totalDespesasGerais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] font-normal text-rose-400 mt-1 block">
            {comprometimentoRenda}% da renda comprometida
          </span>
        </div>

        {/* KPI 4: Saldo Líquido Real */}
        <div className={`p-5 rounded-3xl border shadow-md ${
          darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="flex justify-between items-center text-xs font-semibold text-sky-400 uppercase tracking-wider">
            <span>Saldo Líquido Real</span>
            <Wallet className="w-4 h-4 text-sky-400" />
          </div>
          <p className={`text-2xl sm:text-3xl font-bold mt-2 tracking-tight ${
            saldoLiquidoGeral >= 0 ? 'text-sky-400' : 'text-rose-400'
          }`}>
            R$ {saldoLiquidoGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] font-normal text-slate-400 mt-1 block">
            {saldoLiquidoGeral >= 0 ? 'Balanço positivo familiar' : 'Atenção ao déficit familiar'}
          </span>
        </div>
      </div>

      {/* SEÇÃO PRODUÇÃO: RELATÓRIO ANALÍTICO POR CLÍNICA */}
      {(filtroModulo === 'geral' || filtroModulo === 'producao') && (
        <div className={`p-6 rounded-3xl border shadow-xl space-y-5 ${
          darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800/40 pb-3">
            <div>
              <span className="text-[10px] font-semibold text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded border border-sky-500/20 uppercase tracking-wider">
                RELATÓRIO DE PRODUÇÃO
              </span>
              <h3 className="text-base font-bold flex items-center gap-2 text-white mt-1">
                <Building2 className="w-5 h-5 text-sky-400" /> Desempenho Faturado & Pacientes por Clínica
              </h3>
            </div>
            <div className="text-xs font-semibold text-slate-400 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
              Fernando: R$ {totalFernandoR$.toLocaleString('pt-BR')} • Bernardo: R$ {totalBernardoR$.toLocaleString('pt-BR')}
            </div>
          </div>

          {/* Tabela de Desempenho por Unidade */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-normal">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3">Unidade / Clínica</th>
                  <th className="py-3 px-3 text-center">Responsável</th>
                  <th className="py-3 px-3 text-center">Exames Faturados</th>
                  <th className="py-3 px-3 text-right">Faturamento Bruto</th>
                  <th className="py-3 px-3 text-right">Ticket Médio</th>
                  <th className="py-3 px-3 text-center">% do Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {resumoClinicas.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2 font-semibold">
                        <Building2 className="w-4 h-4 text-teal-400 shrink-0" />
                        <span className="text-white">{c.nome}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                        c.proprietario === 'Fernando'
                          ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                          : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                      }`}>
                        {c.proprietario}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-center font-semibold text-white">
                      {c.count} exames
                    </td>

                    <td className="py-3.5 px-3 text-right font-bold text-emerald-400">
                      R$ {c.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-3 text-right text-slate-300 font-medium">
                      R$ {c.ticket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-3 text-center font-semibold text-sky-400">
                      {c.participacaoPct}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Gráfico Visual de Distribuição de Participação */}
          <div className="space-y-2.5 pt-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Representatividade do Faturamento por Unidade:
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {resumoClinicas.map((c) => {
                const pctBar = Math.round((c.valor / maxClinicaVal) * 100);
                return (
                  <div key={c.id} className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-white">{c.nome}</span>
                      <span className="font-bold text-emerald-400">R$ {c.valor.toLocaleString('pt-BR')} ({c.participacaoPct}%)</span>
                    </div>

                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(4, pctBar)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SEÇÃO FINANCEIRO: RELATÓRIO DE DESPESAS DO LAR & CATEGORIAS */}
      {(filtroModulo === 'geral' || filtroModulo === 'financeiro') && (
        <div className={`p-6 rounded-3xl border shadow-xl space-y-5 ${
          darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800/40 pb-3">
            <div>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wider">
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
      )}

    </div>
  );
};

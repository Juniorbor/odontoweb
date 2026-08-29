import React, { useState, useEffect } from 'react';
import type { TransacaoPessoal } from '../types';
import {
  Download,
  Printer,
  Filter,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Search,
  ListOrdered,
  FileSpreadsheet,
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar,
  Tag
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
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [buscaDescricao, setBuscaDescricao] = useState<string>('');
  const [ordenacao, setOrdenacao] = useState<'data_desc' | 'data_asc' | 'valor_desc' | 'valor_asc' | 'nome_asc'>('data_desc');

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

  // FILTRAGEM MULTICRITÉRIO ITEM POR ITEM
  const transacoesFiltradas = transacoesFinanceiras.filter((t) => {
    // Periodo
    if (filtroPeriodo === 'mes_atual' && t.data < primeiroDiaMesAtual) return false;

    // Tipo
    if (filtroTipo !== 'todos' && t.tipo !== filtroTipo) return false;

    // Status
    if (filtroStatus !== 'todos' && t.status !== filtroStatus) return false;

    // Busca por Descrição / Categoria
    if (buscaDescricao.trim()) {
      const q = buscaDescricao.toLowerCase().trim();
      const matchDesc = t.descricao.toLowerCase().includes(q);
      const matchCat = t.categoria.toLowerCase().includes(q);
      if (!matchDesc && !matchCat) return false;
    }

    return true;
  });

  // ORDENAÇÃO DOS ITENS
  const transacoesOrdenadas = [...transacoesFiltradas].sort((a, b) => {
    if (ordenacao === 'data_desc') return b.data.localeCompare(a.data);
    if (ordenacao === 'data_asc') return a.data.localeCompare(b.data);
    if (ordenacao === 'valor_desc') return b.valor - a.valor;
    if (ordenacao === 'valor_asc') return a.valor - b.valor;
    if (ordenacao === 'nome_asc') return a.descricao.localeCompare(b.descricao);
    return 0;
  });

  // --- ESTATÍSTICAS ANALÍTICAS DOS ITENS ---
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

  // EXPORTAÇÃO CSV DE RELATÓRIO COMPLETO ITEM POR ITEM
  const handleExportarCSV = () => {
    let csv = 'ITEM #,DESCRIÇÃO COMPLETA,CATEGORIA,TIPO DE LANÇAMENTO,STATUS,DATA,VALOR (R$)\n';

    transacoesOrdenadas.forEach((t, idx) => {
      const descFormatada = t.descricao.replace(/"/g, '""');
      const catFormatada = t.categoria.replace(/"/g, '""');
      csv += `"${idx + 1}","${descFormatada}","${catFormatada}","${t.tipo}","${t.status}","${t.data}","R$ ${t.valor.toFixed(2)}"\n`;
    });

    csv += `\n"RESUMO","TOTAL ENTRADAS: R$ ${totalEntradas.toFixed(2)}","TOTAL DESPESAS: R$ ${totalDespesasGerais.toFixed(2)}","BALANÇO LÍQUIDO: R$ ${saldoLiquidoGeral.toFixed(2)}","","",""\n`;

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Relatorio_Analitico_Item_por_Item_${new Date().toISOString().split('T')[0]}.csv`);
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
            <ListOrdered className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/30 uppercase tracking-widest">
                Relatório Analítico Completo
              </span>
              <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                Item por Item ({transacoesOrdenadas.length} Lançamentos)
              </span>
            </div>
            <h2 className="text-xl font-bold mt-0.5 flex items-center gap-2">
              Relatório Descritivo Detalhado
            </h2>
            <p className="text-xs text-slate-400 font-normal">
              Listagem analítica individual de todas as descrições cadastradas na sua conta.
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

      {/* 4 CARDS KPI ANALÍTICOS PRINCIPAIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI 1: Entradas */}
        <div className="card-cyber p-5 rounded-3xl">
          <div className="flex justify-between items-center text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <span>Total de Entradas</span>
            <ArrowUpCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black mt-2 text-emerald-400 tracking-tight">
            R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] font-bold text-emerald-300 mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Renda & Salários Cadastrados
          </span>
        </div>

        {/* KPI 2: Custo Total do Lar */}
        <div className="card-cyber p-5 rounded-3xl">
          <div className="flex justify-between items-center text-xs font-bold text-rose-400 uppercase tracking-wider">
            <span>Total de Despesas</span>
            <ArrowDownCircle className="w-5 h-5 text-rose-400" />
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

        {/* KPI 4: Total de Itens Lançados */}
        <div className="card-cyber p-5 rounded-3xl">
          <div className="flex justify-between items-center text-xs font-bold text-sky-400 uppercase tracking-wider">
            <span>Total de Lançamentos</span>
            <FileSpreadsheet className="w-5 h-5 text-sky-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black mt-2 text-white tracking-tight">
            {transacoesOrdenadas.length} <span className="text-sm font-semibold text-slate-400">itens descritos</span>
          </p>
          <span className="text-[11px] font-bold text-amber-300 mt-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" /> {totalContasPagas} pagas • {totalContasPendentes} pendentes
          </span>
        </div>
      </div>

      {/* SEÇÃO PRINCIPAL: PAINEL DE FILTROS E BUSCA POR DESCRIÇÃO */}
      <div className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
        darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/40 pb-4">
          <div>
            <span className="text-[10px] font-extrabold text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded border border-teal-500/20 uppercase tracking-wider">
              FILTRAGEM DE ITENS
            </span>
            <h3 className="text-base font-bold flex items-center gap-2 text-white mt-1">
              <Search className="w-5 h-5 text-teal-400" /> Buscar Descrições & Filtrar Lançamentos
            </h3>
          </div>

          <div className="w-full md:w-auto flex flex-wrap items-center gap-2 text-xs">
            {/* Campo de Pesquisa Instantânea */}
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por descrição (ex: luz, mercado...)"
                value={buscaDescricao}
                onChange={(e) => setBuscaDescricao(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                  darkMode ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500' : 'bg-slate-100 border-slate-200 text-slate-800'
                }`}
              />
            </div>
          </div>
        </div>

        {/* BARRA DE CONTROLES MULTICRITÉRIO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          
          {/* Filtro Período */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold uppercase text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-teal-400" /> Período
            </label>
            <select
              value={filtroPeriodo}
              onChange={(e) => setFiltroPeriodo(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white px-3 py-2 rounded-xl font-medium focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
            >
              <option value="todos">Todos os Períodos</option>
              <option value="mes_atual">Mês Atual</option>
            </select>
          </div>

          {/* Filtro Tipo */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold uppercase text-slate-400 flex items-center gap-1">
              <Tag className="w-3 h-3 text-teal-400" /> Tipo de Lançamento
            </label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white px-3 py-2 rounded-xl font-medium focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
            >
              <option value="todos">Todos os Tipos</option>
              <option value="Entrada">Entradas (Renda/Salário)</option>
              <option value="Despesa Fixa">Despesas Fixas</option>
              <option value="Despesa Variável">Despesas Variáveis</option>
            </select>
          </div>

          {/* Filtro Status */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold uppercase text-slate-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-teal-400" /> Status de Liquidação
            </label>
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white px-3 py-2 rounded-xl font-medium focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
            >
              <option value="todos">Todos os Status</option>
              <option value="Pago">Pagas / Liquidadas</option>
              <option value="Pendente">Pendentes em Aberto</option>
            </select>
          </div>

          {/* Ordenação */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold uppercase text-slate-400 flex items-center gap-1">
              <Filter className="w-3 h-3 text-teal-400" /> Ordenação dos Itens
            </label>
            <select
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 text-white px-3 py-2 rounded-xl font-medium focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
            >
              <option value="data_desc">Data (Mais Recentes)</option>
              <option value="data_asc">Data (Mais Antigos)</option>
              <option value="valor_desc">Valor (Maior para Menor)</option>
              <option value="valor_asc">Valor (Menor para Maior)</option>
              <option value="nome_asc">Descrição (A-Z)</option>
            </select>
          </div>

        </div>

        {/* TABELA ANALÍTICA COMPLETA ITEM POR ITEM */}
        <div className="pt-2">
          {transacoesOrdenadas.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
              <FileSpreadsheet className="w-8 h-8 text-slate-500 mx-auto opacity-60" />
              <p className="font-bold text-slate-300 text-sm">Nenhum lançamento encontrado para os filtros selecionados.</p>
              <p className="text-[11px] text-slate-400">Tente ajustar o termo digitado na busca ou alterar os seletores acima.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800 shadow-inner">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b text-[11px] font-black uppercase tracking-wider ${
                    darkMode ? 'bg-slate-950/80 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                  }`}>
                    <th className="p-3.5 text-center w-12">#</th>
                    <th className="p-3.5">Descrição do Item</th>
                    <th className="p-3.5">Categoria</th>
                    <th className="p-3.5">Tipo</th>
                    <th className="p-3.5 text-center">Data</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-right">Valor Exato (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {transacoesOrdenadas.map((item, index) => {
                    const isEntrada = item.tipo === 'Entrada';
                    const isPago = item.status === 'Pago';

                    return (
                      <tr
                        key={item.id || index}
                        className={`transition-colors hover:bg-slate-800/40 ${
                          darkMode ? 'bg-slate-900/40' : 'bg-white'
                        }`}
                      >
                        {/* Numeração ordinal */}
                        <td className="p-3.5 text-center font-mono text-[11px] text-slate-400 font-bold">
                          {index + 1}
                        </td>

                        {/* Descrição Completa Lançada pelo Usuário */}
                        <td className="p-3.5">
                          <span className="font-extrabold text-white text-sm block">
                            {item.descricao}
                          </span>
                        </td>

                        {/* Categoria */}
                        <td className="p-3.5">
                          <span className="inline-flex items-center gap-1.5 bg-slate-800/80 text-slate-200 text-[11px] px-2.5 py-1 rounded-xl border border-slate-700 font-semibold">
                            <Tag className="w-3 h-3 text-teal-400" />
                            {item.categoria}
                          </span>
                        </td>

                        {/* Tipo de Lançamento */}
                        <td className="p-3.5">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                            isEntrada
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : item.tipo === 'Despesa Fixa'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                          }`}>
                            {isEntrada ? <ArrowUpCircle className="w-3 h-3 text-emerald-400" /> : <ArrowDownCircle className="w-3 h-3 text-rose-400" />}
                            {item.tipo}
                          </span>
                        </td>

                        {/* Data do Lançamento */}
                        <td className="p-3.5 text-center font-mono text-xs text-slate-300">
                          {item.data}
                        </td>

                        {/* Status de Liquidação */}
                        <td className="p-3.5 text-center">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                            isPago
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                              : 'bg-amber-500/15 text-amber-300 border-amber-500/40 animate-pulse'
                          }`}>
                            {isPago ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Clock className="w-3 h-3 text-amber-400" />}
                            {item.status}
                          </span>
                        </td>

                        {/* Valor Formatado em R$ */}
                        <td className="p-3.5 text-right font-black font-mono text-sm">
                          <span className={isEntrada ? 'text-emerald-400' : 'text-rose-400'}>
                            {isEntrada ? '+' : '-'} R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Rodapé da Tabela com Totalizadores da Lista Filtrada */}
                <tfoot>
                  <tr className={`border-t-2 text-xs font-black ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'
                  }`}>
                    <td colSpan={3} className="p-4 uppercase tracking-wider text-teal-400 font-extrabold">
                      Totalizador dos {transacoesOrdenadas.length} Itens Exibidos:
                    </td>
                    <td colSpan={2} className="p-4 text-center">
                      <span className="text-emerald-400 font-mono block text-xs">Entradas: + R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      <span className="text-rose-400 font-mono block text-xs">Despesas: - R$ {totalDespesasGerais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td colSpan={2} className="p-4 text-right">
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-sans">Balanço do Relatório:</span>
                      <span className={`text-base font-black font-mono ${saldoLiquidoGeral >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        R$ {saldoLiquidoGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

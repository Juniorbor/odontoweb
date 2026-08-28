import React, { useState, useEffect } from 'react';
import type { TransacaoPessoal } from '../types';
import LOGO_BASE64 from '../assets/logoData';
import { AIFinBot } from './AIFinBot';
import { GamificacaoFinanceira } from './GamificacaoFinanceira';
import {
  DollarSign,
  TrendingUp,
  Wallet,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  CheckCircle2,
  Clock,
  ArrowDownRight,
  PieChart
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: string) => void;
  darkMode?: boolean;
  userRole?: 'admin' | 'cliente';
  usuarioId?: string;
}

const FINANCEIRO_KEY_ADMIN = 'odonto_financeiro_pessoal_v1';

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  darkMode,
  userRole = 'admin',
  usuarioId
}) => {
  const isCliente = userRole === 'cliente';
  const chaveFinanceiro = isCliente && usuarioId ? `odonto_financeiro_pessoal_${usuarioId}` : FINANCEIRO_KEY_ADMIN;

  const [transacoesFinanceiras, setTransacoesFinanceiras] = useState<TransacaoPessoal[]>(() => {
    const salvo = localStorage.getItem(chaveFinanceiro);
    if (salvo) {
      try {
        return JSON.parse(salvo);
      } catch (e) {}
    }
    return [];
  });

  // Atualização em tempo real quando ocorrem novos lançamentos no localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const f = localStorage.getItem(chaveFinanceiro);
      if (f) {
        try { setTransacoesFinanceiras(JSON.parse(f)); } catch (e) {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [chaveFinanceiro]);

  // --- ESTATÍSTICAS DO FINANCEIRO PESSOAL DO USUÁRIO ---
  const totalEntradas = transacoesFinanceiras
    .filter((t) => t.tipo === 'Entrada')
    .reduce((acc, t) => acc + t.valor, 0);

  const totalDespesasFixas = transacoesFinanceiras
    .filter((t) => t.tipo === 'Despesa Fixa')
    .reduce((acc, t) => acc + t.valor, 0);

  const totalDespesasVariaveis = transacoesFinanceiras
    .filter((t) => t.tipo === 'Despesa Variável')
    .reduce((acc, t) => acc + t.valor, 0);

  const totalDespesasGerais = totalDespesasFixas + totalDespesasVariaveis;
  const saldoLiquidoGeral = totalEntradas - totalDespesasGerais;
  
  const comprometimentoRenda = totalEntradas > 0 
    ? Math.round((totalDespesasGerais / totalEntradas) * 100) 
    : 0;

  const totalContasPagas = transacoesFinanceiras.filter((t) => t.status === 'Pago').length;
  const totalContasPendentes = transacoesFinanceiras.filter((t) => t.status === 'Pendente').length;

  // Agrupamento de Gastos por Categoria
  const categoriasMap: Record<string, number> = {};
  transacoesFinanceiras
    .filter((t) => t.tipo !== 'Entrada')
    .forEach((t) => {
      categoriasMap[t.categoria] = (categoriasMap[t.categoria] || 0) + t.valor;
    });

  const resumoCategorias = Object.entries(categoriasMap)
    .map(([categoria, valor]) => ({ categoria, valor }))
    .sort((a, b) => b.valor - a.valor);

  const maxCategoriaVal = Math.max(1, ...resumoCategorias.map((c) => c.valor));

  return (
    <div className="space-y-6 w-full max-w-full animate-fadeIn font-sans text-slate-200">
      
      {/* Banner Executivo de Boas-Vindas */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-950 to-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-teal-500/30 glow-teal">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 bg-gradient-to-br from-teal-500/20 to-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0 hidden sm:block">
              <img
                src={LOGO_BASE64}
                alt="Finanças Pessoal"
                className="w-14 h-14 object-contain rounded-full border-2 border-emerald-400 shadow-xl bg-white p-1"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full animate-ping"></span>
            </div>

            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-500/40">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Painel Orçamentário Pessoal
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                Painel Financeiro & Saúde Orçamentária <span className="text-teal-400 font-bold text-sm bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/30">AO VIVO</span>
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm font-normal max-w-xl">
                Consolidado dinâmico das suas <strong className="font-bold text-emerald-400">Entradas / Salário</strong>, despesas fixas do lar, cartões de crédito e metas.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('financeiro')}
              className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold px-5 py-3 rounded-2xl text-xs shadow-xl shadow-teal-500/25 transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.03]"
            >
              <Wallet className="w-4.5 h-4.5 text-white" /> Acessar Meu Financeiro
            </button>
          </div>
        </div>
      </div>

      {/* 4 Cards KPI Principais do Usuário */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI 1: Renda / Entradas */}
        <div className="card-cyber p-5 rounded-3xl transition-all hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Entradas & Renda Total</p>
            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-400 border border-emerald-500/30 shadow-md">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black mt-3 text-emerald-400 tracking-tight">
            R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Salário & Rendas Cadastradas
          </div>
        </div>

        {/* KPI 2: Despesas do Lar */}
        <div className="card-cyber p-5 rounded-3xl transition-all hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-rose-400 uppercase tracking-wider">Despesas Totais do Lar</p>
            <div className="p-3 rounded-2xl bg-gradient-to-br from-rose-500/20 to-amber-500/10 text-rose-400 border border-rose-500/30 shadow-md">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black mt-3 text-rose-400 tracking-tight">
            R$ {totalDespesasGerais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-rose-300">
            <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" /> Comprometimento de {comprometimentoRenda}%
          </div>
        </div>

        {/* KPI 3: Saldo Líquido */}
        <div className="card-cyber p-5 rounded-3xl transition-all hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-teal-400 uppercase tracking-wider">Saldo Líquido Disponível</p>
            <div className="p-3 rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/10 text-teal-400 border border-teal-500/30 shadow-md">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
          <p className={`text-2xl sm:text-3xl font-black mt-3 tracking-tight ${saldoLiquidoGeral >= 0 ? 'text-teal-300' : 'text-rose-400'}`}>
            R$ {saldoLiquidoGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-teal-300">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
            <span>Balanço Orçamentário Atual</span>
          </div>
        </div>

        {/* KPI 4: Contas Pagas vs Pendentes */}
        <div className="card-cyber p-5 rounded-3xl transition-all hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-sky-400 uppercase tracking-wider">Contas Liquidadas</p>
            <div className="p-3 rounded-2xl bg-gradient-to-br from-sky-500/20 to-indigo-500/10 text-sky-400 border border-sky-500/30 shadow-md">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black mt-3 text-white tracking-tight">
            {totalContasPagas} <span className="text-sm font-semibold text-slate-400">pagas</span>
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-400" /> {totalContasPendentes} pendentes em aberto
          </div>
        </div>
      </div>

      {/* ASSISTENTE DE IA FINBOT & GAMIFICAÇÃO */}
      <AIFinBot itensProducao={[]} transacoesFinanceiras={transacoesFinanceiras} darkMode={darkMode} />
      <GamificacaoFinanceira transacoes={transacoesFinanceiras} itensProducao={[]} darkMode={darkMode} />

      {/* PAINEL ORGANIZADO DAS FINANÇAS DO USUÁRIO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* COLUNA 1: DISTRIBUIÇÃO DOS GASTOS POR CATEGORIA */}
        <div className={`p-6 rounded-3xl border shadow-xl space-y-5 ${
          darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="flex justify-between items-center pb-3 border-b border-slate-800/40">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded border border-rose-500/20 tracking-wider">
                DESPESAS DO LAR
              </span>
              <h2 className="font-bold text-base flex items-center gap-2 text-white mt-1">
                <PieChart className="w-5 h-5 text-rose-400" /> Gastos por Categoria
              </h2>
            </div>

            <button
              onClick={() => onNavigate('financeiro')}
              className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 hover:underline cursor-pointer"
            >
              Ver Extrato <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 pt-1">
            {resumoCategorias.length === 0 ? (
              <p className="text-center text-slate-400 py-8 text-xs">
                Nenhum lançamento de despesa cadastrado ainda. Clique em "Acessar Meu Financeiro" para começar a adicionar suas contas!
              </p>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {resumoCategorias.map((cat) => {
                  const pct = Math.round((cat.valor / maxCategoriaVal) * 100);
                  return (
                    <div key={cat.categoria} className="p-3 rounded-2xl bg-slate-950/50 border border-slate-800/70 space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-normal">
                        <span className="text-white font-semibold">{cat.categoria}</span>
                        <span className="text-rose-400 font-bold">
                          R$ {cat.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-rose-500 to-amber-400"
                          style={{ width: `${Math.max(5, pct)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* COLUNA 2: SAÚDE FINANCEIRA & BALANÇO DO LAR */}
        <div className={`p-6 rounded-3xl border shadow-xl space-y-5 ${
          darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="flex justify-between items-center pb-3 border-b border-slate-800/40">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20 tracking-wider">
                RESUMO ORÇAMENTÁRIO
              </span>
              <h2 className="font-bold text-base flex items-center gap-2 text-white mt-1">
                <Wallet className="w-5 h-5 text-emerald-400" /> Saúde Financeira do Mês
              </h2>
            </div>

            <button
              onClick={() => onNavigate('financeiro')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 hover:underline cursor-pointer"
            >
              Novo Lançamento <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 border border-emerald-500/30 text-white space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase text-emerald-400 tracking-wider">Saldo do Mês</span>
              <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                {comprometimentoRenda}% da renda comprometida
              </span>
            </div>

            <h3 className={`text-2xl font-black tracking-tight ${saldoLiquidoGeral >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              R$ {saldoLiquidoGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>

            <div className="flex justify-between text-[11px] text-slate-300 pt-2 border-t border-slate-800/80 font-normal">
              <span>Fixas: <strong className="font-bold text-white">R$ {totalDespesasFixas.toLocaleString('pt-BR')}</strong></span>
              <span>Variáveis: <strong className="font-bold text-white">R$ {totalDespesasVariaveis.toLocaleString('pt-BR')}</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Liquidadas
              </div>
              <span className="text-lg font-black text-white block">{totalContasPagas} contas</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Clock className="w-4 h-4 text-amber-400" /> Pendentes
              </div>
              <span className="text-lg font-black text-white block">{totalContasPendentes} contas</span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('financeiro')}
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold py-3 rounded-2xl text-xs shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <DollarSign className="w-4 h-4" /> Cadastrar Novo Lançamento no Financeiro
          </button>
        </div>

      </div>
    </div>
  );
};

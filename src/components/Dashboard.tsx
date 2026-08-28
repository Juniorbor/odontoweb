import React, { useState, useEffect } from 'react';
import type { ItemProducaoTomo, TransacaoPessoal } from '../types';
import LOGO_BASE64 from '../assets/logoData';
import { AIFinBot } from './AIFinBot';
import { GamificacaoFinanceira } from './GamificacaoFinanceira';
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  Users,
  Wallet,
  Sparkles,
  ShieldCheck,
  Building2,
  ChevronRight,
  CheckCircle2,
  Clock,
  ArrowDownRight
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: string) => void;
  darkMode?: boolean;
}

const PRODUCAO_KEY = 'odonto_producao_registros_v2';
const FINANCEIRO_KEY = 'odonto_financeiro_pessoal_v1';

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  darkMode
}) => {
  const [itensProducao, setItensProducao] = useState<ItemProducaoTomo[]>(() => {
    const salvo = localStorage.getItem(PRODUCAO_KEY);
    if (salvo) {
      try {
        return JSON.parse(salvo);
      } catch (e) {}
    }
    return [];
  });

  const [transacoesFinanceiras, setTransacoesFinanceiras] = useState<TransacaoPessoal[]>(() => {
    const salvo = localStorage.getItem(FINANCEIRO_KEY);
    if (salvo) {
      try {
        return JSON.parse(salvo);
      } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const p = localStorage.getItem(PRODUCAO_KEY);
      if (p) {
        try { setItensProducao(JSON.parse(p)); } catch (e) {}
      }
      const f = localStorage.getItem(FINANCEIRO_KEY);
      if (f) {
        try { setTransacoesFinanceiras(JSON.parse(f)); } catch (e) {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // --- ESTATÍSTICAS DE PRODUÇÃO ---
  const totalFaturamentoProducao = itensProducao.reduce((acc, i) => acc + i.valor, 0);
  const totalExamesProducao = itensProducao.length;

  const itensFernando = itensProducao.filter((i) => i.proprietario === 'Fernando');
  const itensBernardo = itensProducao.filter((i) => i.proprietario === 'Bernardo');

  const totalFernandoR$ = itensFernando.reduce((acc, i) => acc + i.valor, 0);
  const totalBernardoR$ = itensBernardo.reduce((acc, i) => acc + i.valor, 0);

  const UNIDADES_PRODUCAO = [
    { nome: 'Ariquemes', owner: 'Fernando', cor: '#0EA5E9' },
    { nome: 'Porto Velho', owner: 'Fernando', cor: '#0EA5E9' },
    { nome: 'Machadinho', owner: 'Fernando', cor: '#0EA5E9' },
    { nome: 'Cacoal', owner: 'Fernando', cor: '#0EA5E9' },
    { nome: 'Rolim de Moura', owner: 'Bernardo', cor: '#6366F1' },
    { nome: 'Ouro Preto', owner: 'Bernardo', cor: '#6366F1' },
    { nome: 'Ji-Paraná', owner: 'Bernardo', cor: '#6366F1' }
  ];

  const resumoClinicasProducao = UNIDADES_PRODUCAO.map((u) => {
    const lancamentos = itensProducao.filter((i) => i.unidade === u.nome);
    const valorTotal = lancamentos.reduce((acc, i) => acc + i.valor, 0);
    return {
      ...u,
      count: lancamentos.length,
      valor: valorTotal
    };
  }).sort((a, b) => b.valor - a.valor);

  const maxClinicaVal = Math.max(1, ...resumoClinicasProducao.map((c) => c.valor));

  // --- ESTATÍSTICAS DO FINANCEIRO ---
  const totalEntradasOutras = transacoesFinanceiras
    .filter((t) => t.tipo === 'Entrada')
    .reduce((acc, t) => acc + t.valor, 0);

  const totalEntradasFinanceiro = totalFaturamentoProducao + totalEntradasOutras;

  const totalDespesasFixas = transacoesFinanceiras
    .filter((t) => t.tipo === 'Despesa Fixa')
    .reduce((acc, t) => acc + t.valor, 0);

  const totalDespesasVariaveis = transacoesFinanceiras
    .filter((t) => t.tipo === 'Despesa Variável')
    .reduce((acc, t) => acc + t.valor, 0);

  const totalDespesasGerais = totalDespesasFixas + totalDespesasVariaveis;
  const saldoLiquidoGeral = totalEntradasFinanceiro - totalDespesasGerais;
  const comprometimentoRenda = totalEntradasFinanceiro > 0 ? Math.round((totalDespesasGerais / totalEntradasFinanceiro) * 100) : 0;

  const totalContasPagas = transacoesFinanceiras.filter((t) => t.status === 'Pago').length + 1;
  const totalContasPendentes = transacoesFinanceiras.filter((t) => t.status === 'Pendente').length;

  return (
    <div className="space-y-6 w-full max-w-full animate-fadeIn font-sans text-slate-200">
      
      {/* Banner de Boas-Vindas Executivo com Glow Neon */}
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
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Painel Executivo Integrado 2026
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                Painel de Atendimento & Gestão <span className="text-teal-400 font-bold text-sm bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/30">AO VIVO</span>
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm font-normal max-w-xl">
                Consolidado exclusivo das operações de <strong className="font-bold text-teal-400">Produção</strong> (Tomografia & Traçados) e <strong className="font-bold text-emerald-400">Financeiro Pessoal</strong>.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('producao')}
              className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold px-5 py-3 rounded-2xl text-xs shadow-xl shadow-teal-500/25 transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.03]"
            >
              <BarChart3 className="w-4.5 h-4.5 text-white" /> Ir para Produção
            </button>

            <button
              onClick={() => onNavigate('financeiro')}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold px-5 py-3 rounded-2xl text-xs shadow-xl shadow-emerald-600/25 transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.03]"
            >
              <Wallet className="w-4.5 h-4.5 text-white" /> Ir para Financeiro
            </button>
          </div>
        </div>
      </div>

      {/* 4 Cards KPI Principais Estilo Cyber Fintech */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI 1: Faturamento Produção */}
        <div className="card-cyber p-5 rounded-3xl transition-all hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-teal-400 uppercase tracking-wider">Faturamento Produção</p>
            <div className="p-3 rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/10 text-teal-400 border border-teal-500/30 shadow-md">
              <BarChart3 className="w-6 h-6" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black mt-3 text-white tracking-tight">
            R$ {totalFaturamentoProducao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-teal-300">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
            <span>7 Clínicas Monitoradas</span>
          </div>
        </div>

        {/* KPI 2: Pacientes / Exames Produção */}
        <div className="card-cyber p-5 rounded-3xl transition-all hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-sky-400 uppercase tracking-wider">Exames Produzidos</p>
            <div className="p-3 rounded-2xl bg-gradient-to-br from-sky-500/20 to-indigo-500/10 text-sky-400 border border-sky-500/30 shadow-md">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black mt-3 text-white tracking-tight">
            {totalExamesProducao} <span className="text-sm font-semibold text-slate-400">exames</span>
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-sky-300">
            <TrendingUp className="w-3.5 h-3.5 text-sky-400" /> Fernando ({itensFernando.length}) • Bernardo ({itensBernardo.length})
          </div>
        </div>

        {/* KPI 3: Receitas & Salário Financeiro */}
        <div className="card-cyber p-5 rounded-3xl transition-all hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Entradas & Renda Total</p>
            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-400 border border-emerald-500/30 shadow-md">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black mt-3 text-emerald-400 tracking-tight">
            R$ {totalEntradasFinanceiro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Produção + Entradas Pessoais
          </div>
        </div>

        {/* KPI 4: Despesas Domésticas */}
        <div className="card-cyber p-5 rounded-3xl transition-all hover:scale-[1.02]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-rose-400 uppercase tracking-wider">Despesas do Lar</p>
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
      </div>

      {/* ASSISTENTE DE IA FINBOT & GAMIFICAÇÃO */}
      <AIFinBot itensProducao={itensProducao} transacoesFinanceiras={transacoesFinanceiras} darkMode={darkMode} />
      <GamificacaoFinanceira transacoes={transacoesFinanceiras} itensProducao={itensProducao} darkMode={darkMode} />

      {/* GRADE ORGANIZADA EM 2 COLUNAS: PRODUÇÃO E FINANCEIRO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* SEÇÃO 1: PAINEL EXECUTIVO DE PRODUÇÃO */}
        <div className={`p-6 rounded-3xl border shadow-xl space-y-5 ${
          darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="flex justify-between items-center pb-3 border-b border-slate-800/40">
            <div>
              <span className="text-[10px] font-medium uppercase text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded border border-teal-500/20 tracking-wider">
                MÓDULO DE PRODUÇÃO
              </span>
              <h2 className="font-semibold text-base flex items-center gap-2 text-white mt-1">
                <BarChart3 className="w-5 h-5 text-teal-400" /> Desempenho Faturado por Clínica
              </h2>
            </div>

            <button
              onClick={() => onNavigate('producao')}
              className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1 hover:underline cursor-pointer"
            >
              Ver Tabela Completa <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Cards Rápidos Fernando vs Bernardo */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
              <span className="text-[10px] font-medium uppercase text-sky-400 block">Fernando (4 Clínicas)</span>
              <span className="text-base font-bold text-white block">
                R$ {totalFernandoR$.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-400 font-normal">{itensFernando.length} exames faturados</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
              <span className="text-[10px] font-medium uppercase text-indigo-400 block">Bernardo (3 Clínicas)</span>
              <span className="text-base font-bold text-white block">
                R$ {totalBernardoR$.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-400 font-normal">{itensBernardo.length} exames faturados</span>
            </div>
          </div>

          {/* Ranking em Barras das Clínicas */}
          <div className="space-y-3 pt-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Distribuição por Unidade (Extraído da Produção):
            </span>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {resumoClinicasProducao.map((c) => {
                const pct = Math.round((c.valor / maxClinicaVal) * 100);
                return (
                  <div key={c.nome} className="p-3 rounded-2xl bg-slate-950/50 border border-slate-800/70 space-y-1.5">
                    <div className="flex justify-between items-center text-xs font-normal">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-teal-400 shrink-0" />
                        <span className="text-white font-semibold">{c.nome}</span>
                        <span className="text-[10px] text-slate-400 font-normal">({c.owner})</span>
                      </div>

                      <div className="text-right">
                        <span className="text-emerald-400 font-bold">
                          R$ {c.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-normal">{c.count} exames</span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-teal-500 to-emerald-400"
                        style={{ width: `${Math.max(5, pct)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* SEÇÃO 2: PAINEL EXECUTIVO DO FINANCEIRO PESSOAL */}
        <div className={`p-6 rounded-3xl border shadow-xl space-y-5 ${
          darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="flex justify-between items-center pb-3 border-b border-slate-800/40">
            <div>
              <span className="text-[10px] font-medium uppercase text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20 tracking-wider">
                MÓDULO FINANCEIRO PESSOAL
              </span>
              <h2 className="font-semibold text-base flex items-center gap-2 text-white mt-1">
                <Wallet className="w-5 h-5 text-emerald-400" /> Saúde Financeira & Orçamento do Lar
              </h2>
            </div>

            <button
              onClick={() => onNavigate('financeiro')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 hover:underline cursor-pointer"
            >
              Ver Extrato Pessoal <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Saldo Líquido e Comprometimento */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 border border-emerald-500/30 text-white space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium uppercase text-emerald-400 tracking-wider">Saldo Líquido do Mês</span>
              <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                {comprometimentoRenda}% da renda comprometida
              </span>
            </div>

            <h3 className={`text-2xl font-bold tracking-tight ${saldoLiquidoGeral >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              R$ {saldoLiquidoGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>

            <div className="flex justify-between text-[11px] text-slate-300 pt-1 border-t border-slate-800/80 font-normal">
              <span>Fixas do Lar: <strong className="font-semibold text-white">R$ {totalDespesasFixas.toLocaleString('pt-BR')}</strong></span>
              <span>Cartões / Variáveis: <strong className="font-semibold text-white">R$ {totalDespesasVariaveis.toLocaleString('pt-BR')}</strong></span>
            </div>
          </div>

          {/* Status de Contas Pagas vs Pendentes */}
          <div className="space-y-3 pt-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Controle de Pagamentos das Contas do Lar:
            </span>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 space-y-1">
                <div className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Contas Liquidadas
                </div>
                <span className="text-lg font-bold text-white block">{totalContasPagas} contas</span>
                <span className="text-[10px] text-emerald-400 block font-normal">Sem atrasos registrados</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 space-y-1">
                <div className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-4 h-4 text-amber-400" /> Pendentes a Pagar
                </div>
                <span className="text-lg font-bold text-white block">{totalContasPendentes} contas</span>
                <span className="text-[10px] text-amber-400 block font-normal">Agendadas em carteira</span>
              </div>
            </div>
          </div>

          {/* Botão de Atalho */}
          <button
            onClick={() => onNavigate('financeiro')}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2.5 rounded-2xl text-xs border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <DollarSign className="w-4 h-4 text-emerald-400" /> Lançar Nova Conta ou Entrada no Financeiro
          </button>
        </div>

      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import type { TransacaoPessoal } from '../types';
import LOGO_BASE64 from '../assets/logoData';
import { AIFinBot } from './AIFinBot';
import { GamificacaoFinanceira } from './GamificacaoFinanceira';
import {
  DollarSign,
  TrendingUp,
  Wallet,
  ShieldCheck,
  ChevronRight,
  CheckCircle2,
  Clock,
  ArrowDownRight,
  PieChart,
  Users,
  Eye,
  EyeOff,
  Landmark,
  Edit3,
  X,
  Check,
  Calendar,
  FileSpreadsheet,
  BarChart3,
  ArrowUpRight,
  Layers,
  Zap
} from 'lucide-react';

import { getUserKeys, getProducaoComoTransacoes, getItemJSON, pushToCloud, ensureCleanSlateV10 } from '../services/cloudSync';

interface DashboardProps {
  onNavigate: (tab: string) => void;
  darkMode?: boolean;
  userRole?: 'admin' | 'cliente';
  usuarioId?: string;
  onlineUsersCount?: number;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  darkMode,
  userRole = 'admin',
  usuarioId,
  onlineUsersCount = 1
}) => {
  ensureCleanSlateV10(usuarioId);
  const userKeys = getUserKeys(usuarioId);
  const chaveFinanceiro = userKeys.FINANCEIRO;
  const chaveSaldoConta = userKeys.SALDO_CONTA_PESSOAL || 'odonto_saldo_conta_pessoal_v1';

  // Estado para Ocultar / Visualizar Valores no Dashboard (Modo Privacidade)
  const [ocultarValores, setOcultarValores] = useState<boolean>(() => {
    return localStorage.getItem('odonto_ocultar_valores_dashboard') === 'true';
  });

  const toggleOcultarValores = () => {
    setOcultarValores((prev) => {
      const next = !prev;
      localStorage.setItem('odonto_ocultar_valores_dashboard', String(next));
      return next;
    });
  };

  const formatarValor = (valor: number, prefix: string = 'R$ ') => {
    if (ocultarValores) {
      return '••••••';
    }
    return `${prefix}${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const [transacoesFinanceiras, setTransacoesFinanceiras] = useState<TransacaoPessoal[]>(() => {
    return getItemJSON<TransacaoPessoal[]>(chaveFinanceiro, []);
  });

  const [prodSegura, setProdSegura] = useState<any[]>(() => {
    return getProducaoComoTransacoes(usuarioId);
  });

  // Estado para Saldo em Conta Pessoal (Minha Conta)
  const [saldoContaPessoal, setSaldoContaPessoal] = useState<number>(() => {
    const val = localStorage.getItem(chaveSaldoConta);
    return val !== null ? parseFloat(val) : 0;
  });

  const [bancoNomePessoal, setBancoNomePessoal] = useState<string>(() => {
    return localStorage.getItem(`${chaveSaldoConta}_banco`) || 'Conta Bancária Pessoal';
  });

  // Atualização orientada a eventos em tempo real
  useEffect(() => {
    const atualizar = () => {
      const dados = getItemJSON<TransacaoPessoal[]>(chaveFinanceiro, []);
      setTransacoesFinanceiras(dados);
      setProdSegura(getProducaoComoTransacoes(usuarioId));
      const valConta = localStorage.getItem(chaveSaldoConta);
      setSaldoContaPessoal(valConta !== null ? parseFloat(valConta) : 0);
    };

    atualizar();
    window.addEventListener('storage', atualizar);
    window.addEventListener('odonto_local_sync', atualizar);

    return () => {
      window.removeEventListener('storage', atualizar);
      window.removeEventListener('odonto_local_sync', atualizar);
    };
  }, [chaveFinanceiro, chaveSaldoConta, usuarioId]);

  const transSeguras = Array.isArray(transacoesFinanceiras) ? transacoesFinanceiras : [];

  const todasTransacoesCombinadas = [
    ...transSeguras,
    ...(Array.isArray(prodSegura) ? prodSegura : [])
  ];

  const [modalContaAberto, setModalContaAberto] = useState<boolean>(false);
  const [inputNovoSaldo, setInputNovoSaldo] = useState<string>('');
  const [inputNovoBanco, setInputNovoBanco] = useState<string>('');

  const handleAbrirModalConta = () => {
    setInputNovoSaldo(String(saldoContaPessoal));
    setInputNovoBanco(bancoNomePessoal);
    setModalContaAberto(true);
  };

  const handleSalvarSaldoConta = (e: React.FormEvent) => {
    e.preventDefault();
    const valorNum = parseFloat(inputNovoSaldo.replace(',', '.')) || 0;
    const bancoStr = inputNovoBanco.trim() || 'Conta Bancária Pessoal';

    setSaldoContaPessoal(valorNum);
    setBancoNomePessoal(bancoStr);

    localStorage.setItem(chaveSaldoConta, String(valorNum));
    localStorage.setItem(`${chaveSaldoConta}_banco`, bancoStr);

    pushToCloud({ saldoContaPessoal: valorNum, bancoNomePessoal: bancoStr }, usuarioId);
    setModalContaAberto(false);
  };

  // --- ESTATÍSTICAS DO FINANCEIRO PESSOAL DO USUÁRIO ---
  const totalEntradas = todasTransacoesCombinadas
    .filter((t) => t.tipo === 'Entrada')
    .reduce((acc, t) => acc + t.valor, 0);

  // Despesas Fixas e Variáveis Pendentes (Contas marcadas como 'Pago' são SUBTRAÍDAS das Despesas Totais do Lar no Dashboard)
  const totalDespesasFixas = transacoesFinanceiras
    .filter((t) => t.tipo === 'Despesa Fixa' && t.status !== 'Pago')
    .reduce((acc, t) => acc + t.valor, 0);

  const totalDespesasVariaveis = transacoesFinanceiras
    .filter((t) => t.tipo === 'Despesa Variável' && t.status !== 'Pago')
    .reduce((acc, t) => acc + t.valor, 0);

  const totalDespesasGerais = totalDespesasFixas + totalDespesasVariaveis;

  const totalDespesasPagasValor = transacoesFinanceiras
    .filter((t) => t.tipo !== 'Entrada' && t.status === 'Pago')
    .reduce((acc, t) => acc + t.valor, 0);

  const saldoOperacional = totalEntradas - totalDespesasGerais;
  const saldoLiquidoConsolidado = saldoOperacional + saldoContaPessoal;

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

  // Data formatada elegante
  const dataHojeFormatada = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  // Atalhos Dinâmicos do Hub Central
  const atalhosRapidos = [
    ...(userRole !== 'cliente'
      ? [
          {
            id: 'producao',
            titulo: 'Registrar Produção',
            sub: `${prodSegura.length} exames ativos no ciclo`,
            icon: FileSpreadsheet,
            cor: 'from-indigo-500/20 to-purple-500/10 border-indigo-500/30 text-indigo-300',
            iconBg: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
          }
        ]
      : []),
    {
      id: 'financeiro',
      titulo: 'Contas do Lar & Salário',
      sub: `${totalContasPendentes} pendentes • ${totalContasPagas} pagas`,
      icon: Wallet,
      cor: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-300',
      iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    },
    {
      id: 'agenda',
      titulo: 'Google Calendar Pessoal',
      sub: 'Compromissos & Família',
      icon: Calendar,
      cor: 'from-sky-500/20 to-blue-500/10 border-sky-500/30 text-sky-300',
      iconBg: 'bg-sky-500/20 text-sky-400 border-sky-500/30'
    },
    {
      id: 'relatorios',
      titulo: 'Relatórios & Extratos',
      sub: 'Exportação PDF & Filtros',
      icon: BarChart3,
      cor: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-300',
      iconBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    }
  ];

  return (
    <div className="space-y-6 w-full max-w-full animate-fadeIn font-sans text-slate-200">
      
      {/* 1. HERO COMMAND CENTER (DESIGN BENTO MODERNO) */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 border border-teal-500/25 bg-gradient-to-br from-[#0b1324] via-[#080d1a] to-[#0a2329] shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        {/* Luzes de Fundo Decorativas */}
        <div className="absolute -right-16 -top-16 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative shrink-0 hidden sm:flex items-center justify-center p-1 rounded-2xl bg-gradient-to-br from-teal-400 to-indigo-500 shadow-xl shadow-teal-500/20">
              <img
                src={LOGO_BASE64}
                alt="OdontoWeb PRO"
                className="w-14 h-14 object-contain rounded-xl bg-white p-1"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-slate-950 rounded-full animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 bg-teal-500/15 text-teal-300 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-teal-500/30">
                  <Zap className="w-3 h-3 text-amber-400" /> Command Center 2.5
                </span>

                <span className="text-[11px] text-slate-400 font-semibold capitalize bg-slate-900/70 px-3 py-1 rounded-full border border-slate-800">
                  📅 {dataHojeFormatada}
                </span>

                {userRole === 'admin' && (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                    <Users className="w-3 h-3" /> {onlineUsersCount} Online
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex flex-wrap items-center gap-2.5">
                <span>Visão Geral & Controle Inteligente</span>
                <span className="text-[11px] font-extrabold bg-gradient-to-r from-teal-500/20 to-emerald-500/20 text-teal-300 px-2.5 py-0.5 rounded-lg border border-teal-500/30">
                  SINCRONIZADO
                </span>
              </h1>

              <p className="text-slate-400 text-xs sm:text-sm max-w-2xl">
                Acompanhe seu patrimônio líquido, despesas do lar, produção de exames e agenda em um único painel dinâmico.
              </p>
            </div>
          </div>

          {/* Botões de Ação Rápida do Topo */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <button
              onClick={toggleOcultarValores}
              className={`flex-1 sm:flex-initial justify-center px-4 py-3 rounded-2xl text-xs font-extrabold border transition-all flex items-center gap-2 cursor-pointer ${
                ocultarValores
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
                  : 'bg-slate-900/90 text-slate-200 border-slate-700/80 hover:border-teal-500/40 hover:bg-slate-800'
              }`}
              title={ocultarValores ? 'Exibir Valores Financeiros' : 'Ocultar Valores Financeiros'}
            >
              {ocultarValores ? (
                <>
                  <EyeOff className="w-4 h-4 text-amber-400" />
                  <span>Modo Privado</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 text-teal-400" />
                  <span>Ocultar Valores</span>
                </>
              )}
            </button>

            {userRole !== 'cliente' && (
              <button
                onClick={() => onNavigate('producao')}
                className="flex-1 sm:flex-initial justify-center bg-slate-900/90 hover:bg-indigo-950/80 text-indigo-300 border border-indigo-500/40 font-extrabold px-4 py-3 rounded-2xl text-xs transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
              >
                <FileSpreadsheet className="w-4 h-4 text-indigo-400" /> + Lançar Produção
              </button>
            )}

            <button
              onClick={() => onNavigate('financeiro')}
              className="w-full sm:w-auto justify-center bg-gradient-to-r from-teal-500 via-teal-600 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-black px-5 py-3 rounded-2xl text-xs shadow-xl shadow-teal-500/25 transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
            >
              <Wallet className="w-4 h-4 text-white" /> Acessar Meu Financeiro
            </button>
          </div>
        </div>

        {/* BARRA DE ATALHOS DINÂMICOS (QUICK DOCK) */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/70">
          {atalhosRapidos.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`group p-3.5 rounded-2xl bg-gradient-to-br ${item.cor} border backdrop-blur-md cursor-pointer transition-all hover:scale-[1.02] flex items-center justify-between gap-3`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2.5 rounded-xl border ${item.iconBg} shrink-0 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <h4 className="text-xs font-extrabold text-white truncate flex items-center gap-1">
                      {item.titulo}
                    </h4>
                    <p className="text-[10px] text-slate-300/80 font-medium truncate mt-0.5">
                      {item.sub}
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. BENTO GRID DE MÉTRICAS PRINCIPAIS (4 KPI CARDS COM BARRAS DE PROGRESSO) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Renda / Entradas */}
        <div className="card-cyber p-5 rounded-3xl relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              Entradas & Renda Total
            </span>
            <div className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <p className="text-2xl sm:text-3xl font-black mt-4 text-white tracking-tight">
            {formatarValor(totalEntradas)}
          </p>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Produção + Rendas
            </span>
            <span className="text-[10px] text-slate-500 font-mono">{prodSegura.length} exames</span>
          </div>
        </div>

        {/* KPI 2: Despesas Totais do Lar */}
        <div className="card-cyber p-5 rounded-3xl relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-rose-400 uppercase tracking-wider bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
              Despesas Totais do Lar
            </span>
            <div className="p-2.5 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <p className="text-2xl sm:text-3xl font-black mt-4 text-rose-400 tracking-tight">
            {formatarValor(totalDespesasGerais)}
          </p>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-semibold">
            <span className="flex items-center gap-1 text-rose-300">
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" /> {comprometimentoRenda}% da renda
            </span>
            {totalDespesasPagasValor > 0 ? (
              <span className="text-[10px] text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/30 font-extrabold">
                - {formatarValor(totalDespesasPagasValor)} pagos
              </span>
            ) : (
              <span className="text-[10px] text-slate-500">Em aberto</span>
            )}
          </div>
        </div>

        {/* KPI 3: Saldo Líquido Consolidado */}
        <div className="card-cyber p-5 rounded-3xl relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl group-hover:bg-teal-500/20 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-teal-400 uppercase tracking-wider bg-teal-500/10 px-2.5 py-1 rounded-lg border border-teal-500/20">
              Saldo Líquido Disponível
            </span>
            <div className="p-2.5 rounded-2xl bg-teal-500/15 text-teal-400 border border-teal-500/30">
              <Wallet className="w-5 h-5" />
            </div>
          </div>

          <p className={`text-2xl sm:text-3xl font-black mt-4 tracking-tight ${saldoLiquidoConsolidado >= 0 ? 'text-teal-300' : 'text-rose-400'}`}>
            {formatarValor(saldoLiquidoConsolidado)}
          </p>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-semibold text-teal-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              Balanço + Conta
            </span>
            {saldoContaPessoal > 0 && (
              <span className="text-[10px] text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-md border border-indigo-500/30">
                + {formatarValor(saldoContaPessoal)}
              </span>
            )}
          </div>
        </div>

        {/* KPI 4: Contas Liquidadas vs Pendentes */}
        <div className="card-cyber p-5 rounded-3xl relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl group-hover:bg-sky-500/20 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-sky-400 uppercase tracking-wider bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20">
              Status das Contas
            </span>
            <div className="p-2.5 rounded-2xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4 flex items-baseline gap-2">
            <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {totalContasPagas}
            </p>
            <span className="text-xs font-bold text-emerald-400">pagas</span>
            <span className="text-slate-600">•</span>
            <span className="text-xs font-bold text-amber-400">{totalContasPendentes} pendentes</span>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span className="flex items-center gap-1 text-amber-300">
              <Clock className="w-3.5 h-3.5 text-amber-400" /> Controle Mensal
            </span>
            <button
              onClick={() => onNavigate('financeiro')}
              className="text-[10px] text-sky-400 hover:underline font-extrabold cursor-pointer"
            >
              Gerenciar →
            </button>
          </div>
        </div>
      </div>

      {/* 3. BENTO ROW: MINHA CONTA PESSOAL + RESUMO RÁPIDO DE PRODUÇÃO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card Minha Conta Pessoal (Ocupa 2 colunas no Desktop) */}
        <div className="lg:col-span-2 p-6 rounded-3xl border shadow-xl bg-gradient-to-r from-[#0c1428] via-[#0f172a] to-indigo-950/90 border-indigo-500/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-4 relative z-10">
            <div className="p-4 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-lg shrink-0">
              <Landmark className="w-7 h-7" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300 bg-indigo-500/20 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                  Minha Conta Pessoal
                </span>
                <span className="text-xs text-slate-300 font-bold">{bancoNomePessoal}</span>
              </div>

              <div className="flex items-baseline gap-3 mt-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase">Saldo Atual:</span>
                <span className="text-2xl sm:text-3xl font-black text-indigo-300 tracking-tight">
                  {formatarValor(saldoContaPessoal)}
                </span>
              </div>

              <p className="text-[11px] text-slate-400 mt-1">
                Somado automaticamente ao <strong className="text-teal-400">Saldo Líquido Disponível</strong> para refletir seu caixa real.
              </p>
            </div>
          </div>

          <button
            onClick={handleAbrirModalConta}
            className="relative z-10 px-5 py-3 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer transition-all hover:scale-105 shrink-0 w-full sm:w-auto"
          >
            <Edit3 className="w-4 h-4" /> Atualizar Saldo
          </button>
        </div>

        {/* Card Resumo Dinâmico de Produção & Fechamentos */}
        <div className="p-6 rounded-3xl border border-teal-500/25 bg-gradient-to-br from-slate-900/95 via-slate-950 to-teal-950/60 shadow-xl flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-teal-300 bg-teal-500/15 px-2.5 py-0.5 rounded-full border border-teal-500/30">
                Produção do Ciclo
              </span>
              <h3 className="text-base font-extrabold text-white mt-1 flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-400" /> Exames em Aberto
              </h3>
            </div>
            <span className="text-2xl font-black text-teal-400 font-mono">
              {prodSegura.length}
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Os fechamentos mensais (<strong className="text-slate-200">Fernando</strong>) e quinzenais (<strong className="text-slate-200">Bernardo</strong>) ficam guardados com segurança no Histórico.
          </p>

          <button
            onClick={() => onNavigate('producao')}
            className="w-full py-2.5 px-4 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <span>Abrir Painel de Produção</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4. PAINEL ANALÍTICO DUPLO: CATEGORIAS DE DESPESA & SAÚDE ORÇAMENTÁRIA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* COLUNA 1: DISTRIBUIÇÃO DOS GASTOS POR CATEGORIA */}
        <div className="bento-glass p-6 rounded-3xl space-y-5">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800/60">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-md border border-rose-500/20 tracking-wider">
                DESPESAS DO LAR
              </span>
              <h2 className="font-extrabold text-base flex items-center gap-2 text-white mt-1">
                <PieChart className="w-5 h-5 text-rose-400" /> Distribuição por Categoria
              </h2>
            </div>

            <button
              onClick={() => onNavigate('financeiro')}
              className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 cursor-pointer transition-all"
            >
              Ver Extrato <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 pt-1">
            {resumoCategorias.length === 0 ? (
              <div className="text-center py-10 px-4 rounded-2xl bg-slate-950/50 border border-dashed border-slate-800 space-y-2">
                <PieChart className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs font-bold text-slate-300">
                  Nenhuma despesa cadastrada neste ciclo
                </p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  Clique em "Acessar Meu Financeiro" para lançar suas contas fixas ou variáveis do lar.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {resumoCategorias.map((cat) => {
                  const pct = Math.round((cat.valor / maxCategoriaVal) * 100);
                  return (
                    <div key={cat.categoria} className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-rose-500/30 transition-all space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white font-bold">{cat.categoria}</span>
                        <span className="text-rose-400 font-black">
                          {formatarValor(cat.valor)}
                        </span>
                      </div>

                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-rose-500 to-amber-400"
                          style={{ width: `${Math.max(5, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* COLUNA 2: SAÚDE FINANCEIRA & BALANÇO DO MÊS */}
        <div className="bento-glass p-6 rounded-3xl space-y-5 flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800/60">
              <div>
                <span className="text-[10px] font-extrabold uppercase text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20 tracking-wider">
                  BALANÇO MENSAL
                </span>
                <h2 className="font-extrabold text-base flex items-center gap-2 text-white mt-1">
                  <Wallet className="w-5 h-5 text-emerald-400" /> Saúde Orçamentária
                </h2>
              </div>

              <button
                onClick={() => onNavigate('financeiro')}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 cursor-pointer transition-all"
              >
                + Lançar Conta <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/70 border border-emerald-500/30 text-white space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-extrabold uppercase text-emerald-400 tracking-wider">Resultado Operacional</span>
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  {comprometimentoRenda}% comprometido
                </span>
              </div>

              <h3 className={`text-2xl sm:text-3xl font-black tracking-tight ${saldoOperacional >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatarValor(saldoOperacional)}
              </h3>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/80 text-xs">
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Despesas Fixas</span>
                  <strong className="font-extrabold text-sky-400 text-sm">{formatarValor(totalDespesasFixas)}</strong>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Despesas Variáveis</span>
                  <strong className="font-extrabold text-rose-400 text-sm">{formatarValor(totalDespesasVariaveis)}</strong>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('financeiro')}
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white font-black py-3.5 rounded-2xl text-xs shadow-xl shadow-teal-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <DollarSign className="w-4 h-4" /> Gerenciar Contas do Lar & Salário
          </button>
        </div>

      </div>

      {/* 5. ASSISTENTE DE IA FINBOT & GAMIFICAÇÃO EM LINHA COMPACTA */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <AIFinBot transacoesFinanceiras={transacoesFinanceiras} darkMode={darkMode} />
        <GamificacaoFinanceira transacoes={transacoesFinanceiras} darkMode={darkMode} />
      </div>

      {/* MODAL DE EDIÇÃO DO SALDO DA MINHA CONTA PESSOAL */}
      {modalContaAberto && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className={`w-full max-w-md rounded-3xl border shadow-2xl p-6 relative overflow-hidden space-y-5 ${
            darkMode ? 'bg-slate-900 border-indigo-900/60 text-white' : 'bg-white border-indigo-200 text-slate-900'
          }`}>
            <button
              onClick={() => setModalContaAberto(false)}
              className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/80 hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Landmark className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  Minha Conta Bancária
                </span>
                <h3 className="text-lg font-black mt-0.5">
                  Atualizar Saldo em Conta
                </h3>
              </div>
            </div>

            <form onSubmit={handleSalvarSaldoConta} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Identificação / Nome da Conta ou Banco</label>
                <input
                  type="text"
                  required
                  value={inputNovoBanco}
                  onChange={(e) => setInputNovoBanco(e.target.value)}
                  placeholder="Ex: Itaú, Bradesco, Nubank, Carteira Pessoal"
                  className={`w-full p-3 rounded-xl text-xs border outline-none font-bold ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Saldo Atual da Conta (R$)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-xs font-black text-indigo-400">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={inputNovoSaldo}
                    onChange={(e) => setInputNovoSaldo(e.target.value)}
                    placeholder="0.00"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl text-base border outline-none font-black ${
                      darkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'
                    }`}
                  />
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  💡 Este valor será calculado junto com o Saldo Líquido Disponível no Dashboard.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800/40">
                <button
                  type="button"
                  onClick={() => setModalContaAberto(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white shadow-lg shadow-indigo-600/30 cursor-pointer transition-all hover:scale-105"
                >
                  <Check className="w-4 h-4 inline mr-1" /> Salvar Saldo na Conta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

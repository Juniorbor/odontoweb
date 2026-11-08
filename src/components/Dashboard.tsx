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
  Activity
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
            icon: FileSpreadsheet
          }
        ]
      : []),
    {
      id: 'financeiro',
      titulo: 'Contas do Lar & Salário',
      sub: `${totalContasPendentes} pendentes • ${totalContasPagas} pagas`,
      icon: Wallet
    },
    {
      id: 'agenda',
      titulo: 'Google Calendar Pessoal',
      sub: 'Compromissos & Família',
      icon: Calendar
    },
    {
      id: 'relatorios',
      titulo: 'Relatórios & Extratos',
      sub: 'Exportação PDF & Filtros',
      icon: BarChart3
    }
  ];

  return (
    <div className="space-y-7 w-full max-w-full animate-fadeIn font-sans">
      
      {/* 1. HERO EXECUTIVO CORPORATIVO (AZUL-PETRÓLEO PROFUNDO COM ALTO CONTRASTE) */}
      <div className="hero-executive relative overflow-hidden rounded-3xl p-6 sm:p-8">
        <div className="absolute -right-16 -top-16 w-96 h-96 bg-sky-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-80 h-80 bg-teal-400/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative shrink-0 hidden sm:flex items-center justify-center p-1.5 rounded-2xl bg-white/15 border border-white/25 shadow-lg">
              <img
                src={LOGO_BASE64}
                alt="OdontoWeb PRO"
                className="w-14 h-14 object-contain rounded-xl bg-white p-1"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-[#0b2545] rounded-full" />
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border border-white/25">
                  <Activity className="w-3.5 h-3.5 text-teal-300" /> Painel Executivo OdontoWeb
                </span>

                <span className="text-xs text-sky-100 font-bold capitalize bg-black/20 px-3 py-1 rounded-full border border-white/15">
                  📅 {dataHojeFormatada}
                </span>

                {userRole === 'admin' && (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-400/20 text-emerald-200 text-[11px] font-extrabold px-3 py-1 rounded-full border border-emerald-300/30">
                    <span className="w-2 h-2 bg-emerald-300 rounded-full animate-ping" />
                    <Users className="w-3.5 h-3.5" /> {onlineUsersCount} Online
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex flex-wrap items-center gap-2.5">
                <span>Visão Geral & Controle Financeiro</span>
                <span className="text-[11px] font-extrabold bg-teal-400/20 text-teal-200 px-2.5 py-0.5 rounded-lg border border-teal-300/30">
                  SINCRONIZADO
                </span>
              </h1>

              <p className="text-sky-100 font-medium text-xs sm:text-sm max-w-2xl leading-relaxed">
                Acompanhe seu patrimônio líquido, despesas do lar, produção clínica de exames e agenda em um ambiente corporativo limpo e organizado.
              </p>
            </div>
          </div>

          {/* Botões de Ação Rápida do Topo */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <button
              onClick={toggleOcultarValores}
              className="flex-1 sm:flex-initial justify-center px-4 py-3 rounded-xl text-xs font-extrabold border border-white/25 bg-white/10 hover:bg-white/20 text-white transition-all flex items-center gap-2 cursor-pointer"
              title={ocultarValores ? 'Exibir Valores Financeiros' : 'Ocultar Valores Financeiros'}
            >
              {ocultarValores ? (
                <>
                  <EyeOff className="w-4 h-4 text-amber-300" />
                  <span>Modo Privado</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 text-teal-200" />
                  <span>Ocultar Valores</span>
                </>
              )}
            </button>

            {userRole !== 'cliente' && (
              <button
                onClick={() => onNavigate('producao')}
                className="flex-1 sm:flex-initial justify-center bg-white/15 hover:bg-white/25 text-white border border-white/30 font-extrabold px-4 py-3 rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-sky-200" /> + Lançar Produção
              </button>
            )}

            <button
              onClick={() => onNavigate('financeiro')}
              className="w-full sm:w-auto justify-center bg-white text-[#0b2545] hover:bg-sky-50 font-extrabold px-5 py-3 rounded-xl text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer hover:translate-y-[-1px]"
            >
              <Wallet className="w-4 h-4 text-[#0284c7]" /> Acessar Meu Financeiro
            </button>
          </div>
        </div>

        {/* BARRA DE ATALHOS DINÂMICOS (QUICK DOCK) */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-white/15">
          {atalhosRapidos.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="group p-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-xs cursor-pointer transition-all hover:translate-y-[-2px] flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-white/15 text-white border border-white/20 shrink-0 group-hover:scale-105 transition-transform">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <h4 className="text-xs font-extrabold text-white truncate">
                      {item.titulo}
                    </h4>
                    <p className="text-[11px] text-sky-100 font-medium truncate mt-0.5">
                      {item.sub}
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-white/80 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. MÉTRICAS PRINCIPAIS EM CARDS BRANCOS DE ALTO CONTRASTE (4 KPI CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI 1: Renda / Entradas */}
        <div className="card-clinical p-6 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
              Entradas & Renda Total
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <p className="text-2xl sm:text-3xl font-extrabold mt-4 text-slate-900 tracking-tight">
            {formatarValor(totalEntradas)}
          </p>

          <div className="mt-4 pt-3.5 border-t border-slate-200/80 flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Produção + Rendas
            </span>
            <span className="text-xs text-slate-600 font-bold">{prodSegura.length} exames</span>
          </div>
        </div>

        {/* KPI 2: Despesas Totais do Lar */}
        <div className="card-clinical p-6 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-rose-800 uppercase tracking-wider bg-rose-50 px-3 py-1 rounded-lg border border-rose-200">
              Despesas Totais do Lar
            </span>
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <p className="text-2xl sm:text-3xl font-extrabold mt-4 text-rose-700 tracking-tight">
            {formatarValor(totalDespesasGerais)}
          </p>

          <div className="mt-4 pt-3.5 border-t border-slate-200/80 flex items-center justify-between text-xs font-bold">
            <span className="flex items-center gap-1 text-rose-700">
              <ArrowDownRight className="w-4 h-4 text-rose-600" /> {comprometimentoRenda}% da renda
            </span>
            {totalDespesasPagasValor > 0 ? (
              <span className="text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 font-extrabold">
                - {formatarValor(totalDespesasPagasValor)} pagos
              </span>
            ) : (
              <span className="text-xs text-slate-600 font-bold">Em aberto</span>
            )}
          </div>
        </div>

        {/* KPI 3: Saldo Líquido Consolidado */}
        <div className="card-clinical p-6 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-sky-800 uppercase tracking-wider bg-sky-50 px-3 py-1 rounded-lg border border-sky-200">
              Saldo Líquido Disponível
            </span>
            <div className="p-2.5 rounded-xl bg-sky-50 text-sky-700 border border-sky-200">
              <Wallet className="w-5 h-5" />
            </div>
          </div>

          <p className={`text-2xl sm:text-3xl font-extrabold mt-4 tracking-tight ${saldoLiquidoConsolidado >= 0 ? 'text-sky-800' : 'text-rose-700'}`}>
            {formatarValor(saldoLiquidoConsolidado)}
          </p>

          <div className="mt-4 pt-3.5 border-t border-slate-200/80 flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5 text-sky-800">
              <span className="w-2 h-2 rounded-full bg-sky-600" />
              Balanço + Conta
            </span>
            {saldoContaPessoal > 0 && (
              <span className="text-[11px] text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 font-extrabold">
                + {formatarValor(saldoContaPessoal)}
              </span>
            )}
          </div>
        </div>

        {/* KPI 4: Contas Liquidadas vs Pendentes */}
        <div className="card-clinical p-6 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-teal-800 uppercase tracking-wider bg-teal-50 px-3 py-1 rounded-lg border border-teal-200">
              Status das Contas
            </span>
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4 flex items-baseline gap-2">
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {totalContasPagas}
            </p>
            <span className="text-xs font-extrabold text-emerald-700">pagas</span>
            <span className="text-slate-400">•</span>
            <span className="text-xs font-extrabold text-amber-700">{totalContasPendentes} pendentes</span>
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-200/80 flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1 text-slate-700">
              <Clock className="w-3.5 h-3.5 text-amber-600" /> Controle Mensal
            </span>
            <button
              onClick={() => onNavigate('financeiro')}
              className="text-xs text-sky-700 hover:text-sky-900 hover:underline font-extrabold cursor-pointer"
            >
              Gerenciar →
            </button>
          </div>
        </div>
      </div>

      {/* 3. BENTO ROW: MINHA CONTA PESSOAL + RESUMO RÁPIDO DE PRODUÇÃO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card Minha Conta Pessoal (Ocupa 2 colunas no Desktop) */}
        <div className="lg:col-span-2 card-clinical p-6 sm:p-7 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-sky-50 text-sky-700 border border-sky-200 shrink-0">
              <Landmark className="w-7 h-7" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-800 bg-sky-50 px-3 py-0.5 rounded-full border border-sky-200">
                  Minha Conta Pessoal
                </span>
                <span className="text-xs text-slate-700 font-extrabold">{bancoNomePessoal}</span>
              </div>

              <div className="flex items-baseline gap-3 mt-2">
                <span className="text-xs font-extrabold text-slate-600 uppercase">Saldo Atual:</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {formatarValor(saldoContaPessoal)}
                </span>
              </div>

              <p className="text-xs font-medium text-slate-600 mt-1">
                Somado automaticamente ao <strong className="text-sky-800 font-bold">Saldo Líquido Disponível</strong> para refletir seu caixa real.
              </p>
            </div>
          </div>

          <button
            onClick={handleAbrirModalConta}
            className="px-5 py-3 bg-gradient-to-r from-[#0284c7] to-[#0d9488] hover:from-[#0369a1] hover:to-[#0f766e] text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-sky-600/15 cursor-pointer transition-all hover:translate-y-[-1px] shrink-0 w-full sm:w-auto"
          >
            <Edit3 className="w-4 h-4" /> Atualizar Saldo
          </button>
        </div>

        {/* Card Resumo Dinâmico de Produção & Fechamentos */}
        <div className="card-clinical p-6 sm:p-7 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-800 bg-teal-50 px-3 py-0.5 rounded-full border border-teal-200">
                Produção do Ciclo
              </span>
              <h3 className="text-base font-extrabold text-slate-900 mt-1.5 flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-700" /> Exames em Aberto
              </h3>
            </div>
            <span className="text-3xl font-extrabold text-teal-700 font-mono">
              {prodSegura.length}
            </span>
          </div>

          <p className="text-xs font-medium text-slate-600 leading-relaxed">
            Os fechamentos mensais (<strong className="text-slate-900 font-bold">Fernando</strong>) e quinzenais (<strong className="text-slate-900 font-bold">Bernardo</strong>) ficam guardados com segurança no Histórico.
          </p>

          <button
            onClick={() => onNavigate('producao')}
            className="w-full py-3 px-4 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <span>Abrir Painel de Produção</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4. PAINEL ANALÍTICO DUPLO: CATEGORIAS DE DESPESA & SAÚDE ORÇAMENTÁRIA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* COLUNA 1: DISTRIBUIÇÃO DOS GASTOS POR CATEGORIA */}
        <div className="card-clinical p-6 sm:p-7 space-y-5">
          <div className="flex justify-between items-center pb-4 border-b border-slate-200">
            <div>
              <span className="text-[11px] font-extrabold uppercase text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200 tracking-wider">
                DESPESAS DO LAR
              </span>
              <h2 className="font-extrabold text-lg flex items-center gap-2 text-slate-900 mt-1.5">
                <PieChart className="w-5 h-5 text-rose-600" /> Distribuição por Categoria
              </h2>
            </div>

            <button
              onClick={() => onNavigate('financeiro')}
              className="text-xs font-extrabold text-rose-700 hover:bg-rose-100 flex items-center gap-1 px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 cursor-pointer transition-all"
            >
              Ver Extrato <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3 pt-1">
            {resumoCategorias.length === 0 ? (
              <div className="text-center py-10 px-4 rounded-2xl bg-slate-50 border border-dashed border-slate-300 space-y-2">
                <PieChart className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-sm font-extrabold text-slate-800">
                  Nenhuma despesa cadastrada neste ciclo
                </p>
                <p className="text-xs font-medium text-slate-600 max-w-xs mx-auto">
                  Clique em "Acessar Meu Financeiro" para lançar suas contas fixas ou variáveis do lar.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {resumoCategorias.map((cat) => {
                  const pct = Math.round((cat.valor / maxCategoriaVal) * 100);
                  return (
                    <div key={cat.categoria} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-rose-300 transition-all space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-900 font-extrabold">{cat.categoria}</span>
                        <span className="text-rose-700 font-extrabold">
                          {formatarValor(cat.valor)}
                        </span>
                      </div>

                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-rose-600 to-amber-500"
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
        <div className="card-clinical p-6 sm:p-7 space-y-5 flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200">
              <div>
                <span className="text-[11px] font-extrabold uppercase text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200 tracking-wider">
                  BALANÇO MENSAL
                </span>
                <h2 className="font-extrabold text-lg flex items-center gap-2 text-slate-900 mt-1.5">
                  <Wallet className="w-5 h-5 text-teal-700" /> Saúde Orçamentária
                </h2>
              </div>

              <button
                onClick={() => onNavigate('financeiro')}
                className="text-xs font-extrabold text-teal-800 hover:bg-teal-100 flex items-center gap-1 px-3.5 py-2 rounded-xl bg-teal-50 border border-teal-200 cursor-pointer transition-all"
              >
                + Lançar Conta <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-extrabold uppercase text-slate-700 tracking-wider">Resultado Operacional</span>
                <span className="text-xs font-extrabold text-sky-800 bg-sky-50 px-3 py-0.5 rounded-full border border-sky-200">
                  {comprometimentoRenda}% comprometido
                </span>
              </div>

              <h3 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${saldoOperacional >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {formatarValor(saldoOperacional)}
              </h3>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200 text-xs">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-600 block uppercase font-extrabold">Despesas Fixas</span>
                  <strong className="font-extrabold text-sky-800 text-sm mt-0.5 block">{formatarValor(totalDespesasFixas)}</strong>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-600 block uppercase font-extrabold">Despesas Variáveis</span>
                  <strong className="font-extrabold text-rose-700 text-sm mt-0.5 block">{formatarValor(totalDespesasVariaveis)}</strong>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('financeiro')}
            className="w-full bg-gradient-to-r from-[#0b2545] to-[#0e4d64] hover:from-[#0f315a] hover:to-[#0d9488] text-white font-extrabold py-3.5 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-2xl p-6 sm:p-7 relative overflow-hidden space-y-5">
            <button
              onClick={() => setModalContaAberto(false)}
              className="absolute right-4 top-4 p-2 text-slate-500 hover:text-slate-900 rounded-xl bg-slate-100 hover:bg-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5 border-b border-slate-200 pb-4">
              <div className="p-3 rounded-2xl bg-sky-50 text-sky-700 border border-sky-200">
                <Landmark className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-200">
                  Minha Conta Bancária
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-1">
                  Atualizar Saldo em Conta
                </h3>
              </div>
            </div>

            <form onSubmit={handleSalvarSaldoConta} className="space-y-4">
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1.5">
                  Identificação / Nome da Conta ou Banco
                </label>
                <input
                  type="text"
                  required
                  value={inputNovoBanco}
                  onChange={(e) => setInputNovoBanco(e.target.value)}
                  placeholder="Ex: Itaú, Bradesco, Nubank, Carteira Pessoal"
                  className="w-full p-3 rounded-xl text-xs border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:border-sky-600 outline-none font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1.5">
                  Saldo Atual da Conta (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-xs font-extrabold text-sky-700">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={inputNovoSaldo}
                    onChange={(e) => setInputNovoSaldo(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-base border border-slate-300 bg-slate-50 text-slate-900 focus:bg-white focus:border-sky-600 outline-none font-extrabold"
                  />
                </div>
                <span className="text-xs font-medium text-slate-600 mt-1.5 block">
                  💡 Este valor será somado automaticamente ao Saldo Líquido Disponível no Dashboard.
                </span>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalContaAberto(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-extrabold bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-[#0284c7] to-[#0d9488] hover:from-[#0369a1] hover:to-[#0f766e] text-white shadow-md cursor-pointer transition-all"
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

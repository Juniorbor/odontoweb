import React, { useState, useEffect } from 'react';
import type { TransacaoPessoal } from '../types';
import { pushToCloud, pullFromCloud, subscribeLocalBroadcast, getUserKeys } from '../services/cloudSync';
import { LeitorComprovanteOCR } from './LeitorComprovanteOCR';
import { DREGerencial } from './DREGerencial';
import { CartoesEMetas } from './CartoesEMetas';
import { CalendarioVencimentos } from './CalendarioVencimentos';
import { Regra503020 } from './Regra503020';
import { GeradorReciboPessoal } from './GeradorReciboPessoal';
import { ComandoVozModal } from './ComandoVozModal';
import { SimuladorSonhosMetas } from './SimuladorSonhosMetas';
import { GraficosVisualizer } from './GraficosVisualizer';
import {
  DollarSign,
  Plus,
  Filter,
  Edit2,
  Trash2,
  Home,
  CreditCard,
  TrendingUp,
  FileText,
  Search,
  X,
  Download,
  Wallet,
  RefreshCw,
  Sparkles,
  PieChart,
  BarChart3,
  Camera,
  Calendar,
  Compass,
  Mic
} from 'lucide-react';

interface FinanceiroProps {
  darkMode?: boolean;
  userRole?: 'admin' | 'cliente';
  usuarioId?: string;
}

const CATEGORIAS_PESSOAIS = [
  'Salário & Renda',
  'Aluguel & Moradia',
  'Contas de Consumo (Água/Luz/Net)',
  'Educação & Faculdade',
  'Transporte & Combustível',
  'Alimentação & Mercado',
  'Família & Filha',
  'Cartões de Crédito',
  'Empréstimos & Acordos',
  'Materiais & Outros'
];



export const Financeiro: React.FC<FinanceiroProps> = ({ darkMode, usuarioId }) => {
  const userKeys = getUserKeys(usuarioId);
  const STORAGE_KEY = userKeys.FINANCEIRO;

  const [transacoes, setTransacoes] = useState<TransacaoPessoal[]>(() => {
    const salvo = localStorage.getItem(STORAGE_KEY);
    if (salvo !== null) {
      try {
        return JSON.parse(salvo);
      } catch (e) {
        console.error('Erro ao ler transações pessoais do localStorage:', e);
      }
    }
    return [];
  });

  const [sincronizando, setSincronizando] = useState<boolean>(false);

  // Função central para salvar e sincronizar instantaneamente na nuvem para todos os dispositivos
  const updateTransacoesECloud = (novas: TransacaoPessoal[]) => {
    setTransacoes(novas);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(novas));
    pushToCloud({ financeiro: novas }, usuarioId);
  };

  const handleZerarTodasTransacoes = () => {
    if (window.confirm('Tem certeza que deseja apagar TODOS os lançamentos de contas do financeiro? O painel ficará 100% zerado.')) {
      updateTransacoesECloud([]);
    }
  };

  // Carregamento e Polling em Tempo Real da Nuvem
  useEffect(() => {
    // 1. Busca imediata na nuvem ao abrir
    setSincronizando(true);
    pullFromCloud((payload) => {
      if (payload.financeiro) {
        setTransacoes(payload.financeiro);
      }
      setSincronizando(false);
    }, true, usuarioId);

    // 2. Escuta alterações locais de abas simultâneas via BroadcastChannel
    const unsubscribeBroadcast = subscribeLocalBroadcast((payload) => {
      if (payload.usuarioId === usuarioId || !payload.usuarioId) {
        if (payload.financeiro) {
          setTransacoes(payload.financeiro);
        }
      }
    });

    // 3. Polling contínuo a cada 2 segundos
    const interval = setInterval(() => {
      pullFromCloud((payload) => {
        if (payload.financeiro) {
          setTransacoes(payload.financeiro);
        }
      }, false, usuarioId);
    }, 2000);

    const handleFocus = () => {
      pullFromCloud((payload) => {
        if (payload.financeiro) setTransacoes(payload.financeiro);
      }, true);
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      unsubscribeBroadcast();
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const [subAbaFinanceiro, setSubAbaFinanceiro] = useState<'lancamentos' | 'calendario' | '503020' | 'recibo' | 'metas' | 'graficos' | 'dre' | 'cartoes'>('lancamentos');
  const [modalOCRAberto, setModalOCRAberto] = useState<boolean>(false);
  const [modalVozAberto, setModalVozAberto] = useState<boolean>(false);

  const [filtroTipo, setFiltroTipo] = useState<string>('Todos');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('Todas');
  const [busca, setBusca] = useState<string>('');

  // Modal State
  const [modalAberto, setModalAberto] = useState<boolean>(false);
  const [transacaoEditando, setTransacaoEditando] = useState<TransacaoPessoal | null>(null);

  // Form State
  const [descricao, setDescricao] = useState<string>('');
  const [tipo, setTipo] = useState<'Entrada' | 'Despesa Fixa' | 'Despesa Variável'>('Despesa Fixa');
  const [valor, setValor] = useState<number>(100);
  const [categoria, setCategoria] = useState<string>('Aluguel & Moradia');
  const [data, setData] = useState<string>(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'Pago' | 'Pendente'>('Pago');
  const [parcelas, setParcelas] = useState<string>('');
  const [observacao, setObservacao] = useState<string>('');

  // Entradas e Salário cadastrados pelo usuário
  const totalEntradas = transacoes
    .filter((t) => t.tipo === 'Entrada')
    .reduce((acc, t) => acc + t.valor, 0);

  const totalDespesasFixas = transacoes
    .filter((t) => t.tipo === 'Despesa Fixa')
    .reduce((acc, t) => acc + t.valor, 0);

  const totalDespesasVariaveis = transacoes
    .filter((t) => t.tipo === 'Despesa Variável')
    .reduce((acc, t) => acc + t.valor, 0);

  const totalDespesasGerais = totalDespesasFixas + totalDespesasVariaveis;
  const saldoLiquidoPessoal = totalEntradas - totalDespesasGerais;
  const comprometimentoRenda = totalEntradas > 0 ? Math.round((totalDespesasGerais / totalEntradas) * 100) : 0;
  // Percentuais de Comprometimento de Renda para Gráficos
  const pctFixas = totalEntradas > 0 ? Math.round((totalDespesasFixas / totalEntradas) * 100) : 0;
  const pctVariaveis = totalEntradas > 0 ? Math.round((totalDespesasVariaveis / totalEntradas) * 100) : 0;
  const pctSaldo = totalEntradas > 0 ? Math.max(0, 100 - pctFixas - pctVariaveis) : 0;

  // Gastos por Categoria Pessoal (Barras Horizontais)
  const categoriasFinanceirasData = CATEGORIAS_PESSOAIS.map((cat) => {
    const valorTotalCat = transacoes
      .filter((t) => t.categoria === cat && t.tipo !== 'Entrada')
      .reduce((acc, t) => acc + t.valor, 0);
    const countCat = transacoes.filter((t) => t.categoria === cat && t.tipo !== 'Entrada').length;
    return {
      nome: cat,
      valor: valorTotalCat,
      count: countCat
    };
  })
    .filter((c) => c.valor > 0)
    .sort((a, b) => b.valor - a.valor);

  const maxCategoriaVal = Math.max(1, ...categoriasFinanceirasData.map((c) => c.valor));

  // Contagem de Contas Pagas vs Pendentes
  const totalPagas = transacoes.filter((t) => t.status === 'Pago').length + 1; // +1 pela linha automatica da producao
  const totalPendentes = transacoes.filter((t) => t.status === 'Pendente').length;
  const totalContas = totalPagas + totalPendentes;
  const pctPagas = totalContas > 0 ? Math.round((totalPagas / totalContas) * 100) : 100;

  // Helper de Renderização de Gráfico em Círculo (Donut SVG) para o Financeiro
  const renderDonutChartFinanceiro = (
    slices: { label: string; value: number; color: string }[],
    total: number,
    centerTitle: string,
    centerSub: string
  ) => {
    const R = 40;
    const C = 2 * Math.PI * R; // ~251.327
    let cumulativeOffset = 0;

    return (
      <div className="relative w-40 h-40 flex items-center justify-center shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          <circle cx="50" cy="50" r={R} fill="none" stroke={darkMode ? '#1E293B' : '#E2E8F0'} strokeWidth="12" />
          {total > 0 &&
            slices.map((slice, idx) => {
              const pct = slice.value / total;
              const dashLength = pct * C;
              const strokeDasharray = `${dashLength} ${C - dashLength}`;
              const strokeDashoffset = -cumulativeOffset;
              cumulativeOffset += dashLength;

              return (
                <circle
                  key={idx}
                  cx="50"
                  cy="50"
                  r={R}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth="12"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-500 hover:opacity-80 cursor-pointer"
                >
                  <title>{`${slice.label}: R$ ${slice.value.toLocaleString('pt-BR')} (${total > 0 ? Math.round((slice.value / total) * 100) : 0}%)`}</title>
                </circle>
              );
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-2">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">{centerSub}</span>
          <span className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight">{centerTitle}</span>
        </div>
      </div>
    );
  };

  const transacoesFiltradas = transacoes.filter((t) => {
    const atendeTipo = filtroTipo === 'Todos' || t.tipo === filtroTipo;
    const atendeCat = filtroCategoria === 'Todas' || t.categoria === filtroCategoria;
    const atendeBusca = t.descricao.toLowerCase().includes(busca.toLowerCase());
    return atendeTipo && atendeCat && atendeBusca;
  });

  const handleAbrirNovoModal = () => {
    setTransacaoEditando(null);
    setDescricao('');
    setTipo('Despesa Fixa');
    setValor(100);
    setCategoria('Aluguel & Moradia');
    setData(new Date().toISOString().split('T')[0]);
    setStatus('Pago');
    setParcelas('');
    setObservacao('');
    setModalAberto(true);
  };

  const handleAbrirEditarModal = (t: TransacaoPessoal) => {
    setTransacaoEditando(t);
    setDescricao(t.descricao);
    setTipo(t.tipo);
    setValor(t.valor);
    setCategoria(t.categoria);
    setData(t.data);
    setStatus(t.status);
    setParcelas(t.parcelas || '');
    setObservacao(t.observacao || '');
    setModalAberto(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao) return;

    if (transacaoEditando) {
      const atualizadas = transacoes.map((item) =>
        item.id === transacaoEditando.id
          ? {
              ...item,
              descricao,
              tipo,
              valor: Number(valor),
              categoria,
              data,
              status,
              parcelas: parcelas || undefined,
              observacao: observacao || undefined
            }
          : item
      );
      updateTransacoesECloud(atualizadas);
    } else {
      const nova: TransacaoPessoal = {
        id: `fin-${Date.now()}`,
        descricao,
        tipo,
        valor: Number(valor),
        categoria,
        data,
        status,
        parcelas: parcelas || undefined,
        observacao: observacao || undefined
      };
      updateTransacoesECloud([nova, ...transacoes]);
    }

    setModalAberto(false);
  };

  const handleDeleteTransacao = (id: string) => {
    const restantes = transacoes.filter((t) => t.id !== id);
    updateTransacoesECloud(restantes);
  };

  const handleToggleStatus = (id: string) => {
    const alteradas = transacoes.map((t) =>
      t.id === id ? { ...t, status: (t.status === 'Pago' ? 'Pendente' : 'Pago') as 'Pago' | 'Pendente' } : t
    );
    updateTransacoesECloud(alteradas);
  };

  const handleManualSync = async () => {
    setSincronizando(true);
    await pullFromCloud((payload) => {
      if (payload.financeiro) setTransacoes(payload.financeiro);
    }, true);
    setSincronizando(false);
  };

  return (
    <div className="space-y-6">
      {/* SELETOR DE SUB-ABAS FINANCEIRAS */}
      <div className="bg-slate-950 p-1.5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 shadow-inner">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSubAbaFinanceiro('lancamentos')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              subAbaFinanceiro === 'lancamentos'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <DollarSign className="w-4 h-4 text-teal-300" /> Extrato & Contas do Lar
          </button>

          <button
            onClick={() => setSubAbaFinanceiro('calendario')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              subAbaFinanceiro === 'calendario'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4 text-amber-300" /> Calendário de Vencimentos
          </button>

          <button
            onClick={() => setSubAbaFinanceiro('503020')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              subAbaFinanceiro === '503020'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Compass className="w-4 h-4 text-sky-300" /> Regra 50 / 30 / 20
          </button>

          <button
            onClick={() => setSubAbaFinanceiro('recibo')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              subAbaFinanceiro === 'recibo'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-indigo-300" /> Recibos Pessoais
          </button>

          <button
            onClick={() => setSubAbaFinanceiro('metas')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              subAbaFinanceiro === 'metas'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" /> Metas & Sonhos
          </button>

          <button
            onClick={() => setSubAbaFinanceiro('graficos')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              subAbaFinanceiro === 'graficos'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-sky-300" /> Gráficos
          </button>

          <button
            onClick={() => setSubAbaFinanceiro('dre')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              subAbaFinanceiro === 'dre'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <PieChart className="w-4 h-4 text-emerald-400" /> DRE Gerencial
          </button>

          <button
            onClick={() => setSubAbaFinanceiro('cartoes')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              subAbaFinanceiro === 'cartoes'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4 text-purple-300" /> Cartão & Reserva
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setModalVozAberto(true)}
            className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <Mic className="w-4 h-4" /> Lançar por Voz
          </button>

          <button
            onClick={() => setModalOCRAberto(true)}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
          >
            <Camera className="w-4 h-4" /> Ler Foto (OCR IA)
          </button>
        </div>
      </div>

      {subAbaFinanceiro === 'calendario' ? (
        <CalendarioVencimentos transacoes={transacoes} darkMode={darkMode} />
      ) : subAbaFinanceiro === '503020' ? (
        <Regra503020 transacoes={transacoes} darkMode={darkMode} />
      ) : subAbaFinanceiro === 'recibo' ? (
        <GeradorReciboPessoal darkMode={darkMode} />
      ) : subAbaFinanceiro === 'metas' ? (
        <SimuladorSonhosMetas darkMode={darkMode} />
      ) : subAbaFinanceiro === 'graficos' ? (
        <GraficosVisualizer transacoesFinanceiras={transacoes} darkMode={darkMode} />
      ) : subAbaFinanceiro === 'dre' ? (
        <DREGerencial transacoesFinanceiras={transacoes} darkMode={darkMode} />
      ) : subAbaFinanceiro === 'cartoes' ? (
        <CartoesEMetas transacoesFinanceiras={transacoes} darkMode={darkMode} />
      ) : (
        <>
      {/* 1. HEADER GESTÃO FINANCEIRA PESSOAL COM GLOW */}
      <div className="card-cyber p-4 sm:p-6 rounded-3xl border shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-400 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/30 flex items-center gap-1.5 w-fit">
            <Wallet className="w-3.5 h-3.5" /> Módulo de Controle Orçamentário Familiar & Pessoal (Sincronizado)
          </span>
          <h2 className="text-xl font-extrabold flex items-center gap-2 mt-1 text-white">
            <DollarSign className="w-6 h-6 text-emerald-400" /> Gestão Financeira Pessoal & Despesas do Lar
          </h2>
          <p className="text-xs text-slate-300 font-normal">
            Controle de entradas (Salário/Renda), contas fixas da casa, cartões de crédito e despesas domésticas.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full md:w-auto">
          <button
            onClick={handleManualSync}
            disabled={sincronizando}
            className="bg-slate-950 hover:bg-slate-900 text-teal-400 font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center justify-center gap-1.5 border border-teal-500/30 transition-all cursor-pointer shadow-md shadow-teal-500/10 w-full sm:w-auto"
            title="Sincronizar dados em tempo real com a nuvem"
          >
            <RefreshCw className={`w-4 h-4 ${sincronizando ? 'animate-spin' : ''}`} />
            <span>{sincronizando ? 'Sincronizando...' : 'Atualizar Nuvem'}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="bg-slate-950 hover:bg-slate-900 text-slate-200 font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center justify-center gap-1.5 border border-slate-800 transition-all cursor-pointer shadow-md w-full sm:w-auto"
          >
            <Download className="w-4 h-4 text-teal-400" /> Exportar Extrato (PDF)
          </button>

          {transacoes.length > 0 && (
            <button
              onClick={handleZerarTodasTransacoes}
              className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center justify-center gap-1.5 border border-rose-500/30 transition-all cursor-pointer shadow-md w-full sm:w-auto"
              title="Apagar todos os lançamentos financeiros"
            >
              <Trash2 className="w-4 h-4 text-rose-400" /> Limpar Financeiro
            </button>
          )}

          <button
            onClick={handleAbrirNovoModal}
            className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-extrabold px-5 py-2.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xl shadow-teal-500/30 transition-all cursor-pointer w-full sm:w-auto hover:scale-[1.02]"
          >
            <Plus className="w-4.5 h-4.5" /> + Lançar Entrada ou Despesa do Lar
          </button>
        </div>
      </div>

      {/* 2. CARDS RESUMO DO ORÇAMENTO PESSOAL & DA CASA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Entradas / Salário */}
        <div className={`p-5 rounded-3xl border shadow-xl flex flex-col justify-between space-y-3 ${
          darkMode ? 'bg-slate-900 border-emerald-900/50 text-white' : 'bg-white border-emerald-200 text-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1 w-fit">
                <Sparkles className="w-3 h-3 text-amber-400" /> Renda & Entradas Totais
              </span>
              <h3 className="text-2xl font-bold text-emerald-400 mt-1">
                R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/40 text-[11px] text-slate-400 font-medium">
            Entradas e rendas registradas no painel
          </div>
        </div>

        {/* Despesas Fixas do Lar */}
        <div className={`p-5 rounded-3xl border shadow-xl flex items-center justify-between ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Despesas Fixas do Lar</span>
            <h3 className="text-xl font-extrabold text-sky-400 mt-0.5">R$ {totalDespesasFixas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            <span className="text-[10px] text-slate-400">
              Aluguel, Água, Luz, Faculdade, Net
            </span>
          </div>
          <div className="p-3 bg-sky-500/10 text-sky-400 rounded-2xl border border-sky-500/20">
            <Home className="w-6 h-6" />
          </div>
        </div>

        {/* Despesas Variáveis & Cartões */}
        <div className={`p-5 rounded-3xl border shadow-xl flex items-center justify-between ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Variáveis & Cartões</span>
            <h3 className="text-xl font-extrabold text-rose-400 mt-0.5">R$ {totalDespesasVariaveis.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
            <span className="text-[10px] text-slate-400">
              Cartões, Materiais e Empréstimos
            </span>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        {/* Saldo Pessoal / Reserva */}
        <div className={`p-5 rounded-3xl border shadow-xl flex items-center justify-between ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Saldo Pessoal do Mês</span>
            <h3 className={`text-xl font-extrabold mt-0.5 ${
              saldoLiquidoPessoal >= 0 ? 'text-teal-400' : 'text-rose-500'
            }`}>
              R$ {saldoLiquidoPessoal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <span className="text-[10px] text-slate-400 block mt-1 font-bold">
              Comprometimento da Renda: <strong className={comprometimentoRenda > 80 ? 'text-rose-400' : 'text-teal-400'}>{comprometimentoRenda}%</strong>
            </span>
          </div>
          <div className="p-3 bg-teal-500/10 text-teal-400 rounded-2xl border border-teal-500/20">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* 2.5 PAINEL DE GRÁFICOS ANALÍTICOS DO FINANCEIRO (CÍRCULOS E BARRAS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* CARD 1: GRÁFICOS EM CÍRCULOS (DONUT CHARTS) */}
        <div className={`p-6 rounded-3xl border shadow-xl space-y-6 ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="flex items-center justify-between border-b border-slate-800/40 pb-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                Analytics Orçamentário
              </span>
              <h3 className="text-lg font-extrabold flex items-center gap-2 mt-0.5 text-slate-900 dark:text-white">
                <PieChart className="w-5 h-5 text-teal-400" /> Distribuição de Entradas vs Gastos
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-bold">{transacoes.length + 1} lançamentos</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            
            {/* GRÁFICO CIRCULAR 1: COMPROMETIMENTO DA RENDA */}
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col items-center text-center space-y-3">
              <span className="text-xs font-extrabold text-slate-300">Destino do Rendimento Total</span>
              {renderDonutChartFinanceiro(
                [
                  { label: 'Despesas Fixas', value: totalDespesasFixas, color: '#38BDF8' },
                  { label: 'Variáveis & Cartões', value: totalDespesasVariaveis, color: '#F43F5E' },
                  { label: 'Saldo Livre', value: Math.max(0, saldoLiquidoPessoal), color: '#10B981' }
                ],
                totalEntradas || 1,
                `R$ ${totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
                'Entradas Total'
              )}
              <div className="w-full space-y-1.5 text-xs">
                <div className="flex justify-between items-center bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                  <span className="flex items-center gap-1.5 text-sky-400 font-extrabold">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span> Contas Fixas
                  </span>
                  <span className="font-extrabold text-white">R$ {totalDespesasFixas.toLocaleString('pt-BR')} ({pctFixas}%)</span>
                </div>
                <div className="flex justify-between items-center bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                  <span className="flex items-center gap-1.5 text-rose-400 font-extrabold">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Cartões/Variáveis
                  </span>
                  <span className="font-extrabold text-white">R$ {totalDespesasVariaveis.toLocaleString('pt-BR')} ({pctVariaveis}%)</span>
                </div>
                <div className="flex justify-between items-center bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-extrabold">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Saldo Sobrando
                  </span>
                  <span className="font-extrabold text-white">R$ {Math.max(0, saldoLiquidoPessoal).toLocaleString('pt-BR')} ({pctSaldo}%)</span>
                </div>
              </div>
            </div>

            {/* GRÁFICO CIRCULAR 2: PROPORÇÃO DE TIPOS DE CONTAS */}
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col items-center text-center space-y-3">
              <span className="text-xs font-extrabold text-slate-300">Status dos Pagamentos do Mês</span>
              {renderDonutChartFinanceiro(
                [
                  { label: 'Contas Pagas', value: totalPagas, color: '#10B981' },
                  { label: 'Contas Pendentes', value: totalPendentes, color: '#F59E0B' }
                ],
                totalContas || 1,
                `${pctPagas}%`,
                'Liquidado'
              )}
              <div className="w-full space-y-1.5 text-xs">
                <div className="flex justify-between items-center bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-extrabold">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Contas Pagas
                  </span>
                  <span className="font-extrabold text-white">{totalPagas} contas ({pctPagas}%)</span>
                </div>
                <div className="flex justify-between items-center bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                  <span className="flex items-center gap-1.5 text-amber-400 font-extrabold">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Pendentes
                  </span>
                  <span className="font-extrabold text-white">{totalPendentes} contas ({100 - pctPagas}%)</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* CARD 2: GRÁFICOS EM BARRAS (BAR CHARTS POR CATEGORIA DE GASTOS) */}
        <div className={`p-6 rounded-3xl border shadow-xl space-y-6 ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="flex items-center justify-between border-b border-slate-800/40 pb-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                Analytics em Barras
              </span>
              <h3 className="text-lg font-extrabold flex items-center gap-2 mt-0.5 text-slate-900 dark:text-white">
                <BarChart3 className="w-5 h-5 text-rose-400" /> Maiores Gastos por Categoria
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-bold">{categoriasFinanceirasData.length} categorias ativas</span>
          </div>

          {/* GRÁFICO DE BARRAS HORIZONTAIS: GASTOS POR CATEGORIA */}
          <div className="space-y-3">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">Ranking de Despesas (R$)</span>
            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-2 scrollbar-thin scrollbar-custom">
              {categoriasFinanceirasData.map((c) => {
                const barPct = maxCategoriaVal > 0 ? (c.valor / maxCategoriaVal) * 100 : 0;
                return (
                  <div key={c.nome} className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="flex items-center gap-2 text-slate-200">
                        <span className="font-extrabold text-slate-300">{c.nome}</span>
                        <span className="text-[10px] text-slate-400 font-normal">({c.count} conta{c.count > 1 ? 's' : ''})</span>
                      </span>
                      <span className="text-rose-400 font-extrabold">R$ {c.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-700"
                        style={{
                          width: `${Math.max(4, barPct)}%`
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* 3. BARRA DE FILTROS E BUSCA DE CONTAS */}
      <div className={`p-4 rounded-3xl border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
            <Filter className="w-4 h-4 text-teal-400" /> Filtrar Tipo:
          </div>

          <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-2xl border border-slate-800">
            {['Todos', 'Entrada', 'Despesa Fixa', 'Despesa Variável'].map((t) => (
              <button
                key={t}
                onClick={() => setFiltroTipo(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  filtroTipo === t
                    ? t === 'Entrada'
                      ? 'bg-emerald-600 text-white shadow'
                      : t === 'Despesa Fixa'
                      ? 'bg-sky-600 text-white shadow'
                      : t === 'Despesa Variável'
                      ? 'bg-rose-600 text-white shadow'
                      : 'bg-teal-600 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {t === 'Todos' ? 'Todas as Contas' : t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className={`p-2 rounded-xl border text-xs font-bold ${
              darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <option value="Todas">Todas as Categorias</option>
            {CATEGORIAS_PESSOAIS.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar conta (ex: Aluguel, Luz, Cartão...)"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs font-medium ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            />
          </div>
        </div>
      </div>

      {/* 4. TABELA PRINCIPAL DE EXTRATO FINANCEIRO PESSOAL */}
      <div className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        <div className="flex items-center justify-between border-b border-slate-800/40 pb-3">
          <h3 className="font-extrabold text-base flex items-center gap-2 text-teal-400">
            <FileText className="w-5 h-5 text-teal-500" /> Lançamentos de Contas do Lar & Salário ({transacoesFiltradas.length})
          </h3>

          <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            Saldo Exibido: R$ {(
              transacoesFiltradas.filter((t) => t.tipo === 'Entrada').reduce((a, b) => a + b.valor, 0) -
              transacoesFiltradas.filter((t) => t.tipo !== 'Entrada').reduce((a, b) => a + b.valor, 0)
            ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {transacoesFiltradas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-extrabold uppercase whitespace-nowrap">
                  <th className="p-3">Data</th>
                  <th className="p-3">Descrição da Conta / Renda</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Categoria</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Valor (R$)</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 font-medium">
                {transacoesFiltradas.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="p-3 text-slate-400 font-bold whitespace-nowrap">{t.data}</td>
                    <td className="p-3">
                      <p className="font-bold text-white flex items-center gap-2">
                        {t.descricao}
                        {t.parcelas && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono whitespace-nowrap">
                            {t.parcelas}
                          </span>
                        )}
                      </p>
                      {t.observacao && <span className="text-[10px] text-slate-400">{t.observacao}</span>}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border whitespace-nowrap inline-block ${
                        t.tipo === 'Entrada'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : t.tipo === 'Despesa Fixa'
                          ? 'bg-sky-500/20 text-sky-400 border-sky-500/30'
                          : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      }`}>
                        {t.tipo}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300 font-bold">{t.categoria}</td>
                    <td className="p-3">
                      <button
                        onClick={() => handleToggleStatus(t.id)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border cursor-pointer transition-all ${
                          t.status === 'Pago'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30'
                        }`}
                      >
                        {t.status === 'Pago' ? '✓ Pago' : '⏳ Pendente'}
                      </button>
                    </td>
                    <td className={`p-3 font-extrabold text-sm whitespace-nowrap ${
                      t.tipo === 'Entrada' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {t.tipo === 'Entrada' ? '+' : '-'} R$ {t.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleAbrirEditarModal(t)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-teal-400 rounded-xl transition-colors cursor-pointer"
                          title="Editar Conta"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTransacao(t.id)}
                          className="p-1.5 bg-slate-800 hover:bg-rose-900/60 text-rose-400 rounded-xl transition-colors cursor-pointer"
                          title="Excluir Conta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <p className="text-sm font-bold text-slate-300">Nenhum lançamento financeiro encontrado.</p>
            <p>Clique em "+ Lançar Entrada ou Despesa do Lar" para registrar uma nova conta!</p>
          </div>
        )}
      </div>

      {/* MODAL ADICIONAR / EDITAR LANÇAMENTO PESSOAL */}
      {modalAberto && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className={`rounded-3xl p-6 max-w-md w-full shadow-2xl border space-y-4 my-8 ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-800/40 pb-3">
              <h3 className="text-lg font-extrabold flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-teal-500" />
                {transacaoEditando ? 'Editar Lançamento Pessoal' : 'Lançar Nova Entrada / Despesa do Lar'}
              </h3>
              <button onClick={() => setModalAberto(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              <div>
                <label className="block font-bold text-slate-400 mb-1">Tipo de Lançamento</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Entrada', 'Despesa Fixa', 'Despesa Variável'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTipo(t)}
                      className={`p-2 rounded-xl text-[11px] font-extrabold border transition-all cursor-pointer ${
                        tipo === t
                          ? t === 'Entrada'
                            ? 'bg-emerald-600 text-white border-emerald-400'
                            : t === 'Despesa Fixa'
                            ? 'bg-sky-600 text-white border-sky-400'
                            : 'bg-rose-600 text-white border-rose-400'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-400 mb-1">Descrição da Conta / Renda</label>
                <input
                  type="text"
                  placeholder="Ex: Aluguel Residencial, Salário, Cartão Nubank..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  required
                  className={`w-full p-2.5 rounded-xl border font-bold ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={valor}
                    onChange={(e) => setValor(Number(e.target.value))}
                    required
                    className={`w-full p-2.5 rounded-xl border font-extrabold text-sm ${
                      tipo === 'Entrada' ? 'text-emerald-400' : 'text-rose-400'
                    } ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-400 mb-1">Data</label>
                  <input
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    required
                    className={`w-full p-2.5 rounded-xl border ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 mb-1">Categoria Pessoal</label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border font-bold ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    {CATEGORIAS_PESSOAIS.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-400 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className={`w-full p-2.5 rounded-xl border font-bold ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <option value="Pago">Pago</option>
                    <option value="Pendente">Pendente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-400 mb-1">Parcelas / Observação (Opcional)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Ex: 6x, 12x"
                    value={parcelas}
                    onChange={(e) => setParcelas(e.target.value)}
                    className={`p-2.5 rounded-xl border ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                  <input
                    type="text"
                    placeholder="Ex: Vencimento dia 10"
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    className={`p-2.5 rounded-xl border ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-800/40">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-extrabold rounded-xl shadow-lg shadow-teal-600/30 cursor-pointer"
                >
                  {transacaoEditando ? 'Salvar Alterações' : 'Confirmar e Lançar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </>
      )}

      {modalOCRAberto && (
        <LeitorComprovanteOCR
          darkMode={darkMode}
          onFechar={() => setModalOCRAberto(false)}
          onAdicionarTransacao={(novaTransacao) => {
            const item: TransacaoPessoal = {
              ...novaTransacao,
              id: `fin-${Date.now()}`
            };
            updateTransacoesECloud([item, ...transacoes]);
          }}
        />
      )}

      {modalVozAberto && (
        <ComandoVozModal
          darkMode={darkMode}
          onFechar={() => setModalVozAberto(false)}
          onAdicionarTransacao={(novaTransacao) => {
            const item: TransacaoPessoal = {
              ...novaTransacao,
              id: `fin-${Date.now()}`
            };
            updateTransacoesECloud([item, ...transacoes]);
          }}
        />
      )}
    </div>
  );
};

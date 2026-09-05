import React, { useState, useEffect } from 'react';
import type { ItemProducaoTomo } from '../types';
import { pushToCloud, pullFromCloud, subscribeLocalBroadcast, getUserKeys, getItemJSON } from '../services/cloudSync';
import { WhatsappNotificacoes } from './WhatsappNotificacoes';
import {
  BarChart3,
  Plus,
  Edit2,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  Trash2,
  X,
  Sparkles,
  UserCheck,
  User,
  Users,
  AlertTriangle,
  RefreshCw,
  PieChart,
  MessageSquare
} from 'lucide-react';

interface ProducaoProps {
  darkMode?: boolean;
  usuarioId?: string;
}

const CLINICAS_FERNANDO = ['Ariquemes', 'Machadinho', 'Cacoal', 'Porto Velho'] as const;
const CLINICAS_BERNARDO = ['Rolim de Moura', 'Ouro Preto', 'Ji-Paraná'] as const;

export const Producao: React.FC<ProducaoProps> = ({ darkMode, usuarioId }) => {
  const userKeys = getUserKeys(usuarioId);
  const STORAGE_KEY = userKeys.PRODUCAO;

  // Inicializa a lista de registros. Se houver dados salvos no localStorage, utiliza-os.
  const [itens, setItens] = useState<ItemProducaoTomo[]>(() => {
    return getItemJSON<ItemProducaoTomo[]>(STORAGE_KEY, []);
  });

  const [sincronizando, setSincronizando] = useState<boolean>(false);
  const [subAba, setSubAba] = useState<'producao' | 'whatsapp'>('producao');

  // Salvamento automático permanente em localStorage local
  useEffect(() => {
    if (Array.isArray(itens) && itens.length > 0) {
      const str = JSON.stringify(itens);
      localStorage.setItem(STORAGE_KEY, str);
      localStorage.setItem('odonto_producao_backup_permanent', str);
      localStorage.setItem('odonto_producao_registros_usr_admin_master', str);
      localStorage.setItem('odonto_producao_registros_v2', str);
    }
  }, [itens, STORAGE_KEY]);

  // Função central para salvar localmente e enviar à nuvem sem sobregravar na carga inicial
  const updateItensECloud = (novosItens: ItemProducaoTomo[]) => {
    setItens(novosItens);
    const str = JSON.stringify(novosItens);
    localStorage.setItem(STORAGE_KEY, str);
    localStorage.setItem('odonto_producao_backup_permanent', str);
    localStorage.setItem('odonto_producao_registros_usr_admin_master', str);
    localStorage.setItem('odonto_producao_registros_v2', str);
    localStorage.setItem('odonto_producao_registros', str);
    pushToCloud({ producao: novosItens }, usuarioId);
  };

  // Carregamento Prioritário ao abrir e Polling em tempo real
  useEffect(() => {
    setSincronizando(true);
    pullFromCloud((payload) => {
      if (Array.isArray(payload.producao) && payload.producao.length > 0) {
        setItens(payload.producao);
      }
      setSincronizando(false);
    }, true, usuarioId);

    const unsubscribeBroadcast = subscribeLocalBroadcast((payload) => {
      if (Array.isArray(payload.producao) && payload.producao.length > 0) {
        setItens(payload.producao);
      }
    }, usuarioId);

    const interval = setInterval(() => {
      pullFromCloud((payload) => {
        if (Array.isArray(payload.producao) && payload.producao.length > 0) {
          setItens(payload.producao);
        }
      }, false, usuarioId);
    }, 2000);

    const handleFocus = () => {
      pullFromCloud((payload) => {
        if (Array.isArray(payload.producao) && payload.producao.length > 0) {
          setItens(payload.producao);
        }
      }, true, usuarioId);
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      unsubscribeBroadcast();
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [usuarioId]);

  const [proprietarioFiltro, setProprietarioFiltro] = useState<'Todos' | 'Fernando' | 'Bernardo'>('Todos');
  const [unidadeFiltro, setUnidadeFiltro] = useState<string>('Todas');
  const [regiaoFiltro, setRegiaoFiltro] = useState<string>('Todas');
  const [busca, setBusca] = useState<string>('');

  // Modal Novo / Editar Registro
  const [modalAberto, setModalAberto] = useState<boolean>(false);
  const [modalZerarAberto, setModalZerarAberto] = useState<boolean>(false);
  const [itemEditando, setItemEditando] = useState<ItemProducaoTomo | null>(null);

  const [novoProprietario, setNovoProprietario] = useState<'Fernando' | 'Bernardo'>('Fernando');
  const [novoId, setNovoId] = useState<string>(`${Math.floor(10000 + Math.random() * 90000)}`);
  const [novaData, setNovaData] = useState<string>(new Date().toISOString().split('T')[0]);
  const [novoNome, setNovoNome] = useState<string>('');
  const [novaRegiao, setNovaRegiao] = useState<'TRAÇADO' | 'UM DENTE' | 'MAX OU MAND' | 'MAX E MAND'>('MAX OU MAND');
  const [novoValor, setNovoValor] = useState<number>(15);
  const [novaUnidade, setNovaUnidade] = useState<typeof CLINICAS_FERNANDO[number] | typeof CLINICAS_BERNARDO[number]>('Ariquemes');

  // Abrir Modal para Novo Registro
  const handleAbrirNovoModal = () => {
    setItemEditando(null);
    setNovoId(`${Math.floor(10000 + Math.random() * 90000)}`);
    setNovaData(new Date().toISOString().split('T')[0]);
    setNovoNome('');
    setNovaRegiao('MAX OU MAND');
    setNovoValor(15);
    setNovoProprietario('Fernando');
    setNovaUnidade(CLINICAS_FERNANDO[0]);
    setModalAberto(true);
  };

  // Abrir Modal para Editar Registro Existente
  const handleAbrirEditarModal = (item: ItemProducaoTomo) => {
    setItemEditando(item);
    setNovoId(item.id);
    setNovoProprietario(item.proprietario);
    setNovaData(item.data);
    setNovoNome(item.pacienteNome);
    setNovaRegiao(item.regiao);
    setNovoValor(item.valor);
    setNovaUnidade(item.unidade);
    setModalAberto(true);
  };

  // Ao trocar o proprietário no modal, atualizar a lista de clínicas disponíveis
  const handleProprietarioChangeModal = (p: 'Fernando' | 'Bernardo') => {
    setNovoProprietario(p);
    if (p === 'Fernando') {
      setNovaUnidade(CLINICAS_FERNANDO[0]);
    } else {
      setNovaUnidade(CLINICAS_BERNARDO[0]);
    }
  };

  // Atualização automática do valor ao mudar de região tomográfica
  const handleRegiaoChange = (r: 'TRAÇADO' | 'UM DENTE' | 'MAX OU MAND' | 'MAX E MAND') => {
    setNovaRegiao(r);
    if (r === 'TRAÇADO') setNovoValor(4);
    else if (r === 'UM DENTE') setNovoValor(10);
    else if (r === 'MAX OU MAND') setNovoValor(15);
    else if (r === 'MAX E MAND') setNovoValor(20);
  };

  const handleSalvarProducao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome) return;

    const itemProcessado: ItemProducaoTomo = {
      id: novoId || `${Date.now()}`,
      data: novaData,
      pacienteNome: novoNome.toUpperCase(),
      regiao: novaRegiao,
      valor: novoValor,
      unidade: novaUnidade as any,
      proprietario: novoProprietario
    };

    let listaAtualizada: ItemProducaoTomo[];
    if (itemEditando) {
      listaAtualizada = itens.map((i) => (i.id === itemEditando.id ? itemProcessado : i));
    } else {
      listaAtualizada = [itemProcessado, ...itens];
    }

    updateItensECloud(listaAtualizada);
    setModalAberto(false);
    setItemEditando(null);
    setNovoNome('');
    setNovoId(`${Math.floor(10000 + Math.random() * 90000)}`);
  };

  // Exclusão individual salva permanentemente
  const handleDeleteItem = (id: string) => {
    const restantes = itens.filter((item) => item.id !== id);
    updateItensECloud(restantes);
  };

  // Limpa todos os registros permanentemente
  const handleZerarTodosRegistros = () => {
    updateItensECloud([]);
    setModalZerarAberto(false);
  };

  // Filtros aplicados
  const itensFiltrados = itens.filter((i) => {
    const atendeProprietario = proprietarioFiltro === 'Todos' || i.proprietario === proprietarioFiltro;
    const atendeUnidade = unidadeFiltro === 'Todas' || i.unidade === unidadeFiltro;
    const atendeRegiao = regiaoFiltro === 'Todas' || i.regiao === regiaoFiltro;
    const atendeBusca = i.pacienteNome.toLowerCase().includes(busca.toLowerCase()) || i.id.includes(busca);
    return atendeProprietario && atendeUnidade && atendeRegiao && atendeBusca;
  });

  // Estatísticas Separadas por Proprietário (Fernando vs Bernardo)
  const itensFernando = itens.filter((i) => i.proprietario === 'Fernando');
  const itensBernardo = itens.filter((i) => i.proprietario === 'Bernardo');

  const totalFernandoR$ = itensFernando.reduce((acc, i) => acc + i.valor, 0);
  const totalBernardoR$ = itensBernardo.reduce((acc, i) => acc + i.valor, 0);
  const valorTotalGeral = itens.reduce((acc, i) => acc + i.valor, 0);

  // Detalhamento de Clínicas de Fernando
  const totalAriquemes = itensFernando.filter((i) => i.unidade === 'Ariquemes').reduce((acc, i) => acc + i.valor, 0);
  const totalPortoVelho = itensFernando.filter((i) => i.unidade === 'Porto Velho').reduce((acc, i) => acc + i.valor, 0);
  const totalMachadinho = itensFernando.filter((i) => i.unidade === 'Machadinho').reduce((acc, i) => acc + i.valor, 0);
  const totalCacoal = itensFernando.filter((i) => i.unidade === 'Cacoal').reduce((acc, i) => acc + i.valor, 0);

  // Detalhamento de Clínicas de Bernardo
  const totalRolim = itensBernardo.filter((i) => i.unidade === 'Rolim de Moura').reduce((acc, i) => acc + i.valor, 0);
  const totalOuroPreto = itensBernardo.filter((i) => i.unidade === 'Ouro Preto').reduce((acc, i) => acc + i.valor, 0);
  const totalJipa = itensBernardo.filter((i) => i.unidade === 'Ji-Paraná').reduce((acc, i) => acc + i.valor, 0);

  // Contagem por Região Tomográfica
  const countTracado = itensFiltrados.filter((i) => i.regiao === 'TRAÇADO').length;
  const countUmDente = itensFiltrados.filter((i) => i.regiao === 'UM DENTE').length;
  const countMaxOuMand = itensFiltrados.filter((i) => i.regiao === 'MAX OU MAND').length;
  const countMaxEMand = itensFiltrados.filter((i) => i.regiao === 'MAX E MAND').length;

  // Clínicas disponíveis conforme filtro de proprietário selecionado na barra principal
  const clinicasFiltroOpcoes = proprietarioFiltro === 'Fernando'
    ? ['Todas', ...CLINICAS_FERNANDO]
    : proprietarioFiltro === 'Bernardo'
    ? ['Todas', ...CLINICAS_BERNARDO]
    : ['Todas', ...CLINICAS_FERNANDO, ...CLINICAS_BERNARDO];

  // Percentuais por Proprietário para Gráficos
  const pctFernando = valorTotalGeral > 0 ? Math.round((totalFernandoR$ / valorTotalGeral) * 100) : 0;
  const pctBernardo = valorTotalGeral > 0 ? Math.round((totalBernardoR$ / valorTotalGeral) * 100) : 0;

  // Contagem Geral e Percentuais para Gráfico por Região Tomográfica
  const totalExamesFiltrados = itensFiltrados.length || 1;
  const pctTracado = Math.round((countTracado / totalExamesFiltrados) * 100);
  const pctUmDente = Math.round((countUmDente / totalExamesFiltrados) * 100);
  const pctMaxOuMand = Math.round((countMaxOuMand / totalExamesFiltrados) * 100);
  const pctMaxEMand = Math.round((countMaxEMand / totalExamesFiltrados) * 100);

  // Dados para Gráfico de Barras por Clínica
  const clinicasData = [
    { nome: 'Ariquemes', valor: totalAriquemes, count: itensFernando.filter((i) => i.unidade === 'Ariquemes').length, cor: '#0EA5E9', owner: 'Fernando' },
    { nome: 'Porto Velho', valor: totalPortoVelho, count: itensFernando.filter((i) => i.unidade === 'Porto Velho').length, cor: '#0EA5E9', owner: 'Fernando' },
    { nome: 'Machadinho', valor: totalMachadinho, count: itensFernando.filter((i) => i.unidade === 'Machadinho').length, cor: '#0EA5E9', owner: 'Fernando' },
    { nome: 'Cacoal', valor: totalCacoal, count: itensFernando.filter((i) => i.unidade === 'Cacoal').length, cor: '#0EA5E9', owner: 'Fernando' },
    { nome: 'Rolim de Moura', valor: totalRolim, count: itensBernardo.filter((i) => i.unidade === 'Rolim de Moura').length, cor: '#6366F1', owner: 'Bernardo' },
    { nome: 'Ouro Preto', valor: totalOuroPreto, count: itensBernardo.filter((i) => i.unidade === 'Ouro Preto').length, cor: '#6366F1', owner: 'Bernardo' },
    { nome: 'Ji-Paraná', valor: totalJipa, count: itensBernardo.filter((i) => i.unidade === 'Ji-Paraná').length, cor: '#6366F1', owner: 'Bernardo' },
  ].sort((a, b) => b.valor - a.valor);

  const maxClinicaVal = Math.max(1, ...clinicasData.map((c) => c.valor));

  // Helper de Renderização de Gráfico em Círculo (Donut SVG)
  const renderDonutChart = (
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
                  <title>{`${slice.label}: ${slice.value} (${total > 0 ? Math.round((slice.value / total) * 100) : 0}%)`}</title>
                </circle>
              );
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-2">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">{centerSub}</span>
          <span className="text-sm font-black text-slate-900 dark:text-white leading-tight">{centerTitle}</span>
        </div>
      </div>
    );
  };

  const handleManualSync = async () => {
    setSincronizando(true);
    await pullFromCloud((payload) => {
      if (payload.producao) setItens(payload.producao);
    }, true);
    setSincronizando(false);
  };

  return (
    <div className="space-y-6">

      {/* SELETOR DE NAVEGAÇÃO DE PRODUÇÃO & AUTOMAÇÃO WHATSAPP POR CLÍNICA */}
      <div className="bg-slate-950 p-1.5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 shadow-inner">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSubAba('producao')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              subAba === 'producao'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-teal-300" /> Tabela de Lançamentos da Produção
          </button>

          <button
            onClick={() => setSubAba('whatsapp')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              subAba === 'whatsapp'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" /> Desempenho Financeiro por Clínica & Notificação WhatsApp (18:30h)
          </button>
        </div>

        <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20 hidden lg:flex items-center gap-1.5">
          📱 Disparo Agendado (69) 993649158 às 18:30h
        </span>
      </div>

      {subAba === 'whatsapp' ? (
        <WhatsappNotificacoes itensProducao={itens} darkMode={darkMode} />
      ) : (
        <>
      <div className={`p-4 sm:p-6 rounded-3xl border shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-md border border-teal-500/20 flex items-center gap-1 w-fit">
            <FileSpreadsheet className="w-3.5 h-3.5" /> Módulo de Gestão de Produção (Fernando & Bernardo - Sincronizado)
          </span>
          <h2 className="text-xl font-bold flex items-center gap-2 mt-1">
            <BarChart3 className="w-6 h-6 text-teal-500" /> Controle de Produção
          </h2>
          <p className="text-xs text-slate-400 font-normal">
            Acompanhamento unificado e separado por proprietário (Fernando e Bernardo) com persistência de dados.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={handleManualSync}
            disabled={sincronizando}
            className="bg-slate-800 hover:bg-slate-700 text-teal-400 font-semibold px-3.5 py-2.5 rounded-2xl text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-all cursor-pointer shadow w-full sm:w-auto"
            title="Sincronizar dados em tempo real com a nuvem"
          >
            <RefreshCw className={`w-4 h-4 ${sincronizando ? 'animate-spin' : ''}`} />
            <span>{sincronizando ? 'Sincronizando...' : 'Atualizar Nuvem'}</span>
          </button>

          {itens.length > 0 && (
            <button
              type="button"
              onClick={() => setModalZerarAberto(true)}
              className="bg-rose-950/60 hover:bg-rose-900 text-rose-300 font-semibold px-3.5 py-2.5 rounded-2xl text-xs flex items-center justify-center gap-1.5 border border-rose-800 transition-all cursor-pointer shadow w-full sm:w-auto"
            >
              <Trash2 className="w-4 h-4 text-rose-400" /> Excluir Todos os Registros
            </button>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3.5 py-2.5 rounded-2xl text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-all cursor-pointer shadow w-full sm:w-auto"
          >
            <Download className="w-4 h-4 text-teal-400" /> Exportar Relatório (PDF)
          </button>

          <button
            type="button"
            onClick={handleAbrirNovoModal}
            className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold px-5 py-2.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-teal-600/25 transition-all cursor-pointer w-full sm:w-auto"
          >
            <Plus className="w-4.5 h-4.5" /> + Registrar Exame de Tomografia
          </button>
        </div>
      </div>

      {/* 2. FATURAMENTO DE PRODUÇÃO SEPARADO (FERNANDO vs BERNARDO) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CARD FATURAMENTO FERNANDO */}
        <div className={`p-6 rounded-3xl border shadow-xl space-y-4 relative overflow-hidden ${
          darkMode ? 'bg-slate-900 border-sky-900/50 text-white' : 'bg-white border-sky-200 text-slate-800'
        }`}>
          <div className="flex items-center justify-between border-b border-sky-900/40 pb-3">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                Proprietário
              </span>
              <h3 className="text-lg font-bold flex items-center gap-2 mt-0.5 text-sky-400">
                <UserCheck className="w-5 h-5 text-sky-500" /> FERNANDO
              </h3>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold block">Faturamento Produção:</span>
              <span className="text-xl font-extrabold text-sky-400">R$ {totalFernandoR$.toLocaleString('pt-BR')}</span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Clínicas sob Gestão:</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="font-bold text-slate-300">Ariquemes</span>
                <span className="font-extrabold text-sky-400">R$ {totalAriquemes}</span>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="font-bold text-slate-300">Porto Velho</span>
                <span className="font-extrabold text-sky-400">R$ {totalPortoVelho}</span>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="font-bold text-slate-300">Machadinho</span>
                <span className="font-extrabold text-sky-400">R$ {totalMachadinho}</span>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="font-bold text-slate-300">Cacoal</span>
                <span className="font-extrabold text-sky-400">R$ {totalCacoal}</span>
              </div>
            </div>
          </div>
          
          <div className="text-[11px] text-slate-400 pt-1 flex justify-between font-semibold border-t border-slate-800/40">
            <span>Total de Exames:</span>
            <span className="font-bold text-white">{itensFernando.length} tomografias</span>
          </div>
        </div>

        {/* CARD FATURAMENTO BERNARDO */}
        <div className={`p-6 rounded-3xl border shadow-xl space-y-4 relative overflow-hidden ${
          darkMode ? 'bg-slate-900 border-indigo-900/50 text-white' : 'bg-white border-indigo-200 text-slate-800'
        }`}>
          <div className="flex items-center justify-between border-b border-indigo-900/40 pb-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                Proprietário
              </span>
              <h3 className="text-lg font-extrabold flex items-center gap-2 mt-0.5 text-indigo-400">
                <UserCheck className="w-5 h-5 text-indigo-500" /> BERNARDO
              </h3>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold block">Faturamento Produção:</span>
              <span className="text-xl font-extrabold text-indigo-400">R$ {totalBernardoR$.toLocaleString('pt-BR')}</span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Clínicas sob Gestão:</span>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="font-bold text-slate-300">Rolim de Moura</span>
                <span className="font-extrabold text-indigo-400">R$ {totalRolim}</span>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="font-bold text-slate-300">Ouro Preto</span>
                <span className="font-extrabold text-indigo-400">R$ {totalOuroPreto}</span>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="font-bold text-slate-300">Ji-Paraná</span>
                <span className="font-extrabold text-indigo-400">R$ {totalJipa}</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 pt-1 flex justify-between font-semibold border-t border-slate-800/40">
            <span>Total de Exames:</span>
            <span className="font-bold text-white">{itensBernardo.length} exames / traçados</span>
          </div>
        </div>

        {/* CARD FATURAMENTO UNIFICADO GERAL */}
        <div className={`p-6 rounded-3xl border shadow-xl space-y-4 flex flex-col justify-between ${
          darkMode ? 'bg-slate-900 border-teal-900/50 text-white' : 'bg-white border-teal-200 text-slate-800'
        }`}>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
              Produção Consolidada
            </span>
            <h3 className="text-lg font-extrabold flex items-center gap-2 mt-1 text-teal-400">
              <Users className="w-5 h-5 text-teal-500" /> Faturamento Geral Consolidado
            </h3>
            
            <div className="mt-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Faturamento Total Unificado:</span>
              <h2 className="text-3xl font-extrabold text-emerald-400">R$ {valorTotalGeral.toLocaleString('pt-BR')}</h2>
              <span className="text-xs text-teal-400 font-bold block pt-1">
                {itens.length} exames tomográficos e traçados no total
              </span>
            </div>
          </div>

          <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800/60 text-xs space-y-1">
            <div className="flex justify-between font-semibold">
              <span className="text-sky-400">Participação Fernando:</span>
              <span className="font-bold">R$ {totalFernandoR$} ({valorTotalGeral > 0 ? Math.round((totalFernandoR$ / valorTotalGeral) * 100) : 0}%)</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-indigo-400">Participação Bernardo:</span>
              <span className="font-bold">R$ {totalBernardoR$} ({valorTotalGeral > 0 ? Math.round((totalBernardoR$ / valorTotalGeral) * 100) : 0}%)</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. RESUMO POR REGIÃO TOMOGRÁFICA (INCLUINDO TRAÇADO R$ 4,00) */}
      <div className={`p-5 rounded-3xl border shadow-xl space-y-3 ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-teal-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-teal-500" /> Tabela de Preços e Produção por Região Tomográfica
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* TRAÇADO */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
            <div>
              <span className="text-xs font-extrabold text-amber-300 block">TRAÇADO</span>
              <span className="text-[10px] text-slate-400">Preço Fixo: R$ 4,00</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-extrabold text-amber-400">{countTracado} exames</span>
              <span className="text-xs font-bold text-slate-400 block">R$ {(countTracado * 4).toLocaleString('pt-BR')}</span>
            </div>
          </div>

          {/* UM DENTE */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
            <div>
              <span className="text-xs font-extrabold text-teal-300 block">UM DENTE</span>
              <span className="text-[10px] text-slate-400">Preço Fixo: R$ 10,00</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-extrabold text-teal-400">{countUmDente} exames</span>
              <span className="text-xs font-bold text-slate-400 block">R$ {(countUmDente * 10).toLocaleString('pt-BR')}</span>
            </div>
          </div>

          {/* MAX OU MAND */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
            <div>
              <span className="text-xs font-extrabold text-sky-300 block">MAX OU MAND</span>
              <span className="text-[10px] text-slate-400">Preço Fixo: R$ 15,00</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-extrabold text-sky-400">{countMaxOuMand} exames</span>
              <span className="text-xs font-bold text-slate-400 block">R$ {(countMaxOuMand * 15).toLocaleString('pt-BR')}</span>
            </div>
          </div>

          {/* MAX E MAND */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex justify-between items-center">
            <div>
              <span className="text-xs font-extrabold text-emerald-300 block">MAX E MAND</span>
              <span className="text-[10px] text-slate-400">Preço Fixo: R$ 20,00</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-extrabold text-emerald-400">{countMaxEMand} exames</span>
              <span className="text-xs font-bold text-slate-400 block">R$ {(countMaxEMand * 20).toLocaleString('pt-BR')}</span>
            </div>
          </div>

        </div>
      </div>

      {/* 3.5 PAINEL DE GRÁFICOS ANALÍTICOS (GRÁFICOS EM CÍRCULOS E BARRAS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* CARD 1: GRÁFICOS EM CÍRCULOS (DONUT CHARTS) */}
        <div className={`p-6 rounded-3xl border shadow-xl space-y-6 ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="flex items-center justify-between border-b border-slate-800/40 pb-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                Analytics Circular
              </span>
              <h3 className="text-lg font-extrabold flex items-center gap-2 mt-0.5 text-slate-900 dark:text-white">
                <PieChart className="w-5 h-5 text-teal-400" /> Distribuição Financeira & Exames
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-bold">{itens.length} exames salvos</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            
            {/* GRÁFICO CIRCULAR 1: FERNANDO vs BERNARDO */}
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col items-center text-center space-y-3">
              <span className="text-xs font-extrabold text-slate-300">Faturamento por Proprietário</span>
              {renderDonutChart(
                [
                  { label: 'Fernando', value: totalFernandoR$, color: '#0EA5E9' },
                  { label: 'Bernardo', value: totalBernardoR$, color: '#6366F1' }
                ],
                valorTotalGeral || 1,
                `R$ ${valorTotalGeral.toLocaleString('pt-BR')}`,
                'Total Geral'
              )}
              <div className="w-full space-y-1.5 text-xs">
                <div className="flex justify-between items-center bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                  <span className="flex items-center gap-1.5 text-sky-400 font-extrabold">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span> Fernando
                  </span>
                  <span className="font-extrabold text-white">R$ {totalFernandoR$.toLocaleString('pt-BR')} ({pctFernando}%)</span>
                </div>
                <div className="flex justify-between items-center bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                  <span className="flex items-center gap-1.5 text-indigo-400 font-extrabold">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Bernardo
                  </span>
                  <span className="font-extrabold text-white">R$ {totalBernardoR$.toLocaleString('pt-BR')} ({pctBernardo}%)</span>
                </div>
              </div>
            </div>

            {/* GRÁFICO CIRCULAR 2: POR REGIÃO TOMOGRÁFICA */}
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex flex-col items-center text-center space-y-3">
              <span className="text-xs font-extrabold text-slate-300">Exames por Região Tomográfica</span>
              {renderDonutChart(
                [
                  { label: 'MAX OU MAND', value: countMaxOuMand, color: '#0EA5E9' },
                  { label: 'MAX E MAND', value: countMaxEMand, color: '#10B981' },
                  { label: 'UM DENTE', value: countUmDente, color: '#F59E0B' },
                  { label: 'TRAÇADO', value: countTracado, color: '#EC4899' }
                ],
                itensFiltrados.length || 1,
                `${itensFiltrados.length}`,
                'Total Exames'
              )}
              <div className="w-full grid grid-cols-2 gap-1 text-[11px]">
                <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800 text-left">
                  <span className="flex items-center gap-1 text-sky-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-sky-500"></span> MAX/MAND
                  </span>
                  <span className="font-extrabold text-white block">{countMaxOuMand} ({pctMaxOuMand}%)</span>
                </div>
                <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800 text-left">
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> MAX E MAND
                  </span>
                  <span className="font-extrabold text-white block">{countMaxEMand} ({pctMaxEMand}%)</span>
                </div>
                <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800 text-left">
                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span> UM DENTE
                  </span>
                  <span className="font-extrabold text-white block">{countUmDente} ({pctUmDente}%)</span>
                </div>
                <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800 text-left">
                  <span className="flex items-center gap-1 text-pink-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-pink-500"></span> TRAÇADO
                  </span>
                  <span className="font-extrabold text-white block">{countTracado} ({pctTracado}%)</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* CARD 2: GRÁFICOS EM BARRAS (BAR CHARTS) */}
        <div className={`p-6 rounded-3xl border shadow-xl space-y-6 ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="flex items-center justify-between border-b border-slate-800/40 pb-3">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Analytics em Barras
              </span>
              <h3 className="text-lg font-extrabold flex items-center gap-2 mt-0.5 text-slate-900 dark:text-white">
                <BarChart3 className="w-5 h-5 text-emerald-400" /> Desempenho Financeiro por Clínica
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-bold">7 Unidades</span>
          </div>

          {/* GRÁFICO DE BARRAS HORIZONTAIS: PRODUÇÃO FINANCEIRA POR CLÍNICA */}
          <div className="space-y-3">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">Faturamento (R$) por Unidade</span>
            <div className="space-y-2.5">
              {clinicasData.map((c) => {
                const barPct = maxClinicaVal > 0 ? (c.valor / maxClinicaVal) * 100 : 0;
                return (
                  <div key={c.nome} className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="flex items-center gap-2 text-slate-200">
                        <span className="font-extrabold">{c.nome}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold ${
                          c.owner === 'Fernando' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                        }`}>
                          {c.owner}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">({c.count} exames)</span>
                      </span>
                      <span className="text-emerald-400 font-extrabold">R$ {c.valor.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.max(3, barPct)}%`,
                          backgroundColor: c.cor
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

      {/* 4. BARRA DE FILTROS (PROPRIETÁRIO, UNIDADE, REGIÃO, BUSCA) */}
      <div className={`p-4 rounded-3xl border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Seletor de Proprietário */}
          <div className="flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-2xl border border-slate-800">
            {(['Todos', 'Fernando', 'Bernardo'] as const).map((p) => (
              <button
                key={p}
                onClick={() => {
                  setProprietarioFiltro(p);
                  setUnidadeFiltro('Todas');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  proprietarioFiltro === p
                    ? p === 'Fernando'
                      ? 'bg-sky-600 text-white shadow'
                      : p === 'Bernardo'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-teal-600 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {p === 'Todos' ? 'Todos os Sócios' : p}
              </button>
            ))}
          </div>

          {/* Seletor de Clínica */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
            <Filter className="w-4 h-4 text-teal-400" /> Clínica:
          </div>

          <select
            value={unidadeFiltro}
            onChange={(e) => setUnidadeFiltro(e.target.value)}
            className={`p-2 rounded-xl border text-xs font-bold ${
              darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            {clinicasFiltroOpcoes.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>

        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={regiaoFiltro}
            onChange={(e) => setRegiaoFiltro(e.target.value)}
            className={`p-2 rounded-xl border text-xs font-bold ${
              darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <option value="Todas">Todas as Regiões</option>
            <option value="TRAÇADO">TRAÇADO (R$ 4)</option>
            <option value="UM DENTE">UM DENTE (R$ 10)</option>
            <option value="MAX OU MAND">MAX OU MAND (R$ 15)</option>
            <option value="MAX E MAND">MAX E MAND (R$ 20)</option>
          </select>

          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por ID ou Nome do Paciente..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs font-medium ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            />
          </div>
        </div>
      </div>

      {/* 5. TABELA PRINCIPAL DE REGISTROS DE PRODUÇÃO */}
      <div className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        <div className="flex items-center justify-between border-b border-slate-800/40 pb-3">
          <h3 className="font-extrabold text-base flex items-center gap-2 text-teal-400">
            <FileSpreadsheet className="w-5 h-5 text-teal-500" /> Registros de Tomografias & Traçados ({itensFiltrados.length})
          </h3>

          <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Total Exibido: R$ {itensFiltrados.reduce((acc, i) => acc + i.valor, 0).toLocaleString('pt-BR')}
          </span>
        </div>

        {itensFiltrados.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-extrabold uppercase">
                  <th className="p-3">Proprietário</th>
                  <th className="p-3">ID Exame</th>
                  <th className="p-3">Data</th>
                  <th className="p-3">Paciente</th>
                  <th className="p-3">Clínica / Unidade</th>
                  <th className="p-3">Região Tomográfica</th>
                  <th className="p-3">Valor (R$)</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 font-medium">
                {itensFiltrados.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold border ${
                        item.proprietario === 'Fernando'
                          ? 'bg-sky-500/20 text-sky-400 border-sky-500/30'
                          : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                      }`}>
                        {item.proprietario}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="bg-slate-800 text-slate-300 font-mono font-extrabold px-2 py-0.5 rounded border border-slate-700">
                        #{item.id}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400 font-bold">{item.data}</td>
                    <td className="p-3 font-bold text-white uppercase">{item.pacienteNome}</td>
                    <td className="p-3 font-bold text-slate-200">{item.unidade}</td>
                    <td className="p-3 font-bold">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        item.regiao === 'TRAÇADO'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'text-teal-300'
                      }`}>
                        {item.regiao}
                      </span>
                    </td>
                    <td className="p-3 font-extrabold text-emerald-400 whitespace-nowrap">R$ {item.valor.toFixed(2)}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleAbrirEditarModal(item)}
                          className="p-1.5 bg-slate-800 hover:bg-teal-900/60 text-teal-400 rounded-xl transition-colors cursor-pointer border border-slate-700"
                          title="Editar Registro de Tomografia"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 bg-slate-800 hover:bg-rose-900/60 text-rose-400 rounded-xl transition-colors cursor-pointer border border-slate-700"
                          title="Excluir Registro Permanentemente"
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
          <div className="p-12 text-center text-xs text-slate-400 space-y-3">
            <p className="text-sm font-bold text-slate-300">Nenhum registro de tomografia encontrado.</p>
            <p>Clique em "+ Registrar Exame de Tomografia" para adicionar um novo exame a Fernando ou Bernardo!</p>
          </div>
        )}
      </div>

      {/* MODAL CONFIRMAÇÃO EXCLUIR TODOS OS REGISTROS */}
      {modalZerarAberto && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className={`rounded-3xl p-6 max-w-md w-full shadow-2xl border space-y-4 ${
            darkMode ? 'bg-slate-900 border-rose-900/60 text-white' : 'bg-white border-rose-200 text-slate-800'
          }`}>
            <div className="flex items-center gap-3 text-rose-500">
              <AlertTriangle className="w-8 h-8 shrink-0" />
              <h3 className="text-lg font-extrabold">Excluir Todos os Registros de Produção?</h3>
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed">
              Esta ação excluirá permanentemente todos os registros de tomografias e traçados de Fernando e Bernardo e salvará a tabela limpa ("sem informação nenhuma").
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setModalZerarAberto(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold cursor-pointer text-xs"
              >
                Cancelar
              </button>

              <button
                onClick={handleZerarTodosRegistros}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl shadow-lg shadow-rose-600/30 cursor-pointer text-xs"
              >
                Sim, Excluir Tudo Permanetemente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR EXAME DE TOMOGRAFIA */}
      {modalAberto && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className={`rounded-3xl p-6 max-w-md w-full shadow-2xl border space-y-4 my-8 ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-800/40 pb-3">
              <h3 className="text-lg font-extrabold flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-teal-500" /> {itemEditando ? `Editar Registro #${itemEditando.id}` : 'Registrar Exame de Tomografia'}
              </h3>
              <button onClick={() => setModalAberto(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarProducao} className="space-y-4 text-xs">
              
              {/* Seleção do Proprietário */}
              <div>
                <label className="block font-bold text-slate-400 mb-1">Proprietário / Sócio</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleProprietarioChangeModal('Fernando')}
                    className={`p-2.5 rounded-xl font-extrabold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      novoProprietario === 'Fernando'
                        ? 'bg-sky-600 text-white border-sky-400 shadow'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    <User className="w-4 h-4" /> FERNANDO
                  </button>

                  <button
                    type="button"
                    onClick={() => handleProprietarioChangeModal('Bernardo')}
                    className={`p-2.5 rounded-xl font-extrabold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      novoProprietario === 'Bernardo'
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    <User className="w-4 h-4" /> BERNARDO
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Seleção Dinâmica de Clínicas do Proprietário */}
                <div>
                  <label className="block font-bold text-slate-400 mb-1">Clínica / Unidade</label>
                  <select
                    value={novaUnidade}
                    onChange={(e) => setNovaUnidade(e.target.value as any)}
                    className={`w-full p-2.5 rounded-xl border font-bold ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    {(novoProprietario === 'Fernando' ? CLINICAS_FERNANDO : CLINICAS_BERNARDO).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-400 mb-1">ID Exame</label>
                  <input
                    type="text"
                    value={novoId}
                    onChange={(e) => setNovoId(e.target.value)}
                    required
                    className={`w-full p-2.5 rounded-xl border font-mono ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-400 mb-1">Nome do Paciente</label>
                <input
                  type="text"
                  placeholder="Ex: CARLOS ALBERTO"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  required
                  className={`w-full p-2.5 rounded-xl border font-bold uppercase ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Região Tomográfica com TRAÇADO */}
                <div>
                  <label className="block font-bold text-slate-400 mb-1">Região Tomográfica</label>
                  <select
                    value={novaRegiao}
                    onChange={(e) => handleRegiaoChange(e.target.value as any)}
                    className={`w-full p-2.5 rounded-xl border font-bold ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <option value="TRAÇADO">TRAÇADO (R$ 4,00)</option>
                    <option value="UM DENTE">UM DENTE (R$ 10,00)</option>
                    <option value="MAX OU MAND">MAX OU MAND (R$ 15,00)</option>
                    <option value="MAX E MAND">MAX E MAND (R$ 20,00)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-400 mb-1">Data do Exame</label>
                  <input
                    type="date"
                    value={novaData}
                    onChange={(e) => setNovaData(e.target.value)}
                    required
                    className={`w-full p-2.5 rounded-xl border ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-400 mb-1">Valor Calculado (R$)</label>
                <input
                  type="number"
                  value={novoValor}
                  onChange={(e) => setNovoValor(Number(e.target.value))}
                  required
                  className={`w-full p-2.5 rounded-xl border font-extrabold text-emerald-400 text-sm ${
                    darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                />
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
                  className="px-5 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold rounded-xl shadow-lg shadow-teal-600/30 cursor-pointer"
                >
                  {itemEditando ? 'Salvar Alterações' : 'Confirmar e Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import type { ItemProducaoTomo, FechamentoProducao } from '../types';
import { pushToCloud, pullFromCloud, subscribeLocalBroadcast, getUserKeys, getItemJSON } from '../services/cloudSync';
import { WhatsappNotificacoes } from './WhatsappNotificacoes';
import { DADOS_PRODUCAO_EXCEL } from '../data/dadosProducaoExcel';
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
  MessageSquare,
  Lock,
  FolderArchive,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy
} from 'lucide-react';

interface ProducaoProps {
  darkMode?: boolean;
  usuarioId?: string;
}

const CLINICAS_FERNANDO = ['Ariquemes', 'Machadinho', 'Cacoal', 'Porto Velho'] as const;
const CLINICAS_BERNARDO = ['Rolim de Moura', 'Ouro Preto', 'Ji-Paraná'] as const;

// Função de fusão inteligente para garantir que exames adicionados localmente NUNCA sejam sobrescritos por respostas antigas do servidor
const smartMergeProducao = (local: ItemProducaoTomo[], remote: ItemProducaoTomo[]): ItemProducaoTomo[] => {
  if (!Array.isArray(remote) || remote.length === 0) return local;
  if (!Array.isArray(local) || local.length === 0) return remote;

  const remoteIds = new Set(remote.map((i) => i && i.id));
  const missingLocals = local.filter((i) => i && i.id && !remoteIds.has(i.id));

  return [...missingLocals, ...remote];
};

export const Producao: React.FC<ProducaoProps> = ({ darkMode, usuarioId }) => {
  const userKeys = getUserKeys(usuarioId);
  const STORAGE_KEY = userKeys.PRODUCAO;

  // Inicializa a lista de registros com sincronia estrita da planilha Excel (296 registros = R$ 1.757,00)
  const [itens, setItens] = useState<ItemProducaoTomo[]>(() => {
    const MIGRATION_TAG = 'odonto_excel_v1757_exact_sync_v2';
    const jaMigrou = localStorage.getItem(MIGRATION_TAG);

    if (!jaMigrou) {
      localStorage.setItem(MIGRATION_TAG, 'true');
      const str = JSON.stringify(DADOS_PRODUCAO_EXCEL);
      localStorage.setItem(STORAGE_KEY, str);
      localStorage.setItem('odonto_producao_backup_permanent', str);
      localStorage.setItem('odonto_producao_registros_usr_admin_master', str);
      localStorage.setItem('odonto_producao_registros_v2', str);
      localStorage.setItem('odonto_producao_registros', str);
      pushToCloud({ producao: DADOS_PRODUCAO_EXCEL }, usuarioId);
      return DADOS_PRODUCAO_EXCEL;
    }

    const salvo = getItemJSON<ItemProducaoTomo[]>(STORAGE_KEY, []);
    if (Array.isArray(salvo) && salvo.length > 0) {
      return salvo;
    }
    return DADOS_PRODUCAO_EXCEL;
  });

  const STORAGE_KEY_FECHAMENTOS = userKeys.FECHAMENTOS;

  const [fechamentos, setFechamentos] = useState<FechamentoProducao[]>(() => {
    return getItemJSON<FechamentoProducao[]>(STORAGE_KEY_FECHAMENTOS, []);
  });

  const [sincronizando, setSincronizando] = useState<boolean>(false);
  const [subAba, setSubAba] = useState<'producao' | 'historico' | 'whatsapp'>('producao');
  const [erroForm, setErroForm] = useState<string>('');
  const [sucessoMsg, setSucessoMsg] = useState<string>('');

  // Salvamento automático permanente em localStorage local
  useEffect(() => {
    if (Array.isArray(itens)) {
      const str = JSON.stringify(itens);
      localStorage.setItem(STORAGE_KEY, str);
      localStorage.setItem('odonto_producao_backup_permanent', str);
      localStorage.setItem('odonto_producao_registros_usr_admin_master', str);
      localStorage.setItem('odonto_producao_registros_v2', str);
      localStorage.setItem('odonto_producao_registros', str);
    }
  }, [itens, STORAGE_KEY]);

  useEffect(() => {
    if (Array.isArray(fechamentos)) {
      const str = JSON.stringify(fechamentos);
      localStorage.setItem(STORAGE_KEY_FECHAMENTOS, str);
    }
  }, [fechamentos, STORAGE_KEY_FECHAMENTOS]);

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

  const updateFechamentosECloud = (novosFechamentos: FechamentoProducao[]) => {
    setFechamentos(novosFechamentos);
    const str = JSON.stringify(novosFechamentos);
    localStorage.setItem(STORAGE_KEY_FECHAMENTOS, str);
    pushToCloud({ fechamentos: novosFechamentos }, usuarioId);
  };

  // Carregamento Prioritário ao abrir e Polling em tempo real com Fusão Inteligente
  useEffect(() => {
    setSincronizando(true);

    const mergeEAtualizar = (payloadProducao: ItemProducaoTomo[]) => {
      if (!Array.isArray(payloadProducao)) return;
      setItens((localAtual) => {
        const merged = smartMergeProducao(localAtual, payloadProducao);
        const str = JSON.stringify(merged);
        localStorage.setItem(STORAGE_KEY, str);
        localStorage.setItem('odonto_producao_backup_permanent', str);
        localStorage.setItem('odonto_producao_registros_usr_admin_master', str);
        localStorage.setItem('odonto_producao_registros_v2', str);
        localStorage.setItem('odonto_producao_registros', str);
        return merged;
      });
    };

    pullFromCloud((payload) => {
      if (Array.isArray(payload.producao)) {
        mergeEAtualizar(payload.producao);
      }
      setSincronizando(false);
    }, true, usuarioId);

    const unsubscribeBroadcast = subscribeLocalBroadcast((payload) => {
      if (Array.isArray(payload.producao)) {
        mergeEAtualizar(payload.producao);
      }
    }, usuarioId);

    const interval = setInterval(() => {
      pullFromCloud((payload) => {
        if (Array.isArray(payload.producao)) {
          mergeEAtualizar(payload.producao);
        }
      }, false, usuarioId);
    }, 3000);

    const handleFocus = () => {
      pullFromCloud((payload) => {
        if (Array.isArray(payload.producao)) {
          mergeEAtualizar(payload.producao);
        }
      }, true, usuarioId);
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      unsubscribeBroadcast();
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [usuarioId, STORAGE_KEY]);

  const [proprietarioFiltro, setProprietarioFiltro] = useState<'Todos' | 'Fernando' | 'Bernardo'>('Todos');
  const [unidadeFiltro, setUnidadeFiltro] = useState<string>('Todas');
  const [regiaoFiltro, setRegiaoFiltro] = useState<string>('Todas');
  const [apenasUrgentes, setApenasUrgentes] = useState<boolean>(false);
  const [busca, setBusca] = useState<string>('');

  // Paginação (10 Pacientes Visíveis por Página)
  const [paginaAtual, setPaginaAtual] = useState<number>(1);
  const ITENS_POR_PAGINA = 10;

  useEffect(() => {
    setPaginaAtual(1);
  }, [proprietarioFiltro, unidadeFiltro, regiaoFiltro, apenasUrgentes, busca]);

  // Modal Novo / Editar Registro
  const [modalAberto, setModalAberto] = useState<boolean>(false);
  const [modalZerarAberto, setModalZerarAberto] = useState<boolean>(false);
  const [itemEditando, setItemEditando] = useState<ItemProducaoTomo | null>(null);

  // Modais de Fechamento de Período (Fernando / Bernardo)
  const [modalFecharAberto, setModalFecharAberto] = useState<boolean>(false);
  const [proprietarioFechar, setProprietarioFechar] = useState<'Fernando' | 'Bernardo'>('Fernando');
  const [nomePeriodoFechar, setNomePeriodoFechar] = useState<string>('');
  const [obsFechar, setObsFechar] = useState<string>('');

  // States para a aba Histórico de Fechamentos
  const [buscaHistorico, setBuscaHistorico] = useState<string>('');
  const [proprietarioHistoricoFiltro, setProprietarioHistoricoFiltro] = useState<'Todos' | 'Fernando' | 'Bernardo'>('Todos');
  const [fechamentoExpandidoId, setFechamentoExpandidoId] = useState<string | null>(null);

  // Gerador de Nome Sugestivo de Período
  const getPeriodoNomeSugestao = (p: 'Fernando' | 'Bernardo') => {
    const hoje = new Date();
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const mesNome = meses[hoje.getMonth()];
    const ano = hoje.getFullYear();

    if (p === 'Fernando') {
      return `Mês de ${mesNome} / ${ano}`;
    } else {
      const dia = hoje.getDate();
      const quinzena = dia <= 15 ? '1ª Quinzena' : '2ª Quinzena';
      return `${quinzena} de ${mesNome} / ${ano}`;
    }
  };

  const handleAbrirModalFechar = (p?: 'Fernando' | 'Bernardo') => {
    const propSel = p || (proprietarioFiltro !== 'Todos' ? proprietarioFiltro : 'Fernando');
    setProprietarioFechar(propSel);
    setNomePeriodoFechar(getPeriodoNomeSugestao(propSel));
    setObsFechar('');
    setErroForm('');
    setModalFecharAberto(true);
  };

  const handleProprietarioFecharChange = (p: 'Fernando' | 'Bernardo') => {
    setProprietarioFechar(p);
    setNomePeriodoFechar(getPeriodoNomeSugestao(p));
  };

  const handleConfirmarFechamento = (e: React.FormEvent) => {
    e.preventDefault();
    const examesProprietario = itens.filter((i) => i.proprietario === proprietarioFechar);

    if (examesProprietario.length === 0) {
      setErroForm(`Não há nenhum exame em aberto registrado para o proprietário ${proprietarioFechar}.`);
      return;
    }

    const idFechamento = `fechamento-${proprietarioFechar.toLowerCase()}-${Date.now()}`;
    const totalR$ = examesProprietario.reduce((acc, i) => acc + i.valor, 0);

    const novoFechamento: FechamentoProducao = {
      id: idFechamento,
      proprietario: proprietarioFechar,
      tipoFechamento: proprietarioFechar === 'Fernando' ? 'Mensal' : 'Quinzenal',
      periodoNome: nomePeriodoFechar.trim() || getPeriodoNomeSugestao(proprietarioFechar),
      dataFechamento: new Date().toISOString(),
      totalValor: totalR$,
      totalExames: examesProprietario.length,
      itens: examesProprietario.map((i) => ({ ...i, fechamentoId: idFechamento })),
      observacoes: obsFechar.trim()
    };

    const novosFechamentos = [novoFechamento, ...fechamentos];
    updateFechamentosECloud(novosFechamentos);

    // Remove apenas os exames desse proprietario da produção ativa!
    const itensRestantesAtivos = itens.filter((i) => i.proprietario !== proprietarioFechar);
    updateItensECloud(itensRestantesAtivos);

    setSucessoMsg(`🔒 Período "${novoFechamento.periodoNome}" (${proprietarioFechar}) fechado com sucesso! ${novoFechamento.totalExames} exames (R$ ${novoFechamento.totalValor.toLocaleString('pt-BR')},00) foram arquivados no histórico.`);
    setModalFecharAberto(false);
    setSubAba('historico');

    setTimeout(() => {
      setSucessoMsg('');
    }, 6000);
  };

  const handleReabrirFechamento = (f: FechamentoProducao) => {
    if (window.confirm(`Deseja reabrir o fechamento "${f.periodoNome}" (${f.proprietario})?\n\nOs ${f.totalExames} exames (R$ ${f.totalValor.toLocaleString('pt-BR')},00) retornarão para a lista de produção ativa.`)) {
      const examesRetornados = f.itens.map((i) => {
        const { fechamentoId, ...rest } = i;
        return rest;
      });

      const novosItensAtivos = [...examesRetornados, ...itens];
      updateItensECloud(novosItensAtivos);

      const fechamentosRestantes = fechamentos.filter((item) => item.id !== f.id);
      updateFechamentosECloud(fechamentosRestantes);

      setSucessoMsg(`↺ Fechamento "${f.periodoNome}" reaberto com sucesso! Os exames retornaram para a produção ativa.`);
    }
  };

  const handleCopiarResumoFechamento = (f: FechamentoProducao) => {
    let texto = `*RESUMO DE FECHAMENTO DE PRODUÇÃO - ${f.proprietario.toUpperCase()}*\n`;
    texto += `📅 *Período:* ${f.periodoNome}\n`;
    texto += `🔒 *Data de Fechamento:* ${new Date(f.dataFechamento).toLocaleDateString('pt-BR')}\n`;
    texto += `📊 *Total de Exames:* ${f.totalExames}\n`;
    texto += `💰 *Valor Total Geral:* R$ ${f.totalValor.toLocaleString('pt-BR')},00\n\n`;

    texto += `*DETALHAMENTO POR CLÍNICA:*\n`;
    const clinicasDoFechamento = f.proprietario === 'Fernando' ? CLINICAS_FERNANDO : CLINICAS_BERNARDO;
    clinicasDoFechamento.forEach((clinica) => {
      const examesClinica = f.itens.filter((i) => i.unidade === clinica);
      const valClinica = examesClinica.reduce((acc, i) => acc + i.valor, 0);
      texto += `• *${clinica}:* R$ ${valClinica.toLocaleString('pt-BR')},00 (${examesClinica.length} exames)\n`;
    });

    navigator.clipboard.writeText(texto);
    alert(`✅ Resumo do fechamento "${f.periodoNome}" copiado para a área de transferência!`);
  };

  const [novoProprietario, setNovoProprietario] = useState<'Fernando' | 'Bernardo'>('Fernando');
  const [novoId, setNovoId] = useState<string>('');
  const [novaData, setNovaData] = useState<string>(new Date().toISOString().split('T')[0]);
  const [novoNome, setNovoNome] = useState<string>('');
  const [novaRegiao, setNovaRegiao] = useState<'TRAÇADO' | 'UM DENTE' | 'MAX OU MAND' | 'MAX E MAND'>('MAX OU MAND');
  const [novoValor, setNovoValor] = useState<number>(15);
  const [novaUnidade, setNovaUnidade] = useState<typeof CLINICAS_FERNANDO[number] | typeof CLINICAS_BERNARDO[number]>('Ariquemes');
  const [novaUrgencia, setNovaUrgencia] = useState<boolean>(false);

  // Abrir Modal para Novo Registro
  const handleAbrirNovoModal = () => {
    setItemEditando(null);
    setErroForm('');
    setNovoId('');
    setNovaData(new Date().toISOString().split('T')[0]);
    setNovoNome('');
    setNovaRegiao('MAX OU MAND');
    setNovoValor(15);
    setNovoProprietario('Fernando');
    setNovaUnidade(CLINICAS_FERNANDO[0]);
    setNovaUrgencia(false);
    setModalAberto(true);
  };

  // Abrir Modal para Editar Registro Existente
  const handleAbrirEditarModal = (item: ItemProducaoTomo) => {
    setItemEditando(item);
    setErroForm('');
    setNovoId(item.id);
    setNovoProprietario(item.proprietario);
    setNovaData(item.data);
    setNovoNome(item.pacienteNome);
    setNovaRegiao(item.regiao);
    setNovoValor(item.valor);
    setNovaUnidade(item.unidade);
    setNovaUrgencia(!!item.urgencia);
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

  // Ao alterar a clínica no modal, vincular automaticamente o proprietário correspondente
  const handleUnidadeChangeModal = (u: string) => {
    setNovaUnidade(u as any);
    if ((CLINICAS_FERNANDO as readonly string[]).includes(u)) {
      setNovoProprietario('Fernando');
    } else if ((CLINICAS_BERNARDO as readonly string[]).includes(u)) {
      setNovoProprietario('Bernardo');
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
    const nomeLimpo = novoNome.trim();
    if (!nomeLimpo) {
      setErroForm('Por favor, informe o nome do paciente.');
      return;
    }
    setErroForm('');

    const novoIdFinal = itemEditando
      ? itemEditando.id
      : (novoId && novoId.trim() ? novoId.trim() : `prod-${Date.now()}-${Math.floor(Math.random() * 10000)}`);

    const itemProcessado: ItemProducaoTomo = {
      id: novoIdFinal,
      data: novaData,
      pacienteNome: nomeLimpo.toUpperCase(),
      regiao: novaRegiao,
      valor: novoValor,
      unidade: novaUnidade as any,
      proprietario: novoProprietario,
      urgencia: novaUrgencia
    };

    let listaAtualizada: ItemProducaoTomo[];
    if (itemEditando) {
      listaAtualizada = itens.map((i) => (i.id === itemEditando.id ? itemProcessado : i));
    } else {
      listaAtualizada = [itemProcessado, ...itens];
    }

    updateItensECloud(listaAtualizada);

    // RESET COMPLETO DE FILTROS E PAGINAÇÃO PARA GARANTIR VISIBILIDADE IMEDIATA DO NOVO PACIENTE REGISTRADO NO TOPO DA TABELA
    if (!itemEditando) {
      setProprietarioFiltro('Todos');
      setUnidadeFiltro('Todas');
      setRegiaoFiltro('Todas');
      setApenasUrgentes(false);
      setBusca('');
      setPaginaAtual(1);
    }

    setSucessoMsg(`✨ Paciente "${nomeLimpo.toUpperCase()}" (${novaUnidade}) registrado com sucesso!`);
    setModalAberto(false);
    setItemEditando(null);
    setNovoNome('');
    setNovaUrgencia(false);
    setNovoId('');

    setTimeout(() => {
      setSucessoMsg('');
    }, 5000);
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
    const atendeUrgencia = !apenasUrgentes || !!i.urgencia;
    const atendeBusca = i.pacienteNome.toLowerCase().includes(busca.toLowerCase()) || i.id.includes(busca);
    return atendeProprietario && atendeUnidade && atendeRegiao && atendeUrgencia && atendeBusca;
  });

  // Paginação dos Itens Filtrados
  const totalPaginas = Math.ceil(itensFiltrados.length / ITENS_POR_PAGINA) || 1;
  const inicioIndex = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const itensPaginados = itensFiltrados.slice(inicioIndex, inicioIndex + ITENS_POR_PAGINA);

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
            <BarChart3 className="w-4 h-4 text-teal-300" /> ⚡ Produção Ativa (Lançamentos em Aberto)
          </button>

          <button
            onClick={() => setSubAba('historico')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              subAba === 'historico'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <FolderArchive className="w-4 h-4 text-amber-300" /> 📁 Histórico de Fechamentos ({fechamentos.length})
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
      ) : subAba === 'historico' ? (
        <div className="space-y-6">
          <div className={`p-6 rounded-3xl border shadow-xl ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 flex items-center gap-1.5 w-fit">
                  <FolderArchive className="w-3.5 h-3.5" /> Arquivo Morto & Histórico Permanente
                </span>
                <h2 className="text-xl font-black flex items-center gap-2 mt-1">
                  📁 Histórico de Fechamentos da Produção
                </h2>
                <p className="text-xs text-slate-400">
                  Consulte fechamentos arquivados de meses anteriores (Fernando - Mensal) e quinzenas (Bernardo - Quinzenal) com busca global por paciente.
                </p>
              </div>

              <button
                onClick={() => handleAbrirModalFechar()}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg cursor-pointer transition-all hover:scale-105"
              >
                <Lock className="w-4 h-4" /> + Realizar Novo Fechamento
              </button>
            </div>

            {/* FILTROS E BUSCA DO HISTÓRICO */}
            <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Buscar nome de paciente em todo o histórico de fechamentos..."
                  value={buscaHistorico}
                  onChange={(e) => setBuscaHistorico(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-xs border outline-none font-medium transition-all ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-amber-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-amber-500'
                  }`}
                />
                {buscaHistorico && (
                  <button onClick={() => setBuscaHistorico('')} className="absolute right-3 top-3 text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setProprietarioHistoricoFiltro('Todos')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    proprietarioHistoricoFiltro === 'Todos' ? 'bg-amber-500 text-slate-950 shadow' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setProprietarioHistoricoFiltro('Fernando')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    proprietarioHistoricoFiltro === 'Fernando' ? 'bg-sky-500 text-white shadow' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Fernando (Mensal)
                </button>
                <button
                  onClick={() => setProprietarioHistoricoFiltro('Bernardo')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    proprietarioHistoricoFiltro === 'Bernardo' ? 'bg-indigo-500 text-white shadow' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Bernardo (Quinzenal)
                </button>
              </div>
            </div>
          </div>

          {/* LISTA DE CARDS DE FECHAMENTOS */}
          {(() => {
            const fechamentosFiltrados = fechamentos.filter((f) => {
              const atendeProp = proprietarioHistoricoFiltro === 'Todos' || f.proprietario === proprietarioHistoricoFiltro;
              const atendeBusca =
                buscaHistorico.trim() === '' ||
                f.itens.some((i) => i.pacienteNome.toLowerCase().includes(buscaHistorico.toLowerCase())) ||
                f.periodoNome.toLowerCase().includes(buscaHistorico.toLowerCase());
              return atendeProp && atendeBusca;
            });

            if (fechamentosFiltrados.length === 0) {
              return (
                <div className={`p-12 text-center rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}>
                  <FolderArchive className="w-12 h-12 text-amber-500/50 mx-auto mb-3 animate-pulse" />
                  <h3 className="text-base font-bold text-slate-300">Nenhum Fechamento Encontrado</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    {fechamentos.length === 0
                      ? 'Você ainda não arquivou nenhum período de produção. Clique em "Realizar Novo Fechamento" para fechar o mês do Fernando ou a quinzena do Bernardo.'
                      : 'Nenhum fechamento corresponde aos filtros aplicados ou à busca do paciente.'}
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-4">
                {fechamentosFiltrados.map((f) => {
                  const isExpandido = fechamentoExpandidoId === f.id || buscaHistorico.trim() !== '';
                  const examesFiltradosBusca = buscaHistorico.trim()
                    ? f.itens.filter((i) => i.pacienteNome.toLowerCase().includes(buscaHistorico.toLowerCase()))
                    : f.itens;

                  return (
                    <div
                      key={f.id}
                      className={`rounded-3xl border transition-all overflow-hidden shadow-lg ${
                        f.proprietario === 'Fernando'
                          ? darkMode ? 'bg-slate-900 border-sky-900/60' : 'bg-white border-sky-200'
                          : darkMode ? 'bg-slate-900 border-indigo-900/60' : 'bg-white border-indigo-200'
                      }`}
                    >
                      {/* HEADER DO CARD DE FECHAMENTO */}
                      <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/50">
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-2xl ${f.proprietario === 'Fernando' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'}`}>
                            <FolderArchive className="w-6 h-6" />
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                f.proprietario === 'Fernando' ? 'bg-sky-500/20 text-sky-300 border-sky-400/30' : 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30'
                              }`}>
                                {f.proprietario} • Fechamento {f.tipoFechamento}
                              </span>
                              <span className="text-[10px] text-slate-400 flex items-center gap-1 font-semibold">
                                <Clock className="w-3 h-3" /> {new Date(f.dataFechamento).toLocaleDateString('pt-BR')} às {new Date(f.dataFechamento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <h3 className="text-lg font-black text-white mt-1">
                              {f.periodoNome}
                            </h3>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 font-bold block">{f.totalExames} exames arquivados</span>
                            <span className={`text-xl font-black ${f.proprietario === 'Fernando' ? 'text-sky-400' : 'text-indigo-400'}`}>
                              R$ {f.totalValor.toLocaleString('pt-BR')},00
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleCopiarResumoFechamento(f)}
                              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 cursor-pointer transition-all"
                              title="Copiar Resumo para WhatsApp"
                            >
                              <Copy className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleReabrirFechamento(f)}
                              className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/50 cursor-pointer transition-all"
                              title="Reabrir este fechamento (Retornar exames para a lista ativa)"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setFechamentoExpandidoId(isExpandido && !buscaHistorico ? null : f.id)}
                              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer transition-all flex items-center gap-1 text-xs font-bold"
                            >
                              {isExpandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              <span className="hidden sm:inline">{isExpandido ? 'Ocultar' : 'Ver Pacientes'}</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* DETALHAMENTO DE PACIENTES QUANDO EXPANDIDO */}
                      {isExpandido && (
                        <div className="p-5 bg-slate-950/50 space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-400 border-b border-slate-800/60 pb-3">
                            <span>Exames do Período ({examesFiltradosBusca.length} de {f.totalExames}):</span>
                            <div className="flex flex-wrap gap-3">
                              {(f.proprietario === 'Fernando' ? CLINICAS_FERNANDO : CLINICAS_BERNARDO).map((clinica) => {
                                const count = f.itens.filter((i) => i.unidade === clinica).length;
                                const total = f.itens.filter((i) => i.unidade === clinica).reduce((acc, i) => acc + i.valor, 0);
                                if (count === 0) return null;
                                return (
                                  <span key={clinica} className="bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 text-[11px]">
                                    {clinica}: <strong className="text-white">R$ {total.toLocaleString('pt-BR')},00</strong> ({count})
                                  </span>
                                );
                              })}
                            </div>
                          </div>

                          <div className="overflow-x-auto rounded-2xl border border-slate-800">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-900 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                                <tr>
                                  <th className="p-3">ID / Código</th>
                                  <th className="p-3">Data</th>
                                  <th className="p-3">Paciente</th>
                                  <th className="p-3">Região / Exame</th>
                                  <th className="p-3">Clínica</th>
                                  <th className="p-3 text-right">Valor</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/60 text-slate-300 font-medium">
                                {examesFiltradosBusca.map((item) => (
                                  <tr key={item.id} className="hover:bg-slate-900/60">
                                    <td className="p-3 font-mono text-[11px] text-slate-400">{item.id}</td>
                                    <td className="p-3">{new Date(item.data).toLocaleDateString('pt-BR')}</td>
                                    <td className="p-3 font-bold text-white">{item.pacienteNome}</td>
                                    <td className="p-3">
                                      <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-bold">
                                        {item.regiao}
                                      </span>
                                    </td>
                                    <td className="p-3 text-teal-400 font-semibold">{item.unidade}</td>
                                    <td className="p-3 text-right font-bold text-emerald-400">R$ {item.valor.toLocaleString('pt-BR')},00</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      ) : (
        <>
      {sucessoMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-extrabold flex items-center justify-between shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{sucessoMsg}</span>
          </div>
          <button onClick={() => setSucessoMsg('')} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
            onClick={() => handleAbrirModalFechar()}
            className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold px-3.5 py-2.5 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all hover:scale-105 w-full sm:w-auto"
            title="Fechar mês do Fernando ou quinzena do Bernardo e arquivar no histórico"
          >
            <Lock className="w-4 h-4" /> 🔒 Fechar Período (Arquivar)
          </button>

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
          
          <div className="text-[11px] text-slate-400 pt-1 flex items-center justify-between font-semibold border-t border-slate-800/40">
            <span>Total de Exames:</span>
            <span className="font-bold text-white">{itensFernando.length} tomografias</span>
          </div>

          <button
            onClick={() => handleAbrirModalFechar('Fernando')}
            className="w-full py-2 bg-sky-950/80 hover:bg-sky-900 text-sky-300 border border-sky-800/60 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow hover:scale-[1.02]"
          >
            <Lock className="w-3.5 h-3.5 text-sky-400" /> 🔒 Fechar Mês do Fernando
          </button>
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

          <div className="text-[11px] text-slate-400 pt-1 flex items-center justify-between font-semibold border-t border-slate-800/40">
            <span>Total de Exames:</span>
            <span className="font-bold text-white">{itensBernardo.length} exames / traçados</span>
          </div>

          <button
            onClick={() => handleAbrirModalFechar('Bernardo')}
            className="w-full py-2 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/60 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow hover:scale-[1.02]"
          >
            <Lock className="w-3.5 h-3.5 text-indigo-400" /> 🔒 Fechar Quinzena do Bernardo
          </button>
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
          {/* Botão Filtro Urgência */}
          <button
            type="button"
            onClick={() => setApenasUrgentes(!apenasUrgentes)}
            className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              apenasUrgentes
                ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/30 font-black'
                : darkMode
                ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${apenasUrgentes ? 'text-white animate-pulse' : 'text-rose-400'}`} />
            <span>Apenas Urgências</span>
          </button>

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

          <div className="flex items-center gap-2">
            {itens.some((i) => i.urgencia) && (
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" /> {itens.filter((i) => i.urgencia).length} Urgências
              </span>
            )}
            <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Total Exibido: R$ {itensFiltrados.reduce((acc, i) => acc + i.valor, 0).toLocaleString('pt-BR')}
            </span>
          </div>
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
                  <th className="p-3">Prioridade</th>
                  <th className="p-3">Valor (R$)</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 font-medium">
                {itensPaginados.map((item) => (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      item.urgencia
                        ? 'bg-rose-950/30 hover:bg-rose-900/40 border-l-4 border-l-rose-500'
                        : 'hover:bg-slate-800/50'
                    }`}
                  >
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
                    <td className="p-3 font-bold text-white uppercase flex items-center gap-2">
                      <span>{item.pacienteNome}</span>
                      {item.urgencia && (
                        <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                          🚨 URGÊNCIA
                        </span>
                      )}
                    </td>
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
                    <td className="p-3 font-bold">
                      {item.urgencia ? (
                        <span className="bg-rose-600 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1 w-fit shadow-md shadow-rose-600/30">
                          🚨 URGÊNCIA
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px] font-semibold">Normal</span>
                      )}
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

        {/* BARRA DE PAGINAÇÃO (10 PACIENTES POR PÁGINA) */}
        {itensFiltrados.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800/60 text-xs font-bold">
            <div className="text-slate-400">
              Mostrando <span className="text-white font-extrabold">{inicioIndex + 1}</span> até{' '}
              <span className="text-white font-extrabold">{Math.min(inicioIndex + ITENS_POR_PAGINA, itensFiltrados.length)}</span> de{' '}
              <span className="text-teal-400 font-extrabold">{itensFiltrados.length}</span> pacientes registrados
            </div>

            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              <button
                onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                disabled={paginaAtual === 1}
                className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold transition-all flex items-center gap-1 cursor-pointer ${
                  paginaAtual === 1
                    ? 'bg-slate-800/40 text-slate-600 border-slate-800 cursor-not-allowed'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700 hover:border-teal-500/50'
                }`}
              >
                ← Anterior
              </button>

              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pg) => {
                if (
                  pg === 1 ||
                  pg === totalPaginas ||
                  (pg >= paginaAtual - 1 && pg <= paginaAtual + 1)
                ) {
                  return (
                    <button
                      key={pg}
                      onClick={() => setPaginaAtual(pg)}
                      className={`w-8 h-8 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                        paginaAtual === pg
                          ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white border-teal-400 shadow-md shadow-teal-500/20'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      }`}
                    >
                      {pg}
                    </button>
                  );
                } else if (
                  (pg === 2 && paginaAtual > 3) ||
                  (pg === totalPaginas - 1 && paginaAtual < totalPaginas - 2)
                ) {
                  return (
                    <span key={pg} className="px-1 text-slate-500 font-bold">
                      ...
                    </span>
                  );
                }
                return null;
              })}

              <button
                onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaAtual === totalPaginas}
                className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold transition-all flex items-center gap-1 cursor-pointer ${
                  paginaAtual === totalPaginas
                    ? 'bg-slate-800/40 text-slate-600 border-slate-800 cursor-not-allowed'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700 hover:border-teal-500/50'
                }`}
              >
                Próximo →
              </button>
            </div>
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
              {erroForm && (
                <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{erroForm}</span>
                </div>
              )}
              
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
                    onChange={(e) => handleUnidadeChangeModal(e.target.value)}
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
                  <label className="block font-bold text-slate-400 mb-1">ID Exame (opcional)</label>
                  <input
                    type="text"
                    value={novoId}
                    onChange={(e) => setNovoId(e.target.value)}
                    placeholder="Ex: 71128 (opcional)"
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

              {/* Opção de Marcar como Urgência */}
              <div
                onClick={() => setNovaUrgencia(!novaUrgencia)}
                className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer select-none transition-all ${
                  novaUrgencia
                    ? 'bg-rose-500/20 border-rose-500/50 text-white shadow-lg shadow-rose-500/10'
                    : darkMode ? 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${novaUrgencia ? 'bg-rose-600 text-white animate-bounce' : 'bg-slate-800 text-slate-400'}`}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-extrabold text-xs block text-slate-100 flex items-center gap-1.5">
                      🚨 Exame de Urgência {novaUrgencia && <span className="text-[9px] font-black bg-rose-600 text-white px-2 py-0.2 rounded-full uppercase">ATIVADO</span>}
                    </span>
                    <span className="text-[10px] text-slate-400 block">Marque para destacar o exame com selo de urgência vermelho na lista</span>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={novaUrgencia}
                  onChange={(e) => setNovaUrgencia(e.target.checked)}
                  className="w-4 h-4 rounded border-rose-700 bg-slate-950 text-rose-500 focus:ring-rose-500 cursor-pointer"
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

      {/* MODAL DE CONFIRMAÇÃO DE FECHAMENTO DE PERÍODO & ARQUIVAMENTO */}
      {modalFecharAberto && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className={`w-full max-w-lg rounded-3xl border shadow-2xl p-6 relative overflow-hidden space-y-5 ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <button
              onClick={() => setModalFecharAberto(false)}
              className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/80 hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Fechamento de Produção & Arquivamento
                </span>
                <h3 className="text-lg font-black mt-0.5">
                  Fechar Período de Produção
                </h3>
              </div>
            </div>

            <form onSubmit={handleConfirmarFechamento} className="space-y-4">
              {erroForm && (
                <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold">
                  {erroForm}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Proprietário do Fechamento</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleProprietarioFecharChange('Fernando')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      proprietarioFechar === 'Fernando'
                        ? 'bg-sky-600 border-sky-400 text-white shadow-md'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    FERNANDO (Mensal)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleProprietarioFecharChange('Bernardo')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      proprietarioFechar === 'Bernardo'
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    BERNARDO (Quinzenal)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Nome do Período / Identificador</label>
                <input
                  type="text"
                  required
                  value={nomePeriodoFechar}
                  onChange={(e) => setNomePeriodoFechar(e.target.value)}
                  placeholder="Ex: Mês de Setembro / 2026 ou 1ª Quinzena de Setembro"
                  className={`w-full p-3 rounded-xl text-xs border outline-none font-bold ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-amber-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500'
                  }`}
                />
              </div>

              {/* RESUMO DOS EXAMES A SEREM ARQUIVADOS */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                  Resumo dos Registros em Aberto para {proprietarioFechar}:
                </span>
                {(() => {
                  const examesProp = itens.filter((i) => i.proprietario === proprietarioFechar);
                  const totalVal = examesProp.reduce((acc, i) => acc + i.valor, 0);
                  return (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-semibold">{examesProp.length} exames prontos para arquivamento</span>
                      <strong className="text-emerald-400 text-sm font-black">R$ {totalVal.toLocaleString('pt-BR')},00</strong>
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">Observações do Fechamento (Opcional)</label>
                <textarea
                  rows={2}
                  value={obsFechar}
                  onChange={(e) => setObsFechar(e.target.value)}
                  placeholder="Anotações ou avisos sobre este fechamento..."
                  className={`w-full p-3 rounded-xl text-xs border outline-none font-medium ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-amber-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500'
                  }`}
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalFecharAberto(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 shadow-lg cursor-pointer transition-all hover:scale-105"
                >
                  🔒 Confirmar Fechamento & Arquivar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import type { Consulta, StatusConsulta, Paciente } from '../types';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Edit2,
  Trash2,
  User,
  X,
  Grid,
  List as ListIcon,
  CalendarDays,
  Sparkles,
  MessageCircle,
  HeartHandshake,
  Briefcase,
  DollarSign,
  Check,
  CheckCircle2
} from 'lucide-react';
import { getItemJSON, pushToCloud } from '../services/cloudSync';

export type CategoriaAgenda =
  | 'Responsabilidade Familiar'
  | 'Profissional / Clínica'
  | 'Compromisso Financeiro'
  | 'Pessoal / Saúde'
  | 'Outro';

export interface ItemAgendaCompromisso {
  id: string;
  data: string; // YYYY-MM-DD
  horario: string; // HH:mm
  duracaoMinutos: number;
  titulo: string;
  categoria: CategoriaAgenda;
  responsavel: string;
  pacienteNome?: string;
  pacienteTelefone?: string;
  status: StatusConsulta;
  observacoes?: string;
}

interface AgendaProps {
  consultas?: Consulta[];
  pacientes?: Paciente[];
  onAddConsulta?: (nova: Omit<Consulta, 'id'>) => void;
  onEditConsulta?: (consulta: Consulta) => void;
  onDeleteConsulta?: (id: string) => void;
  onUpdateStatus?: (id: string, novoStatus: StatusConsulta) => void;
  darkMode?: boolean;
  usuarioId?: string;
}

type TipoVisualizacao = 'tabela' | 'dia' | 'semana' | 'mes';

const statusCores: Record<StatusConsulta, { bg: string; text: string; border: string; badge: string; hex: string }> = {
  'Agendado': { bg: 'bg-sky-500/10 hover:bg-sky-500/20', text: 'text-sky-400', border: 'border-sky-500/30', badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30', hex: '#0284C7' },
  'Confirmado': { bg: 'bg-teal-500/10 hover:bg-teal-500/20', text: 'text-teal-400', border: 'border-teal-500/30', badge: 'bg-teal-500/20 text-teal-300 border-teal-500/30', hex: '#0D9488' },
  'Em Atendimento': { bg: 'bg-amber-500/10 hover:bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse', hex: '#D97706' },
  'Finalizado': { bg: 'bg-emerald-500/10 hover:bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', hex: '#059669' },
  'Cancelado': { bg: 'bg-rose-500/10 hover:bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/30', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30', hex: '#E11D48' },
};

const categoriaBadges: Record<CategoriaAgenda, { badge: string; icon: any }> = {
  'Responsabilidade Familiar': { badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30', icon: HeartHandshake },
  'Profissional / Clínica': { badge: 'bg-teal-500/20 text-teal-300 border-teal-500/30', icon: Briefcase },
  'Compromisso Financeiro': { badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', icon: DollarSign },
  'Pessoal / Saúde': { badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30', icon: User },
  'Outro': { badge: 'bg-slate-700 text-slate-300 border-slate-600', icon: CalendarIcon }
};

const HORARIOS_DIA = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
];

const getHojeIso = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const INITIAL_MOCK_COMPROMISSOS: ItemAgendaCompromisso[] = [
  {
    id: 'comp-1',
    data: getHojeIso(),
    horario: '08:30',
    duracaoMinutos: 45,
    titulo: 'Levar os filhos na escola e reunião escolar',
    categoria: 'Responsabilidade Familiar',
    responsavel: 'Família',
    status: 'Finalizado',
    observacoes: 'Acompanhar horário da natação às 16h'
  },
  {
    id: 'comp-2',
    data: getHojeIso(),
    horario: '10:00',
    duracaoMinutos: 60,
    titulo: 'Consulta Odontológica e Tomografia - CARLOS ALBERTO',
    categoria: 'Profissional / Clínica',
    responsavel: 'Fernando',
    pacienteNome: 'CARLOS ALBERTO',
    pacienteTelefone: '(69) 99364-9158',
    status: 'Confirmado',
    observacoes: 'Tomografia Max OU Mand / Ariquemes'
  },
  {
    id: 'comp-3',
    data: getHojeIso(),
    horario: '14:00',
    duracaoMinutos: 30,
    titulo: 'Pagamento de fornecedores e balanço quinzenal',
    categoria: 'Compromisso Financeiro',
    responsavel: 'Bernardo',
    status: 'Agendado',
    observacoes: 'Verificar comprovantes da clínica de Ji-Paraná'
  },
  {
    id: 'comp-4',
    data: getHojeIso(),
    horario: '17:30',
    duracaoMinutos: 60,
    titulo: 'Jantar em família e compras da semana',
    categoria: 'Responsabilidade Familiar',
    responsavel: 'Família',
    status: 'Agendado',
    observacoes: 'Supermercado e compromisso pessoal'
  }
];

export const Agenda: React.FC<AgendaProps> = ({
  darkMode,
  usuarioId
}) => {
  const AGENDA_STORAGE_KEY = `odonto_agenda_compromissos_${usuarioId || 'usr-admin-master'}`;

  // Lista de Compromissos com Persistência Permanente Local & Cloud
  const [compromissos, setCompromissos] = useState<ItemAgendaCompromisso[]>(() => {
    return getItemJSON<ItemAgendaCompromisso[]>(AGENDA_STORAGE_KEY, INITIAL_MOCK_COMPROMISSOS);
  });

  // Salva permanentemente no localStorage e Nuvem a cada alteração
  const salvarCompromissosECloud = (novos: ItemAgendaCompromisso[]) => {
    setCompromissos(novos);
    localStorage.setItem(AGENDA_STORAGE_KEY, JSON.stringify(novos));
    localStorage.setItem('odonto_agenda_compromissos_v1', JSON.stringify(novos));
    pushToCloud({ consultas: novos as any }, usuarioId);
  };

  // Padrão em TABELA conforme solicitado explicitamente pelo usuário
  const [visualizacao, setVisualizacao] = useState<TipoVisualizacao>('tabela');

  const [dataSelecionada, setDataSelecionada] = useState<string>(getHojeIso());
  const [filtroPeriodo, setFiltroPeriodo] = useState<'hoje' | 'semana' | 'mes' | 'todos'>('todos');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('Todas');
  const [filtroStatus, setFiltroStatus] = useState<string>('Todos');
  const [busca, setBusca] = useState<string>('');

  // States do Modal
  const [modalAberto, setModalAberto] = useState<boolean>(false);
  const [itemEditando, setItemEditando] = useState<ItemAgendaCompromisso | null>(null);
  const [itemExcluindoId, setItemExcluindoId] = useState<string | null>(null);

  // Form States
  const [titulo, setTitulo] = useState<string>('');
  const [dataForm, setDataForm] = useState<string>(getHojeIso());
  const [horarioForm, setHorarioForm] = useState<string>('09:00');
  const [duracaoForm, setDuracaoForm] = useState<number>(45);
  const [categoriaForm, setCategoriaForm] = useState<CategoriaAgenda>('Profissional / Clínica');
  const [responsavelForm, setResponsavelForm] = useState<string>('Fernando');
  const [pacienteNomeForm, setPacienteNomeForm] = useState<string>('');
  const [pacienteTelefoneForm, setPacienteTelefoneForm] = useState<string>('');
  const [statusForm, setStatusForm] = useState<StatusConsulta>('Agendado');
  const [observacoesForm, setObservacoesForm] = useState<string>('');

  // Navegação de Datas
  const handleDataAnterior = () => {
    const d = new Date(dataSelecionada + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setDataSelecionada(`${year}-${month}-${day}`);
  };

  const handleProximaData = () => {
    const d = new Date(dataSelecionada + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setDataSelecionada(`${year}-${month}-${day}`);
  };

  const handleHoje = () => {
    setDataSelecionada(getHojeIso());
    setFiltroPeriodo('hoje');
  };

  // Filtro inteligente de compromissos
  const compromissosFiltrados = compromissos.filter((item) => {
    const hojeIso = getHojeIso();

    // Filtro por período de data
    let atendePeriodo = true;
    if (filtroPeriodo === 'hoje') {
      atendePeriodo = item.data === hojeIso;
    } else if (filtroPeriodo === 'semana') {
      const dItem = new Date(item.data + 'T00:00:00').getTime();
      const dHoje = new Date(hojeIso + 'T00:00:00').getTime();
      const diffDias = Math.abs(dItem - dHoje) / (1000 * 3600 * 24);
      atendePeriodo = diffDias <= 7;
    } else if (filtroPeriodo === 'mes') {
      atendePeriodo = item.data.substring(0, 7) === hojeIso.substring(0, 7);
    }

    const atendeCategoria = filtroCategoria === 'Todas' || item.categoria === filtroCategoria;
    const atendeStatus = filtroStatus === 'Todos' || item.status === filtroStatus;
    const atendeBusca =
      item.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      (item.pacienteNome && item.pacienteNome.toLowerCase().includes(busca.toLowerCase())) ||
      (item.responsavel && item.responsavel.toLowerCase().includes(busca.toLowerCase())) ||
      (item.observacoes && item.observacoes.toLowerCase().includes(busca.toLowerCase()));

    return atendePeriodo && atendeCategoria && atendeStatus && atendeBusca;
  });

  // Ordena por data e horário (mais recentes/próximos primeiro)
  const compromissosOrdenados = [...compromissosFiltrados].sort((a, b) => {
    const keyA = `${a.data}T${a.horario}`;
    const keyB = `${b.data}T${b.horario}`;
    return keyA.localeCompare(keyB);
  });

  // KPIs Resumo
  const totalCompromissos = compromissos.length;
  const familiaresCount = compromissos.filter((c) => c.categoria === 'Responsabilidade Familiar').length;
  const profissionaisCount = compromissos.filter((c) => c.categoria === 'Profissional / Clínica').length;
  const concluidosCount = compromissos.filter((c) => c.status === 'Finalizado').length;

  const handleAbrirNovoModal = (horarioPref = '09:00', catPref: CategoriaAgenda = 'Profissional / Clínica') => {
    setItemEditando(null);
    setTitulo('');
    setDataForm(dataSelecionada || getHojeIso());
    setHorarioForm(horarioPref);
    setDuracaoForm(45);
    setCategoriaForm(catPref);
    setResponsavelForm('Fernando');
    setPacienteNomeForm('');
    setPacienteTelefoneForm('');
    setStatusForm('Agendado');
    setObservacoesForm('');
    setModalAberto(true);
  };

  const handleAbrirEditarModal = (item: ItemAgendaCompromisso) => {
    setItemEditando(item);
    setTitulo(item.titulo);
    setDataForm(item.data);
    setHorarioForm(item.horario);
    setDuracaoForm(item.duracaoMinutos);
    setCategoriaForm(item.categoria);
    setResponsavelForm(item.responsavel || 'Fernando');
    setPacienteNomeForm(item.pacienteNome || '');
    setPacienteTelefoneForm(item.pacienteTelefone || '');
    setStatusForm(item.status);
    setObservacoesForm(item.observacoes || '');
    setModalAberto(true);
  };

  const handleAlternarStatusConcluido = (item: ItemAgendaCompromisso) => {
    const novoStatus: StatusConsulta = item.status === 'Finalizado' ? 'Agendado' : 'Finalizado';
    const novos = compromissos.map((c) => (c.id === item.id ? { ...c, status: novoStatus } : c));
    salvarCompromissosECloud(novos);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const tituloLimpo = titulo.trim();
    if (!tituloLimpo) return;

    const itemProcessado: ItemAgendaCompromisso = {
      id: itemEditando ? itemEditando.id : `agenda-${Date.now()}`,
      data: dataForm,
      horario: horarioForm,
      duracaoMinutos: Number(duracaoForm) || 30,
      titulo: tituloLimpo,
      categoria: categoriaForm,
      responsavel: responsavelForm,
      pacienteNome: pacienteNomeForm.trim() ? pacienteNomeForm.trim().toUpperCase() : undefined,
      pacienteTelefone: pacienteTelefoneForm.trim() || undefined,
      status: statusForm,
      observacoes: observacoesForm.trim() || undefined
    };

    let novaLista: ItemAgendaCompromisso[];
    if (itemEditando) {
      novaLista = compromissos.map((c) => (c.id === itemEditando.id ? itemProcessado : c));
    } else {
      novaLista = [itemProcessado, ...compromissos];
    }

    salvarCompromissosECloud(novaLista);
    setModalAberto(false);
  };

  const handleExcluirCompromisso = (id: string) => {
    const novaLista = compromissos.filter((c) => c.id !== id);
    salvarCompromissosECloud(novaLista);
    setItemExcluindoId(null);
  };

  const formatarDataFormatada = (dataIso: string) => {
    const partes = dataIso.split('-');
    if (partes.length !== 3) return dataIso;
    const date = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
    const semana = date.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase();
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const ano = date.getFullYear();
    return `${dia}/${mes}/${ano} (${semana})`;
  };

  return (
    <div className="w-full max-w-full space-y-6 font-sans">
      
      {/* 1. TOP HEADER DA AGENDA */}
      <div className={`p-4 sm:p-6 lg:p-8 rounded-3xl border shadow-xl space-y-6 w-full ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
      }`}>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-500/10 text-teal-400 rounded-2xl border border-teal-500/20 shadow-sm">
              <CalendarIcon className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-md border border-teal-500/20">
                Organização do Dia & Compromissos
              </span>
              <h2 className="text-xl font-extrabold mt-0.5 flex items-center gap-2">
                Agenda de Tarefas & Responsabilidades Familiares
              </h2>
            </div>
          </div>

          {/* Navegação por Datas */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-950/40 p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={handleDataAnterior}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Dia Anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={handleHoje}
              className="px-3 py-1.5 rounded-xl bg-teal-600/20 text-teal-300 border border-teal-500/30 text-xs font-extrabold hover:bg-teal-600 hover:text-white transition-all cursor-pointer"
            >
              Hoje
            </button>

            <input
              type="date"
              value={dataSelecionada}
              onChange={(e) => {
                setDataSelecionada(e.target.value);
                setFiltroPeriodo('todos');
              }}
              className={`p-1.5 rounded-xl border text-xs font-extrabold ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
              }`}
            />

            <button
              onClick={handleProximaData}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Próximo Dia"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Botão Novo Agendamento */}
          <button
            onClick={() => handleAbrirNovoModal()}
            className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-extrabold px-5 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-teal-500/25 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4.5 h-4.5" /> + Novo Compromisso
          </button>
        </div>

        {/* Linha 2: Seletor de Visão (Com TABELA em Destaque Inicial Padrão) + Filtros */}
        <div className="pt-4 border-t border-slate-800/40 flex flex-wrap items-center justify-between gap-4">
          
          {/* Alternador de Visão (Tabela por Padrão) */}
          <div className="flex items-center gap-1 bg-slate-950/50 p-1 rounded-2xl border border-slate-800">
            {[
              { id: 'tabela', label: 'Tabela Padrão', icon: ListIcon },
              { id: 'dia', label: 'Grade Diária', icon: Grid },
              { id: 'semana', label: 'Visão Semanal', icon: CalendarDays },
              { id: 'mes', label: 'Calendário Mensal', icon: CalendarIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setVisualizacao(tab.id as TipoVisualizacao)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                  visualizacao === tab.id
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md font-extrabold scale-102'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Filtros Rápidos */}
          <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
            {/* Filtro Período */}
            <select
              value={filtroPeriodo}
              onChange={(e) => setFiltroPeriodo(e.target.value as any)}
              className={`p-2.5 rounded-xl border text-xs font-bold ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="todos">Todas as Datas</option>
              <option value="hoje">Apenas Hoje</option>
              <option value="semana">Próximos 7 Dias</option>
              <option value="mes">Este Mês</option>
            </select>

            {/* Filtro Categoria */}
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className={`p-2.5 rounded-xl border text-xs font-bold ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="Todas">Todas as Categorias</option>
              <option value="Responsabilidade Familiar">👨‍👩‍👧‍👦 Responsabilidade Familiar</option>
              <option value="Profissional / Clínica">💼 Profissional / Clínica</option>
              <option value="Compromisso Financeiro">💰 Compromisso Financeiro</option>
              <option value="Pessoal / Saúde">⭐ Pessoal / Saúde</option>
              <option value="Outro">Outro</option>
            </select>

            {/* Filtro Status */}
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className={`p-2.5 rounded-xl border text-xs font-bold ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="Todos">Todos os Status</option>
              <option value="Agendado">Agendado</option>
              <option value="Confirmado">Confirmado</option>
              <option value="Em Atendimento">Em Atendimento</option>
              <option value="Finalizado">Concluído</option>
              <option value="Cancelado">Cancelado</option>
            </select>

            {/* Campo Busca */}
            <div className="relative flex-1 sm:w-60 min-w-[180px]">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar compromisso ou paciente..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs font-medium ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              />
            </div>
          </div>

        </div>

      </div>

      {/* 2. SUMMARY CARDS KPIS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-4 rounded-2xl border shadow-sm flex items-center justify-between ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Registrado</span>
            <h4 className="text-xl font-extrabold text-teal-400 mt-0.5">{totalCompromissos} Tarefas</h4>
          </div>
          <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
            <CalendarIcon className="w-5 h-5" />
          </div>
        </div>

        <div className={`p-4 rounded-2xl border shadow-sm flex items-center justify-between ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">Familiar & Casa</span>
            <h4 className="text-xl font-extrabold text-purple-300 mt-0.5">{familiaresCount} Tarefas</h4>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
            <HeartHandshake className="w-5 h-5" />
          </div>
        </div>

        <div className={`p-4 rounded-2xl border shadow-sm flex items-center justify-between ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">Profissional</span>
            <h4 className="text-xl font-extrabold text-sky-300 mt-0.5">{profissionaisCount} Consultas</h4>
          </div>
          <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

        <div className={`p-4 rounded-2xl border shadow-sm flex items-center justify-between ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Concluídos</span>
            <h4 className="text-xl font-extrabold text-emerald-300 mt-0.5">{concluidosCount} Finalizados</h4>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. EXIBIÇÃO EM TABELA PADRÃO (CONFORME SOLICITADO PELO USUÁRIO) */}
      {visualizacao === 'tabela' && (
        <div className={`p-4 sm:p-6 lg:p-8 rounded-3xl border shadow-xl space-y-4 w-full ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="flex items-center justify-between border-b border-slate-800/40 pb-3">
            <h3 className="font-extrabold text-base flex items-center gap-2 text-teal-400">
              <ListIcon className="w-5 h-5 text-teal-400" /> Tabela de Agendamentos & Compromissos ({compromissosOrdenados.length})
            </h3>

            <span className="text-xs font-bold text-slate-400 bg-slate-800/60 px-3 py-1 rounded-full border border-slate-700">
              Ordenado por Data e Horário
            </span>
          </div>

          {compromissosOrdenados.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-extrabold uppercase">
                    <th className="p-3">Data</th>
                    <th className="p-3">Horário</th>
                    <th className="p-3">Compromisso / Descrição</th>
                    <th className="p-3">Categoria</th>
                    <th className="p-3">Responsável</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 font-medium">
                  {compromissosOrdenados.map((item) => {
                    const cor = statusCores[item.status] || statusCores['Agendado'];
                    const catInfo = categoriaBadges[item.categoria] || categoriaBadges['Outro'];
                    const CatIcon = catInfo.icon;
                    const isConcluido = item.status === 'Finalizado';

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          isConcluido
                            ? 'opacity-70 bg-slate-950/40 hover:bg-slate-900/60'
                            : 'hover:bg-slate-800/40'
                        }`}
                      >
                        {/* Data */}
                        <td className="p-3 font-extrabold whitespace-nowrap text-teal-300">
                          {formatarDataFormatada(item.data)}
                        </td>

                        {/* Horário */}
                        <td className="p-3 font-bold whitespace-nowrap">
                          <span className="bg-slate-800 px-2 py-1 rounded-md border border-slate-700 font-mono text-slate-200">
                            {item.horario} ({item.duracaoMinutos}m)
                          </span>
                        </td>

                        {/* Compromisso / Descrição */}
                        <td className="p-3">
                          <div className={`font-bold text-sm ${isConcluido ? 'line-through text-slate-400' : 'text-slate-100'}`}>
                            {item.titulo}
                          </div>
                          {item.observacoes && (
                            <div className="text-[11px] text-slate-400 italic mt-0.5">
                              {item.observacoes}
                            </div>
                          )}
                        </td>

                        {/* Categoria */}
                        <td className="p-3 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border flex items-center gap-1.5 w-fit ${catInfo.badge}`}>
                            <CatIcon className="w-3.5 h-3.5" />
                            {item.categoria}
                          </span>
                        </td>

                        {/* Responsável */}
                        <td className="p-3 whitespace-nowrap font-bold text-slate-300">
                          {item.responsavel}
                        </td>

                        {/* Status */}
                        <td className="p-3 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${cor.badge}`}>
                            {item.status === 'Finalizado' ? '✓ Concluído' : item.status}
                          </span>
                        </td>

                        {/* Ações */}
                        <td className="p-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {/* Botão de Concluir Rápido em 1 Clique */}
                            <button
                              onClick={() => handleAlternarStatusConcluido(item)}
                              className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                                isConcluido
                                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30'
                                  : 'bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-400 border-slate-700'
                              }`}
                              title={isConcluido ? 'Marcar como Pendente' : 'Marcar como Concluído'}
                            >
                              <Check className="w-4 h-4" />
                            </button>

                            {/* WhatsApp se houver telefone do paciente */}
                            {item.pacienteTelefone && (
                              <a
                                href={`https://wa.me/55${item.pacienteTelefone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 bg-slate-800 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-xl border border-slate-700 transition-colors"
                                title="WhatsApp"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </a>
                            )}

                            {/* Editar */}
                            <button
                              onClick={() => handleAbrirEditarModal(item)}
                              className="p-1.5 bg-slate-800 hover:bg-sky-600 text-sky-400 hover:text-white rounded-xl border border-slate-700 transition-colors cursor-pointer"
                              title="Editar Compromisso"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* Excluir */}
                            <button
                              onClick={() => setItemExcluindoId(item.id)}
                              className="p-1.5 bg-slate-800 hover:bg-rose-600 text-rose-400 hover:text-white rounded-xl border border-slate-700 transition-colors cursor-pointer"
                              title="Excluir Compromisso"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 space-y-3 bg-slate-950/40 rounded-2xl border border-slate-800">
              <CalendarIcon className="w-10 h-10 text-slate-500 mx-auto" />
              <h4 className="font-bold text-sm text-slate-300">Nenhum compromisso encontrado para os filtros selecionados.</h4>
              <p className="text-xs text-slate-400">Clique no botão acima para adicionar um novo compromisso pessoal, familiar ou profissional.</p>
            </div>
          )}
        </div>
      )}

      {/* 4. OUTRAS VISUALIZAÇÕES AUXILIARES (GRADE DIÁRIA, SEMANAL, MÊS) */}
      {visualizacao === 'dia' && (
        <div className={`p-4 sm:p-6 lg:p-8 rounded-3xl border shadow-xl overflow-x-auto w-full ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="space-y-3 min-w-[650px]">
            {HORARIOS_DIA.map((horaSlot) => {
              const itensHora = compromissosFiltrados.filter((c) => c.data === dataSelecionada && c.horario.substring(0, 2) === horaSlot.substring(0, 2));

              return (
                <div key={horaSlot} className="flex gap-4 border-b border-slate-800/30 pb-3 items-start min-h-[70px]">
                  <div className="w-16 font-extrabold text-sm text-slate-400 pt-1 shrink-0">{horaSlot}</div>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {itensHora.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => handleAbrirEditarModal(c)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer shadow-md flex items-center justify-between ${statusCores[c.status].bg} ${statusCores[c.status].border}`}
                      >
                        <div>
                          <span className="text-[10px] font-extrabold text-teal-400">{c.horario} • {c.categoria}</span>
                          <h4 className="font-bold text-xs text-white">{c.titulo}</h4>
                          <span className="text-[10px] text-slate-400 block">{c.responsavel}</span>
                        </div>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${statusCores[c.status].badge}`}>
                          {c.status}
                        </span>
                      </div>
                    ))}
                    {itensHora.length === 0 && (
                      <button
                        onClick={() => handleAbrirNovoModal(horaSlot)}
                        className="py-2.5 px-3 rounded-xl border border-dashed border-slate-800 hover:border-teal-500/50 hover:bg-teal-500/5 text-slate-500 hover:text-teal-400 text-xs font-bold transition-all text-left"
                      >
                        + Agendar às {horaSlot}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {visualizacao === 'semana' && (
        <div className={`p-4 sm:p-6 lg:p-8 rounded-3xl border shadow-xl overflow-x-auto w-full ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="grid grid-cols-7 gap-3 min-w-[850px]">
            {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((diaNome) => (
              <div key={diaNome} className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 space-y-3 min-h-[350px]">
                <div className="border-b border-slate-800 pb-2 text-center">
                  <span className="font-extrabold text-xs text-teal-400">{diaNome}</span>
                </div>
                <div className="space-y-2">
                  {compromissosFiltrados.slice(0, 5).map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleAbrirEditarModal(c)}
                      className={`p-2 rounded-xl border text-[11px] font-bold cursor-pointer ${statusCores[c.status].bg} ${statusCores[c.status].border}`}
                    >
                      <div className="text-[10px] text-teal-300">{c.horario}</div>
                      <div className="truncate text-white">{c.titulo}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {visualizacao === 'mes' && (
        <div className={`p-4 sm:p-6 lg:p-8 rounded-3xl border shadow-xl w-full ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-extrabold text-teal-400 mb-3">
            <span>DOM</span><span>SEG</span><span>TER</span><span>QUA</span><span>QUI</span><span>SEX</span><span>SÁB</span>
          </div>

          <div className="grid grid-cols-7 gap-2.5">
            {Array.from({ length: 31 }, (_, i) => i + 1).map((diaNum) => {
              const prefixoAnoMes = dataSelecionada.substring(0, 7);
              const dataStr = `${prefixoAnoMes}-${diaNum < 10 ? '0' + diaNum : diaNum}`;
              const countDia = compromissos.filter((c) => c.data === dataStr).length;
              const isSelected = dataSelecionada === dataStr;

              return (
                <button
                  key={diaNum}
                  onClick={() => {
                    setDataSelecionada(dataStr);
                    setVisualizacao('tabela');
                  }}
                  className={`min-h-[85px] p-2.5 rounded-2xl border flex flex-col justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-teal-600 text-white border-teal-400 ring-2 ring-teal-400'
                      : darkMode
                      ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="font-extrabold text-xs">{diaNum}</span>
                  {countDia > 0 && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      {countDia} tarefas
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL CADASTRAR / EDITAR COMPROMISSO */}
      {modalAberto && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className={`rounded-3xl p-6 max-w-lg w-full shadow-2xl border space-y-4 my-8 ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-800/40 pb-3">
              <h3 className="text-lg font-extrabold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-400" />
                {itemEditando ? 'Editar Compromisso' : 'Novo Agendamento / Compromisso'}
              </h3>
              <button onClick={() => setModalAberto(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              
              {/* Título do Compromisso */}
              <div>
                <label className="block font-bold text-slate-400 mb-1">Título / Descrição do Compromisso</label>
                <input
                  type="text"
                  placeholder="Ex: Levar filhos na natação, Consulta Odontológica..."
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  required
                  autoFocus
                  className={`w-full p-3 rounded-xl border font-bold ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>

              {/* Categoria & Responsável */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 mb-1">Categoria do Compromisso</label>
                  <select
                    value={categoriaForm}
                    onChange={(e) => setCategoriaForm(e.target.value as CategoriaAgenda)}
                    className={`w-full p-2.5 rounded-xl border font-bold ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <option value="Responsabilidade Familiar">👨‍👩‍👧‍👦 Responsabilidade Familiar</option>
                    <option value="Profissional / Clínica">💼 Profissional / Clínica</option>
                    <option value="Compromisso Financeiro">💰 Compromisso Financeiro</option>
                    <option value="Pessoal / Saúde">⭐ Pessoal / Saúde</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-400 mb-1">Responsável / Envolvido</label>
                  <input
                    type="text"
                    placeholder="Ex: Fernando, Bernardo, Família..."
                    value={responsavelForm}
                    onChange={(e) => setResponsavelForm(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border font-bold ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              {/* Data, Horário e Duração */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-400 mb-1">Data</label>
                  <input
                    type="date"
                    value={dataForm}
                    onChange={(e) => setDataForm(e.target.value)}
                    required
                    className={`w-full p-2.5 rounded-xl border font-bold ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-400 mb-1">Horário</label>
                  <input
                    type="time"
                    value={horarioForm}
                    onChange={(e) => setHorarioForm(e.target.value)}
                    required
                    className={`w-full p-2.5 rounded-xl border font-bold ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-400 mb-1">Duração</label>
                  <select
                    value={duracaoForm}
                    onChange={(e) => setDuracaoForm(Number(e.target.value))}
                    className={`w-full p-2.5 rounded-xl border font-bold ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <option value={15}>15 min</option>
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>1 hora</option>
                    <option value={90}>1h 30m</option>
                    <option value={120}>2 horas</option>
                  </select>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block font-bold text-slate-400 mb-1">Status do Agendamento</label>
                <select
                  value={statusForm}
                  onChange={(e) => setStatusForm(e.target.value as StatusConsulta)}
                  className={`w-full p-2.5 rounded-xl border font-bold ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <option value="Agendado">Agendado</option>
                  <option value="Confirmado">Confirmado</option>
                  <option value="Em Atendimento">Em Atendimento / Em Andamento</option>
                  <option value="Finalizado">Concluído / Finalizado</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </div>

              {/* Observações */}
              <div>
                <label className="block font-bold text-slate-400 mb-1">Observações Adicionais</label>
                <textarea
                  rows={2}
                  placeholder="Anotações extras sobre o compromisso..."
                  value={observacoesForm}
                  onChange={(e) => setObservacoesForm(e.target.value)}
                  className={`w-full p-2.5 rounded-xl border ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
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
                  className="px-5 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-extrabold rounded-xl shadow-lg shadow-teal-500/30 cursor-pointer"
                >
                  {itemEditando ? 'Salvar Alterações' : 'Confirmar Agendamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EXCLUSÃO */}
      {itemExcluindoId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-3xl p-6 max-w-md w-full shadow-2xl border space-y-4 ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center gap-3 text-rose-500">
              <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base">Excluir Compromisso</h3>
                <p className="text-xs text-slate-400">Esta ação não poderá ser desfeita.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 bg-slate-800/50 p-3 rounded-2xl border border-slate-700">
              Tem certeza de que deseja remover este compromisso da sua agenda?
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setItemExcluindoId(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => handleExcluirCompromisso(itemExcluindoId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

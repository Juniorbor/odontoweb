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
  X,
  Check,
  Menu
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

type TipoVisualizacao = 'mes' | 'semana' | 'dia' | 'agenda';

const categoriasConfig: Record<CategoriaAgenda, { label: string; bg: string; text: string; border: string; hex: string; dotColor: string }> = {
  'Responsabilidade Familiar': {
    label: 'Responsabilidade Familiar',
    bg: 'bg-purple-500/15 hover:bg-purple-500/25',
    text: 'text-purple-300',
    border: 'border-purple-500/40',
    hex: '#A855F7',
    dotColor: 'bg-purple-500'
  },
  'Profissional / Clínica': {
    label: 'Profissional / Clínica',
    bg: 'bg-teal-500/15 hover:bg-teal-500/25',
    text: 'text-teal-300',
    border: 'border-teal-500/40',
    hex: '#14B8A6',
    dotColor: 'bg-teal-500'
  },
  'Compromisso Financeiro': {
    label: 'Compromisso Financeiro',
    bg: 'bg-amber-500/15 hover:bg-amber-500/25',
    text: 'text-amber-300',
    border: 'border-amber-500/40',
    hex: '#F59E0B',
    dotColor: 'bg-amber-500'
  },
  'Pessoal / Saúde': {
    label: 'Pessoal / Saúde',
    bg: 'bg-sky-500/15 hover:bg-sky-500/25',
    text: 'text-sky-300',
    border: 'border-sky-500/40',
    hex: '#0EA5E9',
    dotColor: 'bg-sky-500'
  },
  'Outro': {
    label: 'Outro',
    bg: 'bg-slate-700/40 hover:bg-slate-700/60',
    text: 'text-slate-300',
    border: 'border-slate-600',
    hex: '#64748B',
    dotColor: 'bg-slate-400'
  }
};

const HORARIOS_DIA = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
  '19:00', '20:00'
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

  // Compromissos com salvamento local & nuvem
  const [compromissos, setCompromissos] = useState<ItemAgendaCompromisso[]>(() => {
    return getItemJSON<ItemAgendaCompromisso[]>(AGENDA_STORAGE_KEY, INITIAL_MOCK_COMPROMISSOS);
  });

  const salvarCompromissosECloud = (novos: ItemAgendaCompromisso[]) => {
    setCompromissos(novos);
    localStorage.setItem(AGENDA_STORAGE_KEY, JSON.stringify(novos));
    localStorage.setItem('odonto_agenda_compromissos_v1', JSON.stringify(novos));
    pushToCloud({ consultas: novos as any }, usuarioId);
  };

  // Visão Estilo Google Calendar (Mês por Padrão)
  const [visualizacao, setVisualizacao] = useState<TipoVisualizacao>('mes');
  const [dataSelecionada, setDataSelecionada] = useState<string>(getHojeIso());
  const [miniCalData, setMiniCalData] = useState<Date>(new Date());
  const [busca, setBusca] = useState<string>('');
  const [mostrarPainelEsquerdo, setMostrarPainelEsquerdo] = useState<boolean>(true);

  // Filtros por Categoria (Checkboxes Estilo Google Calendar)
  const [categoriasAtivas, setCategoriasAtivas] = useState<Record<CategoriaAgenda, boolean>>({
    'Responsabilidade Familiar': true,
    'Profissional / Clínica': true,
    'Compromisso Financeiro': true,
    'Pessoal / Saúde': true,
    'Outro': true
  });

  const toggleCategoria = (cat: CategoriaAgenda) => {
    setCategoriasAtivas((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  // States dos Modais de Criação / Edição estilo Google Calendar
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

  // Objeto de data atual em foco
  const dateFoco = new Date(dataSelecionada + 'T00:00:00');

  // Navegação de Datas no Estilo Google Calendar
  const handleHoje = () => {
    const hoje = getHojeIso();
    setDataSelecionada(hoje);
    setMiniCalData(new Date());
  };

  const handleNavegarData = (direcao: 'anterior' | 'proximo') => {
    const d = new Date(dataSelecionada + 'T00:00:00');
    if (visualizacao === 'mes') {
      d.setMonth(d.getMonth() + (direcao === 'proximo' ? 1 : -1));
    } else if (visualizacao === 'semana') {
      d.setDate(d.getDate() + (direcao === 'proximo' ? 7 : -7));
    } else {
      d.setDate(d.getDate() + (direcao === 'proximo' ? 1 : -1));
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const novaIso = `${year}-${month}-${day}`;
    setDataSelecionada(novaIso);
    setMiniCalData(d);
  };

  // Titulo dinâmico do Header estilo Google Calendar (ex: "Setembro de 2026")
  const getHeaderTitle = () => {
    const mesNome = dateFoco.toLocaleDateString('pt-BR', { month: 'long' });
    const mesCap = mesNome.charAt(0).toUpperCase() + mesNome.slice(1);
    const ano = dateFoco.getFullYear();
    return `${mesCap} de ${ano}`;
  };

  // Filtro de compromissos pelas categorias ativas e busca
  const compromissosFiltrados = compromissos.filter((item) => {
    const catAtiva = categoriasAtivas[item.categoria] ?? true;
    const atendeBusca =
      !busca ||
      item.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      (item.pacienteNome && item.pacienteNome.toLowerCase().includes(busca.toLowerCase())) ||
      (item.responsavel && item.responsavel.toLowerCase().includes(busca.toLowerCase())) ||
      (item.observacoes && item.observacoes.toLowerCase().includes(busca.toLowerCase()));

    return catAtiva && atendeBusca;
  });

  // Handlers de Criação / Edição estilo Google Calendar
  const handleAbrirNovoModal = (dataPref?: string, horaPref = '09:00', catPref: CategoriaAgenda = 'Profissional / Clínica') => {
    setItemEditando(null);
    setTitulo('');
    setDataForm(dataPref || dataSelecionada || getHojeIso());
    setHorarioForm(horaPref);
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

  const handleAlternarStatusConcluido = (item: ItemAgendaCompromisso, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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

  // Gerador da Grade do Mês no Estilo Google Calendar (7 colunas x 5/6 semanas)
  const getDiasDoMesGrid = () => {
    const ano = dateFoco.getFullYear();
    const mes = dateFoco.getMonth();
    const primeiroDiaMes = new Date(ano, mes, 1);
    const ultimoDiaMes = new Date(ano, mes + 1, 0);

    const diaSemanaInicio = primeiroDiaMes.getDay(); // 0 = Domingo
    const totalDiasMes = ultimoDiaMes.getDate();

    const diasGrid: { dataIso: string; numeroDia: number; eMesAtual: boolean; eHoje: boolean }[] = [];
    const hojeIso = getHojeIso();

    // Dias do mês anterior para preencher a primeira semana
    const mesAnteriorUltimoDia = new Date(ano, mes, 0).getDate();
    for (let i = diaSemanaInicio - 1; i >= 0; i--) {
      const num = mesAnteriorUltimoDia - i;
      const dAnterior = new Date(ano, mes - 1, num);
      const iso = dAnterior.toISOString().split('T')[0];
      diasGrid.push({ dataIso: iso, numeroDia: num, eMesAtual: false, eHoje: iso === hojeIso });
    }

    // Dias do mês atual
    for (let i = 1; i <= totalDiasMes; i++) {
      const mStr = String(mes + 1).padStart(2, '0');
      const dStr = String(i).padStart(2, '0');
      const iso = `${ano}-${mStr}-${dStr}`;
      diasGrid.push({ dataIso: iso, numeroDia: i, eMesAtual: true, eHoje: iso === hojeIso });
    }

    // Dias do próximo mês para fechar a grade (completar múltiplos de 7)
    const restante = 42 - diasGrid.length;
    for (let i = 1; i <= restante; i++) {
      const dProximo = new Date(ano, mes + 1, i);
      const iso = dProximo.toISOString().split('T')[0];
      diasGrid.push({ dataIso: iso, numeroDia: i, eMesAtual: false, eHoje: iso === hojeIso });
    }

    return diasGrid;
  };

  // Helper para renderizar os dias do Mini-Calendário na barra lateral
  const getMiniCalendarGrid = () => {
    const ano = miniCalData.getFullYear();
    const mes = miniCalData.getMonth();
    const primeiroDia = new Date(ano, mes, 1).getDay();
    const ultimoDia = new Date(ano, mes + 1, 0).getDate();
    const hojeIso = getHojeIso();

    const dias: { num: number; iso: string; eAtual: boolean; eHoje: boolean; eSelecionado: boolean }[] = [];

    // Mês anterior
    const mesAntUltimo = new Date(ano, mes, 0).getDate();
    for (let i = primeiroDia - 1; i >= 0; i--) {
      const d = mesAntUltimo - i;
      const iso = new Date(ano, mes - 1, d).toISOString().split('T')[0];
      dias.push({ num: d, iso, eAtual: false, eHoje: iso === hojeIso, eSelecionado: iso === dataSelecionada });
    }

    // Mês Atual
    for (let i = 1; i <= ultimoDia; i++) {
      const mStr = String(mes + 1).padStart(2, '0');
      const dStr = String(i).padStart(2, '0');
      const iso = `${ano}-${mStr}-${dStr}`;
      dias.push({ num: i, iso, eAtual: true, eHoje: iso === hojeIso, eSelecionado: iso === dataSelecionada });
    }

    return dias;
  };

  return (
    <div className="w-full max-w-full font-sans text-slate-200 select-none flex flex-col h-[calc(100vh-6rem)]">
      
      {/* 1. GOOGLE CALENDAR HEADER BAR */}
      <div className={`px-4 py-3 rounded-t-3xl border border-b-0 flex flex-wrap items-center justify-between gap-3 ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        
        {/* Esquerda: Menu Icon + Logo + Botão "+ Criar" Google Style */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMostrarPainelEsquerdo(!mostrarPainelEsquerdo)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Alternar Painel Lateral"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo Estilo Google Calendar */}
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 p-0.5 flex items-center justify-center text-white font-black text-sm shadow-md">
              <CalendarIcon className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
              Google <span className="text-teal-400 font-normal">Calendar</span>
            </span>
          </div>

          {/* Botão "+ Criar" Flutuante Estilo Google */}
          <button
            onClick={() => handleAbrirNovoModal()}
            className="ml-2 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-extrabold px-4 py-2 rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-teal-500/20 transition-all cursor-pointer hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>+ Criar</span>
          </button>

          {/* Botão "Hoje" */}
          <button
            onClick={handleHoje}
            className="px-3.5 py-1.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Hoje
          </button>

          {/* Setas de Navegação */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleNavegarData('anterior')}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleNavegarData('proximo')}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Mês & Ano Corrente (ex: "Setembro de 2026") */}
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white capitalize ml-1">
            {getHeaderTitle()}
          </h2>
        </div>

        {/* Direita: Busca + Seletor de Visão (Mês, Semana, Dia, Agenda) */}
        <div className="flex items-center gap-3">
          {/* Campo Busca */}
          <div className="relative w-48 sm:w-60">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className={`w-full pl-9 pr-3 py-1.5 rounded-xl border text-xs font-medium ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            />
          </div>

          {/* Dropdown de Visão (Mês, Semana, Dia, Agenda) */}
          <div className="flex items-center bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            {[
              { id: 'mes', label: 'Mês' },
              { id: 'semana', label: 'Semana' },
              { id: 'dia', label: 'Dia' },
              { id: 'agenda', label: 'Agenda' }
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => setVisualizacao(v.id as TipoVisualizacao)}
                className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  visualizacao === v.id
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* 2. BODY PRINCIPAL: PAINEL ESQUERDO (MINI CALENDÁRIO + CHECKBOXES) + GRADE GOOGLE CALENDAR */}
      <div className="flex-1 flex overflow-hidden border border-t-0 rounded-b-3xl shadow-2xl relative">
        
        {/* A) PAINEL LATERAL ESQUERDO (MINI CALENDÁRIO + MINHAS AGENDAS) */}
        {mostrarPainelEsquerdo && (
          <div className={`w-64 border-r p-4 flex flex-col gap-5 overflow-y-auto shrink-0 transition-all ${
            darkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}>
            
            {/* MINI CALENDÁRIO GOOGLE STYLE */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-extrabold text-slate-300 capitalize">
                  {miniCalData.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      const d = new Date(miniCalData);
                      d.setMonth(d.getMonth() - 1);
                      setMiniCalData(d);
                    }}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      const d = new Date(miniCalData);
                      d.setMonth(d.getMonth() + 1);
                      setMiniCalData(d);
                    }}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Dias da semana mini */}
              <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400">
                <span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span>
              </div>

              {/* Grid 7x5 mini */}
              <div className="grid grid-cols-7 text-center text-xs gap-y-1">
                {getMiniCalendarGrid().map((dia, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setDataSelecionada(dia.iso);
                    }}
                    className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-[11px] font-bold transition-all cursor-pointer ${
                      dia.eSelecionado
                        ? 'bg-teal-600 text-white font-extrabold ring-2 ring-teal-400'
                        : dia.eHoje
                        ? 'bg-teal-500/20 text-teal-400 font-extrabold border border-teal-500/40'
                        : dia.eAtual
                        ? 'text-slate-200 hover:bg-slate-800'
                        : 'text-slate-600 hover:bg-slate-800/40'
                    }`}
                  >
                    {dia.num}
                  </button>
                ))}
              </div>
            </div>

            {/* SEÇÃO "MINHAS AGENDAS" (CHECKBOXES DE CATEGORIAS ESTILO GOOGLE CALENDAR) */}
            <div className="border-t border-slate-800/60 pt-4 space-y-3">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block px-1">
                Minhas Agendas
              </span>

              <div className="space-y-2 text-xs font-semibold">
                {(Object.keys(categoriasConfig) as CategoriaAgenda[]).map((cat) => {
                  const cfg = categoriasConfig[cat];
                  const ativa = categoriasAtivas[cat];

                  return (
                    <label
                      key={cat}
                      className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={ativa}
                        onChange={() => toggleCategoria(cat)}
                        className="w-4 h-4 rounded border-slate-700 accent-teal-500 cursor-pointer"
                      />
                      <span className={`w-2.5 h-2.5 rounded-full ${cfg.dotColor} shrink-0`}></span>
                      <span className="truncate text-slate-200">{cfg.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* B) CANVAS GOOGLE CALENDAR (VISÃO MÊS, SEMANA, DIA, AGENDA) */}
        <div className={`flex-1 flex flex-col overflow-y-auto ${
          darkMode ? 'bg-slate-900' : 'bg-white text-slate-800'
        }`}>
          
          {/* VISÃO MÊS (GRADE 7 COLUNAS GOOGLE CALENDAR) */}
          {visualizacao === 'mes' && (
            <div className="flex-1 flex flex-col h-full">
              
              {/* Header dias da semana (Dom, Seg, Ter, Qua, Qui, Sex, Sáb) */}
              <div className="grid grid-cols-7 border-b border-slate-800/60 text-center py-2 text-xs font-extrabold text-slate-400 bg-slate-950/40">
                <span>DOM</span><span>SEG</span><span>TER</span><span>QUA</span><span>QUI</span><span>SEX</span><span>SÁB</span>
              </div>

              {/* Grid 7 colunas x 6 semanas */}
              <div className="flex-1 grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-800/50 min-h-[550px]">
                {getDiasDoMesGrid().map((diaObj, idx) => {
                  const compromissosDoDia = compromissosFiltrados.filter((c) => c.data === diaObj.dataIso);

                  return (
                    <div
                      key={idx}
                      onClick={() => handleAbrirNovoModal(diaObj.dataIso)}
                      className={`p-1.5 flex flex-col justify-between transition-colors min-h-[95px] relative group cursor-pointer ${
                        diaObj.eMesAtual
                          ? 'bg-transparent hover:bg-slate-800/20'
                          : darkMode ? 'bg-slate-950/40 text-slate-600' : 'bg-slate-50 text-slate-400'
                      }`}
                    >
                      {/* Top do Cell com número do Dia */}
                      <div className="flex justify-between items-center px-1">
                        <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                          diaObj.eHoje
                            ? 'bg-teal-600 text-white font-black shadow-md'
                            : diaObj.dataIso === dataSelecionada
                            ? 'bg-slate-800 text-teal-400 font-extrabold border border-teal-500/40'
                            : 'text-slate-300'
                        }`}>
                          {diaObj.numeroDia}
                        </span>

                        <span className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-teal-400 transition-opacity">
                          <Plus className="w-3.5 h-3.5" />
                        </span>
                      </div>

                      {/* Event Cards Pílulas dentro do Dia Estilo Google */}
                      <div className="space-y-1 overflow-hidden my-1 flex-1">
                        {compromissosDoDia.slice(0, 3).map((item) => {
                          const cfg = categoriasConfig[item.categoria] || categoriasConfig['Outro'];
                          const isConcluido = item.status === 'Finalizado';

                          return (
                            <div
                              key={item.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAbrirEditarModal(item);
                              }}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border truncate flex items-center justify-between transition-all hover:scale-[1.02] shadow-sm ${cfg.bg} ${cfg.border} ${cfg.text}`}
                              title={`${item.horario} - ${item.titulo} (${item.categoria})`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor} shrink-0`}></span>
                                <span className={`truncate ${isConcluido ? 'line-through opacity-60' : ''}`}>
                                  {item.horario} {item.titulo}
                                </span>
                              </div>

                              <button
                                onClick={(e) => handleAlternarStatusConcluido(item, e)}
                                className="p-0.5 hover:text-emerald-300 text-slate-400 shrink-0"
                                title={isConcluido ? 'Marcar Pendente' : 'Concluir'}
                              >
                                <Check className={`w-3 h-3 ${isConcluido ? 'text-emerald-400' : ''}`} />
                              </button>
                            </div>
                          );
                        })}

                        {compromissosDoDia.length > 3 && (
                          <span className="text-[9px] font-extrabold text-teal-400 block px-1">
                            +{compromissosDoDia.length - 3} mais
                          </span>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* VISÃO SEMANA */}
          {visualizacao === 'semana' && (
            <div className="p-4 overflow-x-auto">
              <div className="grid grid-cols-7 gap-3 min-w-[850px]">
                {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((diaNome) => (
                  <div key={diaNome} className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800 space-y-3 min-h-[450px]">
                    <div className="border-b border-slate-800 pb-2 text-center">
                      <span className="font-extrabold text-xs text-teal-400">{diaNome}</span>
                    </div>
                    <div className="space-y-2">
                      {compromissosFiltrados.slice(0, 6).map((item) => {
                        const cfg = categoriasConfig[item.categoria] || categoriasConfig['Outro'];
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleAbrirEditarModal(item)}
                            className={`p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all hover:scale-102 ${cfg.bg} ${cfg.border} ${cfg.text}`}
                          >
                            <div className="text-[10px] text-teal-300">{item.horario} • {item.categoria}</div>
                            <div className="truncate text-white">{item.titulo}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VISÃO DIA */}
          {visualizacao === 'dia' && (
            <div className="p-6 space-y-3">
              <h3 className="text-sm font-extrabold text-teal-400 mb-4">Grade Horária do Dia: {dataSelecionada}</h3>
              {HORARIOS_DIA.map((hora) => {
                const itensHora = compromissosFiltrados.filter((c) => c.data === dataSelecionada && c.horario.substring(0, 2) === hora.substring(0, 2));

                return (
                  <div key={hora} className="flex gap-4 border-b border-slate-800/40 pb-3 items-start min-h-[60px]">
                    <span className="w-16 font-extrabold text-xs text-slate-400 pt-1">{hora}</span>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {itensHora.map((item) => {
                        const cfg = categoriasConfig[item.categoria] || categoriasConfig['Outro'];
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleAbrirEditarModal(item)}
                            className={`p-3 rounded-2xl border cursor-pointer flex justify-between items-center ${cfg.bg} ${cfg.border}`}
                          >
                            <div>
                              <span className="text-[10px] font-extrabold text-teal-300">{item.horario} • {item.categoria}</span>
                              <h4 className="font-bold text-xs text-white">{item.titulo}</h4>
                            </div>
                            <button
                              onClick={(e) => handleAlternarStatusConcluido(item, e)}
                              className="p-1 hover:text-emerald-400 text-slate-400"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                      {itensHora.length === 0 && (
                        <button
                          onClick={() => handleAbrirNovoModal(dataSelecionada, hora)}
                          className="py-2 px-3 rounded-xl border border-dashed border-slate-800 text-slate-500 hover:text-teal-400 text-xs font-bold text-left"
                        >
                          + Agendar às {hora}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VISÃO AGENDA / LISTA */}
          {visualizacao === 'agenda' && (
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-extrabold uppercase">
                      <th className="p-3">Data</th>
                      <th className="p-3">Horário</th>
                      <th className="p-3">Compromisso</th>
                      <th className="p-3">Categoria</th>
                      <th className="p-3">Responsável</th>
                      <th className="p-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {compromissosFiltrados.map((item) => {
                      const cfg = categoriasConfig[item.categoria] || categoriasConfig['Outro'];
                      return (
                        <tr key={item.id} className="hover:bg-slate-800/40">
                          <td className="p-3 font-bold text-teal-400">{item.data}</td>
                          <td className="p-3 font-bold">{item.horario}</td>
                          <td className="p-3 font-bold text-white">{item.titulo}</td>
                          <td className="p-3">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                              {item.categoria}
                            </span>
                          </td>
                          <td className="p-3 text-slate-300">{item.responsavel}</td>
                          <td className="p-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => handleAbrirEditarModal(item)} className="p-1.5 bg-slate-800 text-sky-400 rounded-lg">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setItemExcluindoId(item.id)} className="p-1.5 bg-slate-800 text-rose-400 rounded-lg">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* 3. MODAL DE CRIAÇÃO / EDIÇÃO ESTILO GOOGLE CALENDAR */}
      {modalAberto && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn">
          <div className={`rounded-3xl p-6 max-w-lg w-full shadow-2xl border space-y-4 my-8 ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            
            <div className="flex items-center justify-between border-b border-slate-800/40 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-500/20 text-teal-400 rounded-xl border border-teal-500/30">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {itemEditando ? 'Editar Agendamento' : 'Novo Agendamento / Compromisso'}
                </h3>
              </div>
              <button onClick={() => setModalAberto(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              
              {/* Título Estilo Google */}
              <div>
                <input
                  type="text"
                  placeholder="Adicionar título do compromisso..."
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  required
                  autoFocus
                  className={`w-full p-3.5 rounded-2xl border text-sm font-extrabold transition-all focus:ring-2 focus:ring-teal-500 focus:outline-none ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              {/* Seletor de Categoria com Pílulas Coloridas */}
              <div>
                <label className="block font-bold text-slate-400 mb-1.5">Agenda / Categoria</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(categoriasConfig) as CategoriaAgenda[]).map((cat) => {
                    const cfg = categoriasConfig[cat];
                    const isSelected = categoriaForm === cat;

                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategoriaForm(cat)}
                        className={`p-2.5 rounded-xl border font-extrabold text-left transition-all cursor-pointer flex items-center gap-2 ${
                          isSelected
                            ? `${cfg.bg} ${cfg.border} ${cfg.text} ring-2 ring-teal-500`
                            : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${cfg.dotColor} shrink-0`}></span>
                        <span className="truncate text-[11px]">{cfg.label}</span>
                      </button>
                    );
                  })}
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

              {/* Responsável */}
              <div>
                <label className="block font-bold text-slate-400 mb-1">Responsável / Envolvidos</label>
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

              {/* Observações */}
              <div>
                <label className="block font-bold text-slate-400 mb-1">Observações / Detalhes</label>
                <textarea
                  rows={2}
                  placeholder="Anotações extras..."
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
                  className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-extrabold rounded-xl shadow-lg cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Salvar no Google Calendar
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL DE EXCLUSÃO */}
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
                <h3 className="font-extrabold text-base">Excluir Agendamento</h3>
                <p className="text-xs text-slate-400">Esta ação irá remover o compromisso da agenda.</p>
              </div>
            </div>

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
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-lg cursor-pointer"
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

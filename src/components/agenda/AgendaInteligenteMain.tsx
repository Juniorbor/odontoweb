import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Search,
  CheckCircle2,
  Play,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import type { ConsultaInteligente, Dentista, StatusConsultaType } from '../../types/agendaInteligente';
import type { Paciente } from '../../types';
import {
  getConsultasInteligentesLocais,
  salvarConsultasInteligentesLocais,
  getDentistasLocais,
  getCorStatusConsulta,
  calcularDataRetornoPrevista
} from '../../services/agendaService';
import { enviarLembreteConsultaWhatsApp } from '../../services/whatsappService';
import { ModalAgendamentoConsulta } from './ModalAgendamentoConsulta';

interface AgendaInteligenteMainProps {
  darkMode?: boolean;
  usuarioId?: string;
  pacientesExistentes?: Paciente[];
  onNavigateToProntuario?: (pacienteId: string) => void;
  onNavigateToAgendamentoOnline?: () => void;
}

export const AgendaInteligenteMain: React.FC<AgendaInteligenteMainProps> = ({
  darkMode,
  usuarioId,
  pacientesExistentes = [],
  onNavigateToProntuario,
  onNavigateToAgendamentoOnline
}) => {
  const [consultas, setConsultas] = useState<ConsultaInteligente[]>([]);
  const [dentistas, setDentistas] = useState<Dentista[]>([]);
  
  // Controles de Visão e Filtros
  const [modoVisao, setModoVisao] = useState<'dia' | 'semana' | 'mes' | 'lista'>('dia');
  const [dataSelecionada, setDataSelecionada] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dentistaFiltroId, setDentistaFiltroId] = useState<string>('todos');
  const [statusFiltro, setStatusFiltro] = useState<string>('todos');
  const [buscaQuery, setBuscaQuery] = useState<string>('');

  // Modais
  const [modalAgendamentoAberto, setModalAgendamentoAberto] = useState<boolean>(false);
  const [consultaEditar, setConsultaEditar] = useState<ConsultaInteligente | null>(null);
  const [horarioInclusaoPadrao, setHorarioInclusaoPadrao] = useState<{ data: string; horarioInicio: string } | undefined>();

  // Notificações / Sucesso
  const [mensagemToast, setMensagemToast] = useState<string | null>(null);

  // Modal de Finalizar Atendimento & Criar Retorno Programado
  const [modalFinalizarConsulta, setModalFinalizarConsulta] = useState<ConsultaInteligente | null>(null);
  const [periodoRetornoFinalizar, setPeriodoRetornoFinalizar] = useState<'1m' | '3m' | '6m' | '12m'>('6m');

  const carregarDados = () => {
    setConsultas(getConsultasInteligentesLocais(usuarioId));
    setDentistas(getDentistasLocais(usuarioId));
  };

  useEffect(() => {
    carregarDados();
  }, [usuarioId]);

  const showToast = (msg: string) => {
    setMensagemToast(msg);
    setTimeout(() => setMensagemToast(null), 4000);
  };

  // Salvar Nova Consulta ou Alteração
  const handleSalvarConsulta = (nova: ConsultaInteligente) => {
    let atualizada: ConsultaInteligente[] = [];
    const existe = consultas.some((c) => c.id === nova.id);
    if (existe) {
      atualizada = consultas.map((c) => (c.id === nova.id ? nova : c));
    } else {
      atualizada = [nova, ...consultas];
    }
    setConsultas(atualizada);
    salvarConsultasInteligentesLocais(atualizada, usuarioId);
    showToast(`✅ Consulta de ${nova.pacienteNome} salva com sucesso!`);
  };

  // Alteração de Status em 1 Clique
  const handleAlterarStatusRapido = (consultaId: string, novoStatus: StatusConsultaType) => {
    const atualizada = consultas.map((c) => (c.id === consultaId ? { ...c, status: novoStatus } : c));
    setConsultas(atualizada);
    salvarConsultasInteligentesLocais(atualizada, usuarioId);
    showToast(`Status alterado para "${novoStatus}"!`);
  };

  // Disparo de Lembrete via WhatsApp
  const handleEnviarLembreteWhatsApp = (c: ConsultaInteligente, tipo: '7_DIAS' | '24_HORAS' | '2_HORAS') => {
    const res = enviarLembreteConsultaWhatsApp(c, tipo, usuarioId);
    window.open(res.linkWhatsAppDirect, '_blank');
    showToast(`📲 Lembrete ${tipo} enviado para ${c.pacienteNome}!`);
  };

  // Iniciar Atendimento Clínico
  const handleIniciarAtendimento = (c: ConsultaInteligente) => {
    handleAlterarStatusRapido(c.id, 'Em atendimento');
    if (onNavigateToProntuario) {
      onNavigateToProntuario(c.pacienteId);
    }
  };

  // Finalizar Atendimento Clínico com Pergunta de Retorno Programado
  const handleConfirmarFinalizarAtendimento = () => {
    if (!modalFinalizarConsulta) return;

    const dataRetornoPrevisto = calcularDataRetornoPrevista(modalFinalizarConsulta.data, periodoRetornoFinalizar);

    const atualizada = consultas.map((c) => {
      if (c.id === modalFinalizarConsulta.id) {
        return {
          ...c,
          status: 'Atendimento concluído' as StatusConsultaType,
          necessitaRetorno: true,
          periodoRetornoRecomendado: periodoRetornoFinalizar,
          dataRetornoPrevisto,
          atendimentoFinalizadoEm: new Date().toISOString()
        };
      }
      return c;
    });

    setConsultas(atualizada);
    salvarConsultasInteligentesLocais(atualizada, usuarioId);
    setModalFinalizarConsulta(null);
    showToast(`✅ Atendimento concluído! Retorno de ${periodoRetornoFinalizar} programado para ${new Date(dataRetornoPrevisto + 'T00:00:00').toLocaleDateString('pt-BR')}.`);
  };

  // Filtros aplicados
  const consultasFiltradas = (consultas || []).filter((c) => {
    if (!c) return false;
    if (dentistaFiltroId !== 'todos' && c.dentistaId !== dentistaFiltroId) return false;
    if (statusFiltro !== 'todos' && c.status !== statusFiltro) return false;

    if (modoVisao === 'dia' && c.data !== dataSelecionada) return false;

    if (buscaQuery.trim()) {
      const q = buscaQuery.toLowerCase();
      const matchNome = (c.pacienteNome || '').toLowerCase().includes(q);
      const matchDentista = (c.dentistaNome || '').toLowerCase().includes(q);
      const matchProc = (c.procedimento || '').toLowerCase().includes(q);
      const matchTel = (c.pacienteTelefone || '').includes(q);
      return matchNome || matchDentista || matchProc || matchTel;
    }

    return true;
  });

  // Métricas do Dashboard em Tempo Real
  const hojeStr = new Date().toISOString().split('T')[0];
  const consultasHoje = (consultas || []).filter((c) => c && c.data === hojeStr);
  const confirmadasHoje = consultasHoje.filter((c) => c && c.status === 'Confirmada').length;
  const aguardandoHoje = consultasHoje.filter((c) => c && (c.status === 'Aguardando confirmação' || c.status === 'Agendada')).length;
  const atendidasHoje = consultasHoje.filter((c) => c && c.status === 'Atendimento concluído').length;
  const retornosPendentesTotal = (consultas || []).filter((c) => c && c.necessitaRetorno && c.dataRetornoPrevisto && c.dataRetornoPrevisto < hojeStr).length;

  return (
    <div className="space-y-6 font-sans text-slate-200 animate-fadeIn">
      
      {/* Toast de Notificação */}
      {mensagemToast && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-2xl bg-emerald-500 text-slate-950 font-black text-xs shadow-2xl flex items-center gap-2 border border-emerald-300 animate-slideDown">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{mensagemToast}</span>
        </div>
      )}

      {/* PAINEL SUPERIOR: BANNER & INDICADORES (KPIs) */}
      <div className={`p-6 rounded-3xl border shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-teal-500/10 text-teal-400 rounded-2xl border border-teal-500/30 shrink-0">
            <CalendarIcon className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Agenda Inteligente Odontológica</h2>
            <p className="text-xs text-slate-400">
              Controle de consultas, múltiplos dentistas, confirmações automáticas via WhatsApp e retornos periódicos.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {onNavigateToAgendamentoOnline && (
            <button
              onClick={onNavigateToAgendamentoOnline}
              className="bg-slate-800 hover:bg-slate-700 text-teal-400 font-bold px-4 py-3 rounded-2xl text-xs flex items-center gap-2 border border-slate-700 transition-all cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" /> Ver Agendamento Online Público
            </button>
          )}

          <button
            onClick={() => {
              setConsultaEditar(null);
              setHorarioInclusaoPadrao(undefined);
              setModalAgendamentoAberto(true);
            }}
            className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-slate-950 font-black px-5 py-3 rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-teal-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Agendar Nova Consulta
          </button>
        </div>
      </div>

      {/* DASHBOARD DE MÉTRICAS EM TEMPO REAL */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-3xl border border-slate-800 bg-slate-900/90 shadow-lg">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Consultas Hoje</span>
          <span className="text-2xl font-black text-white block mt-1">{consultasHoje.length}</span>
        </div>

        <div className="p-4 rounded-3xl border border-emerald-500/30 bg-emerald-950/20 shadow-lg">
          <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">Confirmadas</span>
          <span className="text-2xl font-black text-emerald-400 block mt-1">{confirmadasHoje}</span>
        </div>

        <div className="p-4 rounded-3xl border border-amber-500/30 bg-amber-950/20 shadow-lg">
          <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider">Aguardando</span>
          <span className="text-2xl font-black text-amber-400 block mt-1">{aguardandoHoje}</span>
        </div>

        <div className="p-4 rounded-3xl border border-rose-500/30 bg-rose-950/20 shadow-lg">
          <span className="text-[10px] font-extrabold text-rose-400 uppercase tracking-wider">🔴 Retornos Atrasados</span>
          <span className="text-2xl font-black text-rose-400 block mt-1">{retornosPendentesTotal}</span>
        </div>
      </div>

      {/* BARRA DE CONTROLES: FILTROS E BUSCA */}
      <div className={`p-4 rounded-3xl border shadow-xl flex flex-col md:flex-row justify-between items-center gap-3 ${
        darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        {/* Seletor de Visão (Dia, Semana, Mês, Lista) */}
        <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 w-full md:w-auto">
          {[
            { id: 'dia', label: 'Dia' },
            { id: 'semana', label: 'Semana' },
            { id: 'mes', label: 'Mês' },
            { id: 'lista', label: 'Lista' }
          ].map((v) => (
            <button
              key={v.id}
              onClick={() => setModoVisao(v.id as any)}
              className={`flex-1 md:flex-initial px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                modoVisao === v.id ? 'bg-teal-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Navegação de Data */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-center">
          <button
            onClick={() => {
              const dt = new Date(dataSelecionada);
              dt.setDate(dt.getDate() - 1);
              setDataSelecionada(dt.toISOString().split('T')[0]);
            }}
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <input
            type="date"
            value={dataSelecionada}
            onChange={(e) => setDataSelecionada(e.target.value)}
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-xs"
          />

          <button
            onClick={() => {
              const dt = new Date(dataSelecionada);
              dt.setDate(dt.getDate() + 1);
              setDataSelecionada(dt.toISOString().split('T')[0]);
            }}
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Filtro por Dentista e Busca Inteligente */}
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
          <select
            value={dentistaFiltroId}
            onChange={(e) => setDentistaFiltroId(e.target.value)}
            className="w-full sm:w-auto p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium text-xs"
          >
            <option value="todos">👨‍⚕️ Todos os Dentistas</option>
            {dentistas.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nome}
              </option>
            ))}
          </select>

          <select
            value={statusFiltro}
            onChange={(e) => setStatusFiltro(e.target.value)}
            className="w-full sm:w-auto p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-teal-400 font-medium text-xs"
          >
            <option value="todos">Status: Todos</option>
            <option value="Agendada">Agendada</option>
            <option value="Confirmada">Confirmada</option>
            <option value="Aguardando confirmação">Aguardando confirmação</option>
            <option value="Em atendimento">Em atendimento</option>
            <option value="Atendimento concluído">Atendimento concluído ({atendidasHoje})</option>
            <option value="Paciente chegou">Paciente chegou</option>
            <option value="Paciente faltou">Paciente faltou</option>
            <option value="Cancelada">Cancelada</option>
            <option value="Reagendada">Reagendada</option>
          </select>

          <div className="relative w-full sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={buscaQuery}
              onChange={(e) => setBuscaQuery(e.target.value)}
              placeholder="Buscar consulta..."
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
            />
          </div>
        </div>
      </div>

      {/* GRID DA AGENDA INTELIGENTE */}
      <div className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
        darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-400" />
            Compromissos Agendados ({consultasFiltradas.length})
          </h3>
        </div>

        {consultasFiltradas.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <CalendarIcon className="w-10 h-10 text-slate-600 mx-auto" />
            <p>Nenhuma consulta agendada para esta data/filtro.</p>
            <button
              onClick={() => {
                setConsultaEditar(null);
                setModalAgendamentoAberto(true);
              }}
              className="text-teal-400 font-bold hover:underline cursor-pointer"
            >
              Clique aqui para agendar uma consulta
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {consultasFiltradas.map((c) => {
              const cor = getCorStatusConsulta(c.status);

              return (
                <div
                  key={c.id}
                  className={`p-5 rounded-3xl border transition-all flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-950 border-slate-800`}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-black text-teal-400 text-sm bg-teal-500/10 px-2.5 py-0.5 rounded-lg border border-teal-500/30">
                        {c.horarioInicio} - {c.horarioFim}
                      </span>

                      <span className="font-extrabold text-base text-white">{c.pacienteNome}</span>

                      {/* Badge de Status com Clique Rápido para Alterar */}
                      <select
                        value={c.status}
                        onChange={(e) => handleAlterarStatusRapido(c.id, e.target.value as StatusConsultaType)}
                        className={`text-[11px] font-black uppercase px-3 py-1 rounded-full border cursor-pointer ${cor.bg} ${cor.text} ${cor.border}`}
                      >
                        <option value="Agendada">Agendada</option>
                        <option value="Confirmada">Confirmada</option>
                        <option value="Aguardando confirmação">Aguardando confirmação</option>
                        <option value="Em atendimento">Em atendimento</option>
                        <option value="Atendimento concluído">Atendimento concluído</option>
                        <option value="Paciente chegou">Paciente chegou</option>
                        <option value="Paciente faltou">Paciente faltou</option>
                        <option value="Cancelada">Cancelada</option>
                        <option value="Reagendada">Reagendada</option>
                      </select>

                      {c.agendamentoOnline && (
                        <span className="text-[9px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full uppercase">
                          🔗 Agendado pelo Cliente
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-400 flex flex-wrap gap-x-4 gap-y-1 pt-1">
                      <span>Procedimento: <strong className="text-slate-200">{c.procedimento}</strong></span>
                      <span>Dentista: <strong className="text-slate-200">{c.dentistaNome}</strong> ({c.especialidade})</span>
                      <span>Sala: <strong className="text-slate-200">{c.consultorio}</strong></span>
                      <span>Telefone: <strong className="text-slate-200">{c.pacienteTelefone}</strong></span>
                    </div>

                    {c.observacoes && (
                      <p className="text-[11px] text-slate-400 italic bg-slate-900/60 p-2 rounded-xl border border-slate-800/60 mt-1">
                        obs: {c.observacoes}
                      </p>
                    )}
                  </div>

                  {/* AÇÕES DA CONSULTA */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    
                    {/* Disparo WhatsApp */}
                    <button
                      onClick={() => handleEnviarLembreteWhatsApp(c, '24_HORAS')}
                      className="p-2.5 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Enviar Lembrete de Confirmação via WhatsApp"
                    >
                      <MessageSquare className="w-4 h-4" /> WhatsApp
                    </button>

                    {/* Botão de Iniciar Atendimento Clínico */}
                    {c.status !== 'Atendimento concluído' && (
                      <button
                        onClick={() => handleIniciarAtendimento(c)}
                        className="p-2.5 rounded-2xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Iniciar Atendimento Clínico (Abrir Prontuário)"
                      >
                        <Play className="w-4 h-4" /> Iniciar Atendimento
                      </button>
                    )}

                    {/* Botão de Finalizar Atendimento Clínico */}
                    {c.status === 'Em atendimento' && (
                      <button
                        onClick={() => setModalFinalizarConsulta(c)}
                        className="p-2.5 rounded-2xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Finalizar Atendimento
                      </button>
                    )}

                    {/* Editar Consulta */}
                    <button
                      onClick={() => {
                        setConsultaEditar(c);
                        setModalAgendamentoAberto(true);
                      }}
                      className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Editar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL DE AGENDAMENTO / EDIÇÃO DE CONSULTA */}
      <ModalAgendamentoConsulta
        isOpen={modalAgendamentoAberto}
        onClose={() => setModalAgendamentoAberto(false)}
        onSalvar={handleSalvarConsulta}
        consultaEditar={consultaEditar}
        pacientesExistentes={pacientesExistentes}
        horarioPadraoInclusao={horarioInclusaoPadrao}
        darkMode={darkMode}
        usuarioId={usuarioId}
      />

      {/* MODAL DE FINALIZAR ATENDIMENTO & PROGRAMAR RETORNO */}
      {modalFinalizarConsulta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl space-y-4 ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className="text-base font-bold text-teal-400 flex items-center gap-2 border-b border-slate-800 pb-3">
              <CheckCircle2 className="w-5 h-5 text-teal-400" /> Finalizar Atendimento Clínico
            </h3>

            <p className="text-xs text-slate-300">
              Você está concluindo o atendimento de <strong>{modalFinalizarConsulta.pacienteNome}</strong> ({modalFinalizarConsulta.procedimento}).
            </p>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <label className="font-bold text-teal-400 block text-xs">
                🗓️ Deseja programar o retorno preventivo deste paciente?
              </label>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { label: '1 Mês', val: '1m' },
                  { label: '3 Meses', val: '3m' },
                  { label: '6 Meses', val: '6m' },
                  { label: '12 Meses', val: '12m' }
                ].map((p) => (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => setPeriodoRetornoFinalizar(p.val as any)}
                    className={`p-2.5 rounded-xl border font-black transition-all cursor-pointer ${
                      periodoRetornoFinalizar === p.val
                        ? 'bg-teal-500 text-slate-950 border-teal-400'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModalFinalizarConsulta(null)}
                className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarFinalizarAtendimento}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 text-slate-950 font-black text-xs cursor-pointer shadow-lg shadow-teal-500/20"
              >
                Concluir & Registrar Retorno
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

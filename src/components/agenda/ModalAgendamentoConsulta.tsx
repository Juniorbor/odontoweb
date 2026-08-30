import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, AlertTriangle, CheckCircle2, X, Plus } from 'lucide-react';
import type { ConsultaInteligente, Dentista, StatusConsultaType, EspecialidadeOdontologica } from '../../types/agendaInteligente';
import type { Paciente } from '../../types';
import { getDentistasLocais, validarConflitoHorario, calcularDataRetornoPrevista } from '../../services/agendaService';

interface ModalAgendamentoConsultaProps {
  isOpen: boolean;
  onClose: () => void;
  onSalvar: (consulta: ConsultaInteligente) => void;
  consultaEditar?: ConsultaInteligente | null;
  pacientesExistentes?: Paciente[];
  horarioPadraoInclusao?: { data: string; horarioInicio: string };
  darkMode?: boolean;
  usuarioId?: string;
}

const STATUS_OPCOES: StatusConsultaType[] = [
  'Agendada',
  'Confirmada',
  'Aguardando confirmação',
  'Em atendimento',
  'Atendimento concluído',
  'Paciente chegou',
  'Paciente faltou',
  'Cancelada',
  'Reagendada'
];

export const ModalAgendamentoConsulta: React.FC<ModalAgendamentoConsultaProps> = ({
  isOpen,
  onClose,
  onSalvar,
  consultaEditar,
  pacientesExistentes = [],
  horarioPadraoInclusao,
  darkMode,
  usuarioId
}) => {
  const [dentistas, setDentistas] = useState<Dentista[]>([]);
  
  // States do Form
  const [pacienteId, setPacienteId] = useState<string>('');
  const [pacienteNome, setPacienteNome] = useState<string>('');
  const [pacienteTelefone, setPacienteTelefone] = useState<string>('');
  const [dentistaId, setDentistaId] = useState<string>('');
  const [especialidade, setEspecialidade] = useState<EspecialidadeOdontologica>('Clínico Geral');
  const [procedimento, setProcedimento] = useState<string>('Avaliação Clínica e Limpeza');
  const [data, setData] = useState<string>(new Date().toISOString().split('T')[0]);
  const [horarioInicio, setHorarioInicio] = useState<string>('09:00');
  const [duracaoMinutos, setDuracaoMinutos] = useState<number>(45);
  const [consultorio, setConsultorio] = useState<string>('Consultório 01 (Matriz)');
  const [motivoConsulta, setMotivoConsulta] = useState<string>('');
  const [observacoes, setObservacoes] = useState<string>('');
  const [status, setStatus] = useState<StatusConsultaType>('Agendada');
  const [formaContato, setFormaContato] = useState<'WhatsApp' | 'Telefone' | 'Presencial' | 'Online'>('WhatsApp');
  
  // Retorno Programado
  const [necessitaRetorno, setNecessitaRetorno] = useState<boolean>(true);
  const [periodoRetorno, setPeriodoRetorno] = useState<'1m' | '3m' | '6m' | '12m'>('6m');
  const [dataRetornoPrevisto, setDataRetornoPrevisto] = useState<string>('');

  const [erroConflito, setErroConflito] = useState<string | null>(null);
  const [criandoNovoPaciente, setCriandoNovoPaciente] = useState<boolean>(false);

  useEffect(() => {
    const dList = getDentistasLocais(usuarioId);
    setDentistas(dList);

    if (consultaEditar) {
      setPacienteId(consultaEditar.pacienteId);
      setPacienteNome(consultaEditar.pacienteNome);
      setPacienteTelefone(consultaEditar.pacienteTelefone);
      setDentistaId(consultaEditar.dentistaId);
      setEspecialidade(consultaEditar.especialidade);
      setProcedimento(consultaEditar.procedimento);
      setData(consultaEditar.data);
      setHorarioInicio(consultaEditar.horarioInicio);
      setDuracaoMinutos(consultaEditar.duracaoMinutos);
      setConsultorio(consultaEditar.consultorio);
      setMotivoConsulta(consultaEditar.motivoConsulta || '');
      setObservacoes(consultaEditar.observacoes || '');
      setStatus(consultaEditar.status);
      setFormaContato(consultaEditar.formaContato);
      setNecessitaRetorno(consultaEditar.necessitaRetorno);
      setDataRetornoPrevisto(consultaEditar.dataRetornoPrevisto || '');
    } else {
      if (dList.length > 0) {
        setDentistaId(dList[0].id);
        setConsultorio(dList[0].consultorio);
      }
      if (horarioPadraoInclusao) {
        setData(horarioPadraoInclusao.data);
        setHorarioInicio(horarioPadraoInclusao.horarioInicio);
      }
      setDataRetornoPrevisto(calcularDataRetornoPrevista(data, '6m'));
    }
  }, [consultaEditar, horarioPadraoInclusao, usuarioId, isOpen]);

  // Recalcula horário final e data de retorno quando a data ou duração muda
  useEffect(() => {
    if (necessitaRetorno) {
      setDataRetornoPrevisto(calcularDataRetornoPrevista(data, periodoRetorno));
    }
  }, [data, periodoRetorno, necessitaRetorno]);

  if (!isOpen) return null;

  // Calcula Horário Final automaticamente
  const [horaH, horaM] = horarioInicio.split(':').map(Number);
  const totalMin = (horaH || 9) * 60 + (horaM || 0) + duracaoMinutos;
  const fimH = String(Math.floor(totalMin / 60)).padStart(2, '0');
  const fimM = String(totalMin % 60).padStart(2, '0');
  const horarioFim = `${fimH}:${fimM}`;

  const handleSelecionarPaciente = (pId: string) => {
    setPacienteId(pId);
    const enc = pacientesExistentes.find((p) => p.id === pId);
    if (enc) {
      setPacienteNome(enc.nome);
      setPacienteTelefone(enc.telefone);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErroConflito(null);

    if (!pacienteNome.trim()) {
      setErroConflito('Por favor, informe o nome do paciente.');
      return;
    }

    const dentistaEnc = dentistas.find((d) => d.id === dentistaId);
    const dNome = dentistaEnc ? dentistaEnc.nome : 'Dentista Responsável';

    // Validação estrita de choque de horário na agenda
    const checagem = validarConflitoHorario(
      dentistaId,
      data,
      horarioInicio,
      horarioFim,
      consultaEditar?.id,
      usuarioId
    );

    if (checagem.conflito) {
      setErroConflito(checagem.motivo || 'Choque de horário detectado!');
      return;
    }

    const novaConsulta: ConsultaInteligente = {
      id: consultaEditar ? consultaEditar.id : `cons-${Date.now()}`,
      pacienteId: pacienteId || `pac-${Date.now()}`,
      pacienteNome,
      pacienteTelefone,
      dentistaId,
      dentistaNome: dNome,
      especialidade,
      procedimento,
      data,
      horarioInicio,
      horarioFim,
      duracaoMinutos,
      consultorio,
      motivoConsulta,
      observacoes,
      status,
      formaContato,
      necessitaRetorno,
      periodoRetornoRecomendado: periodoRetorno,
      dataRetornoPrevisto: necessitaRetorno ? dataRetornoPrevisto : undefined,
      createdAt: consultaEditar ? consultaEditar.createdAt : new Date().toISOString()
    };

    onSalvar(novaConsulta);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn font-sans">
      <div className={`w-full max-w-2xl p-6 rounded-3xl border shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Header do Modal */}
        <div className="flex justify-between items-center border-b border-slate-800/40 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-teal-500/10 text-teal-400 rounded-2xl border border-teal-500/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {consultaEditar ? 'Editar Agendamento de Consulta' : 'Agendar Nova Consulta Odontológica'}
              </h3>
              <span className="text-[10px] text-slate-400">Preencha as informações do atendimento e retorno</span>
            </div>
          </div>

          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {erroConflito && (
          <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{erroConflito}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
          
          {/* BLOCO 1: SELEÇÃO DE PACIENTE */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <label className="font-bold text-slate-300 flex items-center gap-1.5">
                <User className="w-4 h-4 text-teal-400" /> Paciente:
              </label>

              <button
                type="button"
                onClick={() => setCriandoNovoPaciente(!criandoNovoPaciente)}
                className="text-[11px] font-bold text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> {criandoNovoPaciente ? 'Selecionar da Lista' : 'Novo Paciente'}
              </button>
            </div>

            {!criandoNovoPaciente && pacientesExistentes.length > 0 ? (
              <select
                value={pacienteId}
                onChange={(e) => handleSelecionarPaciente(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-medium"
              >
                <option value="">-- Selecione um Paciente Cadastrado --</option>
                {pacientesExistentes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} • {p.telefone}
                  </option>
                ))}
              </select>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={pacienteNome}
                  onChange={(e) => setPacienteNome(e.target.value)}
                  placeholder="Nome completo do paciente"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-medium"
                />
                <input
                  type="text"
                  required
                  value={pacienteTelefone}
                  onChange={(e) => setPacienteTelefone(e.target.value)}
                  placeholder="Telefone / WhatsApp ex: (69) 99999-0000"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-medium"
                />
              </div>
            )}
          </div>

          {/* BLOCO 2: DENTISTA, ESPECIALIDADE E PROCEDIMENTO */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-300 block mb-1">Dentista Responsável:</label>
              <select
                value={dentistaId}
                onChange={(e) => {
                  setDentistaId(e.target.value);
                  const enc = dentistas.find((d) => d.id === e.target.value);
                  if (enc) setConsultorio(enc.consultorio);
                }}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium"
              >
                {dentistas.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nome} ({d.cro})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Especialidade:</label>
              <select
                value={especialidade}
                onChange={(e) => setEspecialidade(e.target.value as EspecialidadeOdontologica)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium"
              >
                <option value="Clínico Geral">Clínico Geral</option>
                <option value="Endodontia">Endodontia</option>
                <option value="Periodontia">Periodontia</option>
                <option value="Ortodontia">Ortodontia</option>
                <option value="Implantodontia">Implantodontia</option>
                <option value="Cirurgia Bucomaxilofacial">Cirurgia Bucomaxilofacial</option>
                <option value="Odontopediatria">Odontopediatria</option>
                <option value="Dentística">Dentística</option>
                <option value="Prótese">Prótese</option>
                <option value="Harmonização Orofacial">Harmonização Orofacial</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Procedimento a Realizar:</label>
              <input
                type="text"
                required
                value={procedimento}
                onChange={(e) => setProcedimento(e.target.value)}
                placeholder="Ex: Restauração Resina / Limpeza"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium"
              />
            </div>
          </div>

          {/* BLOCO 3: DATA, HORÁRIO E DURAÇÃO */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="font-bold text-slate-300 block mb-1">Data da Consulta:</label>
              <input
                type="date"
                required
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Horário de Início:</label>
              <input
                type="time"
                required
                value={horarioInicio}
                onChange={(e) => setHorarioInicio(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Duração (Minutos):</label>
              <select
                value={duracaoMinutos}
                onChange={(e) => setDuracaoMinutos(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium"
              >
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min (1h)</option>
                <option value={90}>90 min (1h30)</option>
                <option value={120}>120 min (2h)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Horário de Término:</label>
              <div className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-teal-400 font-mono font-bold">
                {horarioFim} hs
              </div>
            </div>
          </div>

          {/* BLOCO 4: STATUS DA CONSULTA E FORMA DE CONTATO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-300 block mb-1">Status da Consulta:</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusConsultaType)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 font-bold"
              >
                {STATUS_OPCOES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">Forma de Contato:</label>
              <select
                value={formaContato}
                onChange={(e) => setFormaContato(e.target.value as any)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium"
              >
                <option value="WhatsApp">WhatsApp</option>
                <option value="Telefone">Telefone</option>
                <option value="Presencial">Presencial</option>
                <option value="Online">Online</option>
              </select>
            </div>
          </div>

          {/* BLOCO 5: AUTOMAÇÃO DE RETORNO PROGRAMADO (1, 3, 6, 12 MESES) */}
          <div className="p-4 rounded-2xl bg-teal-950/20 border border-teal-500/30 space-y-3">
            <div className="flex justify-between items-center">
              <label className="font-bold text-teal-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-teal-400" /> Programar Retorno Preventivo Automático?
              </label>

              <input
                type="checkbox"
                checked={necessitaRetorno}
                onChange={(e) => setNecessitaRetorno(e.target.checked)}
                className="w-4 h-4 accent-teal-500 cursor-pointer"
              />
            </div>

            {necessitaRetorno && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {[
                  { label: '1 Mês', val: '1m' },
                  { label: '3 Meses', val: '3m' },
                  { label: '6 Meses', val: '6m' },
                  { label: '12 Meses', val: '12m' }
                ].map((p) => (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => setPeriodoRetorno(p.val as any)}
                    className={`p-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      periodoRetorno === p.val
                        ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* OBSERVAÇÕES E MOTIVO */}
          <div>
            <label className="font-bold text-slate-300 block mb-1">Motivo / Observações Clínicas:</label>
            <textarea
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Queixa principal do paciente ou detalhes do agendamento..."
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 text-slate-950 font-black cursor-pointer shadow-lg shadow-teal-500/20 flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Salvar Agendamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

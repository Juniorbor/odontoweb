import React, { useState, useEffect } from 'react';
import { UserCheck, Stethoscope, CheckCircle2 } from 'lucide-react';
import type { Dentista, EspecialidadeOdontologica, ConsultaInteligente } from '../../types/agendaInteligente';
import { getDentistasLocais, getConsultasInteligentesLocais, salvarConsultasInteligentesLocais, validarConflitoHorario } from '../../services/agendaService';
import LOGO_BASE64 from '../../assets/logoData';

interface PaginaAgendamentoOnlinePublicoProps {
  darkMode?: boolean;
  usuarioId?: string;
  onConcluido?: () => void;
}

export const PaginaAgendamentoOnlinePublico: React.FC<PaginaAgendamentoOnlinePublicoProps> = ({
  darkMode: _darkMode = true,
  usuarioId,
  onConcluido
}) => {
  const [dentistas, setDentistas] = useState<Dentista[]>([]);
  
  // Etapas
  const [especialidadeSelecionada, setEspecialidadeSelecionada] = useState<EspecialidadeOdontologica>('Clínico Geral');
  const [dentistaSelecionado, setDentistaSelecionado] = useState<Dentista | null>(null);
  const [dataSelecionada, setDataSelecionada] = useState<string>(new Date().toISOString().split('T')[0]);
  const [horarioSelecionado, setHorarioSelecionado] = useState<string>('09:00');
  
  // Dados do Paciente
  const [nomePaciente, setNomePaciente] = useState<string>('');
  const [telefonePaciente, setTelefonePaciente] = useState<string>('');
  const [motivo, setMotivo] = useState<string>('');

  const [sucesso, setSucesso] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const list = getDentistasLocais(usuarioId).filter((d) => d.statusAtivo);
    setDentistas(list);
    if (list.length > 0) setDentistaSelecionado(list[0]);
  }, [usuarioId]);

  const HORARIOS_DISPONIVEIS = ['08:00', '08:45', '09:30', '10:15', '11:00', '14:00', '14:45', '15:30', '16:15', '17:00'];

  const handleConfirmarAgendamento = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!dentistaSelecionado) return;
    if (!nomePaciente.trim() || !telefonePaciente.trim()) {
      setErro('Por favor, informe seu nome e número de WhatsApp.');
      return;
    }

    // Calcula horário fim (45 min padrão)
    const [h, m] = horarioSelecionado.split(':').map(Number);
    const totalM = h * 60 + m + 45;
    const fimH = String(Math.floor(totalM / 60)).padStart(2, '0');
    const fimM = String(totalM % 60).padStart(2, '0');
    const horarioFim = `${fimH}:${fimM}`;

    // Valida se horário está livre
    const conflito = validarConflitoHorario(
      dentistaSelecionado.id,
      dataSelecionada,
      horarioSelecionado,
      horarioFim,
      undefined,
      usuarioId
    );

    if (conflito.conflito) {
      setErro(conflito.motivo || 'Este horário já se encontra ocupado. Escolha outro horário.');
      return;
    }

    const novaConsulta: ConsultaInteligente = {
      id: `online-${Date.now()}`,
      pacienteId: `pac-online-${Date.now()}`,
      pacienteNome: nomePaciente,
      pacienteTelefone: telefonePaciente,
      dentistaId: dentistaSelecionado.id,
      dentistaNome: dentistaSelecionado.nome,
      especialidade: especialidadeSelecionada,
      procedimento: `Agendamento Online - ${especialidadeSelecionada}`,
      data: dataSelecionada,
      horarioInicio: horarioSelecionado,
      horarioFim,
      duracaoMinutos: 45,
      consultorio: dentistaSelecionado.consultorio,
      motivoConsulta: motivo,
      status: 'Agendada',
      formaContato: 'Online',
      necessitaRetorno: true,
      periodoRetornoRecomendado: '6m',
      agendamentoOnline: true,
      createdAt: new Date().toISOString()
    };

    const existentes = getConsultasInteligentesLocais(usuarioId);
    salvarConsultasInteligentesLocais([novaConsulta, ...existentes], usuarioId);

    setSucesso(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Header da Página Pública */}
        <div className="text-center space-y-2 border-b border-slate-800 pb-5">
          <img
            src={LOGO_BASE64}
            alt="OdontoWeb Logo"
            className="w-16 h-16 object-contain rounded-full border-2 border-teal-500/60 shadow-xl bg-white p-1 mx-auto"
          />
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            OdontoWeb <span className="text-teal-400">- Agendamento Online</span>
          </h1>
          <p className="text-xs text-slate-400">
            Escolha o profissional, o melhor dia e horário para a sua consulta odontológica.
          </p>
        </div>

        {sucesso ? (
          <div className="p-8 text-center space-y-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-white">Agendamento Realizado com Sucesso! 🎉</h2>
            <p className="text-xs text-slate-300 max-w-md mx-auto">
              Olá, <strong>{nomePaciente}</strong>! Sua consulta foi solicitada para o dia <strong>{new Date(dataSelecionada + 'T00:00:00').toLocaleDateString('pt-BR')}</strong> às <strong>{horarioSelecionado}</strong> com <strong>{dentistaSelecionado?.nome}</strong>.
            </p>
            <p className="text-[11px] text-teal-400 bg-teal-500/10 p-3 rounded-2xl border border-teal-500/30">
              📲 Enviamos uma mensagem de confirmação para o seu WhatsApp (<strong>{telefonePaciente}</strong>).
            </p>

            {onConcluido && (
              <button
                onClick={onConcluido}
                className="mt-4 px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
              >
                Voltar ao Painel
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleConfirmarAgendamento} className="space-y-5 text-xs font-sans">
            
            {erro && (
              <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 font-bold">
                ⚠️ {erro}
              </div>
            )}

            {/* SELEÇÃO DE ESPECIALIDADE */}
            <div className="space-y-2">
              <label className="font-bold text-slate-300 block flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-teal-400" /> 1. Escolha a Especialidade:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {['Clínico Geral', 'Ortodontia', 'Endodontia', 'Implantodontia', 'Cirurgia Bucomaxilofacial', 'Harmonização Orofacial'].map((esp) => (
                  <button
                    key={esp}
                    type="button"
                    onClick={() => setEspecialidadeSelecionada(esp as any)}
                    className={`p-2.5 rounded-2xl border text-left font-bold transition-all cursor-pointer ${
                      especialidadeSelecionada === esp
                        ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {esp}
                  </button>
                ))}
              </div>
            </div>

            {/* SELEÇÃO DE DENTISTA */}
            <div className="space-y-2">
              <label className="font-bold text-slate-300 block flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-teal-400" /> 2. Escolha o Dentista:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {dentistas.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDentistaSelecionado(d)}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      dentistaSelecionado?.id === d.id
                        ? 'bg-emerald-950/40 border-emerald-500 text-white ring-2 ring-emerald-500/50'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 font-bold flex items-center justify-center shrink-0">
                      {d.nome[0]}
                    </div>
                    <div>
                      <span className="font-extrabold text-sm block">{d.nome}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{d.cro} • {d.consultorio}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* DATA E HORÁRIOS LIVRES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-300 block mb-1">3. Selecione a Data:</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={dataSelecionada}
                  onChange={(e) => setDataSelecionada(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Horário Disponível:</label>
                <select
                  value={horarioSelecionado}
                  onChange={(e) => setHorarioSelecionado(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-teal-400 font-bold"
                >
                  {HORARIOS_DISPONIVEIS.map((h) => (
                    <option key={h} value={h}>
                      {h} hs
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* INFORMAÇÕES DO PACIENTE */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <label className="font-bold text-slate-300 block">4. Seus Dados de Contato:</label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={nomePaciente}
                  onChange={(e) => setNomePaciente(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white font-medium"
                />

                <input
                  type="text"
                  required
                  value={telefonePaciente}
                  onChange={(e) => setTelefonePaciente(e.target.value)}
                  placeholder="WhatsApp (ex: 69 99999-0000)"
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white font-medium"
                />
              </div>

              <input
                type="text"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Motivo da consulta (opcional)..."
                className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-white font-medium"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-slate-950 font-black text-sm transition-all shadow-xl shadow-teal-500/20 cursor-pointer"
            >
              ✓ Confirmar Agendamento Online
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

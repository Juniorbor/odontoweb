import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Edit2, Copy, CheckCircle2, Phone, Award, Clock, MapPin } from 'lucide-react';
import type { Dentista, EspecialidadeOdontologica } from '../../types/agendaInteligente';
import { getDentistasLocais, salvarDentistasLocais } from '../../services/agendaService';

interface PainelDentistasProps {
  darkMode?: boolean;
  usuarioId?: string;
}

const ESPECIALIDADES_DISPONIVEIS: EspecialidadeOdontologica[] = [
  'Clínico Geral',
  'Endodontia',
  'Periodontia',
  'Ortodontia',
  'Implantodontia',
  'Cirurgia Bucomaxilofacial',
  'Odontopediatria',
  'Dentística',
  'Prótese',
  'Estomatologia',
  'Radiologia Odontológica',
  'Harmonização Orofacial'
];

export const PainelDentistas: React.FC<PainelDentistasProps> = ({ darkMode, usuarioId }) => {
  const [dentistas, setDentistas] = useState<Dentista[]>([]);
  const [modalAberto, setModalAberto] = useState<boolean>(false);
  const [dentistaEditando, setDentistaEditando] = useState<Dentista | null>(null);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  // Campos do Formulário
  const [nome, setNome] = useState<string>('');
  const [cro, setCro] = useState<string>('');
  const [telefone, setTelefone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [consultorio, setConsultorio] = useState<string>('Consultório 01');
  const [horarioInicio, setHorarioInicio] = useState<string>('08:00');
  const [horarioFim, setHorarioFim] = useState<string>('18:00');
  const [especialidadesSelecionadas, setEspecialidadesSelecionadas] = useState<EspecialidadeOdontologica[]>(['Clínico Geral']);

  useEffect(() => {
    setDentistas(getDentistasLocais(usuarioId));
  }, [usuarioId]);

  const handleAbrirNovo = () => {
    setDentistaEditando(null);
    setNome('');
    setCro('');
    setTelefone('');
    setEmail('');
    setConsultorio('Consultório 01');
    setHorarioInicio('08:00');
    setHorarioFim('18:00');
    setEspecialidadesSelecionadas(['Clínico Geral']);
    setModalAberto(true);
  };

  const handleAbrirEdicao = (d: Dentista) => {
    setDentistaEditando(d);
    setNome(d.nome);
    setCro(d.cro);
    setTelefone(d.telefone);
    setEmail(d.email);
    setConsultorio(d.consultorio);
    setHorarioInicio(d.horarioInicio);
    setHorarioFim(d.horarioFim);
    setEspecialidadesSelecionadas(d.especialidades);
    setModalAberto(true);
  };

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !cro.trim()) return;

    const id = dentistaEditando ? dentistaEditando.id : `dent-${Date.now()}`;
    const slug = nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-');
    const novo: Dentista = {
      id,
      nome,
      cro,
      telefone,
      email,
      consultorio,
      horarioInicio,
      horarioFim,
      especialidades: especialidadesSelecionadas,
      diasAtendimento: ['seg', 'ter', 'qua', 'qui', 'sex'],
      statusAtivo: true,
      linkAgendamentoExclusivo: `https://odontoweb-app.vercel.app/agendamento/${slug}`
    };

    let listaAtualizada: Dentista[] = [];
    if (dentistaEditando) {
      listaAtualizada = dentistas.map((item) => (item.id === id ? novo : item));
    } else {
      listaAtualizada = [novo, ...dentistas];
    }

    setDentistas(listaAtualizada);
    salvarDentistasLocais(listaAtualizada, usuarioId);
    setModalAberto(false);
  };

  const handleToggleStatus = (id: string) => {
    const atualizada = dentistas.map((d) => (d.id === id ? { ...d, statusAtivo: !d.statusAtivo } : d));
    setDentistas(atualizada);
    salvarDentistasLocais(atualizada, usuarioId);
  };

  const handleCopiarLink = (d: Dentista) => {
    const link = d.linkAgendamentoExclusivo || `https://odontoweb-app.vercel.app/agendamento/${d.id}`;
    navigator.clipboard.writeText(link);
    setCopiadoId(d.id);
    setTimeout(() => setCopiadoId(null), 3000);
  };

  const toggleEspecialidade = (esp: EspecialidadeOdontologica) => {
    if (especialidadesSelecionadas.includes(esp)) {
      if (especialidadesSelecionadas.length > 1) {
        setEspecialidadesSelecionadas(especialidadesSelecionadas.filter((e) => e !== esp));
      }
    } else {
      setEspecialidadesSelecionadas([...especialidadesSelecionadas, esp]);
    }
  };

  return (
    <div className="space-y-6 font-sans animate-fadeIn">
      {/* Header do Módulo */}
      <div className={`p-6 rounded-3xl border shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-teal-500/10 text-teal-400 rounded-2xl border border-teal-500/30 shrink-0">
            <UserCheck className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Cadastro & Gestão de Dentistas</h2>
            <p className="text-xs text-slate-400">
              Gerencie o corpo clínico, CRO, especialidades e links individuais de agendamento online.
            </p>
          </div>
        </div>

        <button
          onClick={handleAbrirNovo}
          className="bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-slate-950 font-black px-5 py-3 rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-teal-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Cadastrar Novo Dentista
        </button>
      </div>

      {/* Grid de Dentistas Cadastrados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dentistas.map((d) => (
          <div
            key={d.id}
            className={`p-6 rounded-3xl border shadow-xl space-y-4 transition-all relative ${
              darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            } ${!d.statusAtivo ? 'opacity-60 grayscale' : ''}`}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-slate-950 font-black text-lg flex items-center justify-center border-2 border-teal-400/40 shadow-md shrink-0">
                  {d.nome.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">{d.nome}</h3>
                  <span className="text-[11px] font-mono text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/30 inline-block mt-0.5">
                    {d.cro}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleAbrirEdicao(d)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                  title="Editar Profissional"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tags de Especialidades */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {d.especialidades.map((esp) => (
                <span key={esp} className="text-[10px] font-extrabold bg-slate-950 text-slate-300 px-2.5 py-1 rounded-xl border border-slate-800 flex items-center gap-1">
                  <Award className="w-3 h-3 text-teal-400" /> {esp}
                </span>
              ))}
            </div>

            {/* Informações de Atendimento */}
            <div className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800/40">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Atendimento: <strong>{d.horarioInicio} às {d.horarioFim}</strong> (Seg-Sex)</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{d.consultorio}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{d.telefone}</span>
              </div>
            </div>

            {/* Link de Agendamento Online Exclusivo */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
              <span className="text-[10px] font-extrabold text-teal-400 uppercase tracking-widest block">
                🔗 Link de Agendamento Exclusivo:
              </span>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-slate-400 truncate">
                  {d.linkAgendamentoExclusivo}
                </span>
                <button
                  onClick={() => handleCopiarLink(d)}
                  className="bg-slate-800 hover:bg-slate-700 text-teal-400 px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                >
                  {copiadoId === d.id ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copiar Link
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Toggle Ativo/Inativo */}
            <div className="flex justify-between items-center pt-2">
              <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                d.statusAtivo ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
              }`}>
                {d.statusAtivo ? '🟢 PROFISSIONAL ATIVO' : '🔴 INATIVO'}
              </span>

              <button
                onClick={() => handleToggleStatus(d.id)}
                className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
              >
                {d.statusAtivo ? 'Desativar' : 'Ativar'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL DE CADASTRO E EDIÇÃO DE DENTISTA */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className={`w-full max-w-lg p-6 rounded-3xl border shadow-2xl space-y-4 ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <h3 className="text-base font-bold flex items-center gap-2 border-b border-slate-800 pb-3">
              <UserCheck className="w-5 h-5 text-teal-400" />
              {dentistaEditando ? 'Editar Cadastro de Dentista' : 'Cadastrar Novo Dentista'}
            </h3>

            <form onSubmit={handleSalvar} className="space-y-3 text-xs font-sans">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Nome Completo do Dentista:</label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Dr. Roberto Guimarães"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Número do CRO:</label>
                  <input
                    type="text"
                    required
                    value={cro}
                    onChange={(e) => setCro(e.target.value)}
                    placeholder="Ex: CRO-RO 7841"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Telefone / WhatsApp:</label>
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(69) 99999-0000"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">E-mail Profissional:</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="dentista@clinica.com"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Consultório / Sala Atribuída:</label>
                <input
                  type="text"
                  value={consultorio}
                  onChange={(e) => setConsultorio(e.target.value)}
                  placeholder="Ex: Consultório 01 (Ortodontia)"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Horário de Início:</label>
                  <input
                    type="time"
                    value={horarioInicio}
                    onChange={(e) => setHorarioInicio(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Horário de Término:</label>
                  <input
                    type="time"
                    value={horarioFim}
                    onChange={(e) => setHorarioFim(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium"
                  />
                </div>
              </div>

              {/* Seletor Multi-Especialidade */}
              <div>
                <label className="font-bold text-slate-300 block mb-1.5">Especialidades Odontológicas:</label>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-slate-950 rounded-2xl border border-slate-800">
                  {ESPECIALIDADES_DISPONIVEIS.map((esp) => {
                    const sel = especialidadesSelecionadas.includes(esp);
                    return (
                      <button
                        key={esp}
                        type="button"
                        onClick={() => toggleEspecialidade(esp)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-xl border transition-colors cursor-pointer ${
                          sel ? 'bg-teal-500/20 text-teal-300 border-teal-500/50' : 'bg-slate-900 text-slate-400 border-slate-800'
                        }`}
                      >
                        {sel ? '✓ ' : ''}{esp}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 text-slate-950 font-black cursor-pointer shadow-lg shadow-teal-500/20"
                >
                  Salvar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

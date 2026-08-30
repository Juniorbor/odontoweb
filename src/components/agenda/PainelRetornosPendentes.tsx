import React, { useState, useEffect } from 'react';
import { Bell, Clock, AlertCircle, CheckCircle2, Send } from 'lucide-react';
import type { ConsultaInteligente } from '../../types/agendaInteligente';
import { getConsultasInteligentesLocais } from '../../services/agendaService';
import { enviarLembreteConsultaWhatsApp } from '../../services/whatsappService';

interface PainelRetornosPendentesProps {
  darkMode?: boolean;
  usuarioId?: string;
}

export const PainelRetornosPendentes: React.FC<PainelRetornosPendentesProps> = ({ darkMode, usuarioId }) => {
  const [consultas, setConsultas] = useState<ConsultaInteligente[]>([]);
  const [periodoFiltro, setPeriodoFiltro] = useState<'todos' | '1m' | '3m' | '6m' | '12m' | 'atrasados'>('todos');
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  useEffect(() => {
    setConsultas(getConsultasInteligentesLocais(usuarioId));
  }, [usuarioId]);

  const hojeStr = new Date().toISOString().split('T')[0];

  // Filtra consultas que possuem retorno programado
  const retornosTotais = consultas.filter((c) => c.necessitaRetorno && c.dataRetornoPrevisto);

  const retornos1m = retornosTotais.filter((c) => c.periodoRetornoRecomendado === '1m');
  const retornos3m = retornosTotais.filter((c) => c.periodoRetornoRecomendado === '3m');
  const retornos6m = retornosTotais.filter((c) => c.periodoRetornoRecomendado === '6m');
  const retornos12m = retornosTotais.filter((c) => c.periodoRetornoRecomendado === '12m');

  const retornosAtrasados = retornosTotais.filter((c) => c.dataRetornoPrevisto && c.dataRetornoPrevisto < hojeStr);

  const retornosExibidos = retornosTotais.filter((c) => {
    if (periodoFiltro === '1m') return c.periodoRetornoRecomendado === '1m';
    if (periodoFiltro === '3m') return c.periodoRetornoRecomendado === '3m';
    if (periodoFiltro === '6m') return c.periodoRetornoRecomendado === '6m';
    if (periodoFiltro === '12m') return c.periodoRetornoRecomendado === '12m';
    if (periodoFiltro === 'atrasados') return c.dataRetornoPrevisto && c.dataRetornoPrevisto < hojeStr;
    return true;
  });

  const handleEnviarWhatsAppRetorno = (c: ConsultaInteligente) => {
    const res = enviarLembreteConsultaWhatsApp(c, 'RETORNO', usuarioId);
    window.open(res.linkWhatsAppDirect, '_blank');
    setMensagemSucesso(`✅ Lembrete de retorno registrado para ${c.pacienteNome}!`);
    setTimeout(() => setMensagemSucesso(null), 4000);
  };

  const calcularDiasAtraso = (dataPrevista: string) => {
    const diffTime = Date.now() - new Date(dataPrevista).getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <div className="space-y-6 font-sans animate-fadeIn">
      {/* Header do Módulo */}
      <div className={`p-6 rounded-3xl border shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/30 shrink-0">
            <Bell className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Painel Inteligente de Retornos Pendentes</h2>
            <p className="text-xs text-slate-400">
              Identificação de pacientes para retornos preventivos em 1, 3, 6 e 12 meses.
            </p>
          </div>
        </div>
      </div>

      {mensagemSucesso && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{mensagemSucesso}</span>
        </div>
      )}

      {/* CARDS DE RESUMO POR PERÍODO */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Retornos 1 Mês', count: retornos1m.length, key: '1m', color: 'border-sky-500/40 text-sky-400' },
          { label: 'Retornos 3 Meses', count: retornos3m.length, key: '3m', color: 'border-teal-500/40 text-teal-400' },
          { label: 'Retornos 6 Meses', count: retornos6m.length, key: '6m', color: 'border-emerald-500/40 text-emerald-400' },
          { label: 'Retornos 12 Meses', count: retornos12m.length, key: '12m', color: 'border-amber-500/40 text-amber-400' },
          { label: '🔴 Retornos Atrasados', count: retornosAtrasados.length, key: 'atrasados', color: 'border-rose-500/50 text-rose-400' }
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setPeriodoFiltro(item.key as any)}
            className={`p-4 rounded-3xl border shadow-lg text-left transition-all cursor-pointer ${
              periodoFiltro === item.key ? 'bg-slate-800 ring-2 ring-teal-500' : 'bg-slate-900/90 border-slate-800'
            }`}
          >
            <span className="text-[11px] font-extrabold text-slate-400 block">{item.label}</span>
            <span className={`text-2xl font-black ${item.color} mt-1 block`}>{item.count}</span>
          </button>
        ))}
      </div>

      {/* LISTA DE PACIENTES PARA RETORNO */}
      <div className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
        darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-400" /> Pacientes Elegíveis para Retorno ({retornosExibidos.length})
          </h3>

          <button
            onClick={() => setPeriodoFiltro('todos')}
            className="text-xs text-teal-400 font-bold hover:underline cursor-pointer"
          >
            Ver Todos
          </button>
        </div>

        {retornosExibidos.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <p>Nenhum paciente pendente de retorno neste período!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {retornosExibidos.map((c) => {
              const atrasado = c.dataRetornoPrevisto && c.dataRetornoPrevisto < hojeStr;
              const diasAtraso = c.dataRetornoPrevisto ? calcularDiasAtraso(c.dataRetornoPrevisto) : 0;

              return (
                <div
                  key={c.id}
                  className={`p-4 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-colors ${
                    atrasado ? 'bg-rose-950/20 border-rose-500/40' : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-white">{c.pacienteNome}</span>
                      {atrasado ? (
                        <span className="bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {diasAtraso} dias em atraso
                        </span>
                      ) : (
                        <span className="bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Retorno Preventivo ({c.periodoRetornoRecomendado || '6m'})
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                      <span>Último Procedimento: <strong className="text-slate-200">{c.procedimento}</strong></span>
                      <span>Dentista: <strong className="text-slate-200">{c.dentistaNome}</strong></span>
                      <span>Data Prevista: <strong className="text-amber-400">{c.dataRetornoPrevisto ? new Date(c.dataRetornoPrevisto + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A'}</strong></span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleEnviarWhatsAppRetorno(c)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black px-4 py-2.5 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/20 shrink-0 w-full sm:w-auto"
                  >
                    <Send className="w-4 h-4" /> 📲 Enviar Lembrete via WhatsApp
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

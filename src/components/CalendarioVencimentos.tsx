import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import type { TransacaoPessoal } from '../types';

interface CalendarioVencimentosProps {
  transacoes: TransacaoPessoal[];
  darkMode?: boolean;
}

export const CalendarioVencimentos: React.FC<CalendarioVencimentosProps> = ({
  transacoes,
  darkMode
}) => {
  const [dataAtual, setDataAtual] = useState<Date>(new Date());

  const ano = dataAtual.getFullYear();
  const mes = dataAtual.getMonth();

  const primeiroDiaMes = new Date(ano, mes, 1);
  const ultimoDiaMes = new Date(ano, mes + 1, 0);
  const totalDiasMes = ultimoDiaMes.getDate();
  const diaInicioSemana = primeiroDiaMes.getDay(); // 0 = Domingo

  const nomeMesAno = dataAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const mudarMes = (delta: number) => {
    setDataAtual(new Date(ano, mes + delta, 1));
  };

  const diasDoMes = Array.from({ length: totalDiasMes }, (_, i) => i + 1);

  // Mapeia transações por dia do mês
  const transacoesPorDia = (dia: number) => {
    const stringDia = dia < 10 ? `0${dia}` : `${dia}`;
    const stringMes = mes + 1 < 10 ? `0${mes + 1}` : `${mes + 1}`;
    const dataIso = `${ano}-${stringMes}-${stringDia}`;

    return transacoes.filter((t) => t.data === dataIso);
  };

  const hojeIso = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 font-sans animate-fadeIn">
      {/* Top Banner Calendário */}
      <div className={`p-6 rounded-3xl border shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
        darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20 shrink-0">
            <Calendar className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30 uppercase tracking-widest">
              Organizador Doméstico Pessoal
            </span>
            <h3 className="text-xl font-bold mt-1 flex items-center gap-2 text-white">
              Calendário Visual de Vencimentos das Contas do Lar
            </h3>
            <p className="text-xs text-slate-400 font-normal">
              Visualização por dia para não esquecer o pagamento de nenhuma conta da casa e evitar juros.
            </p>
          </div>
        </div>

        {/* NAVEGAÇÃO ENTRE MESES */}
        <div className="flex items-center gap-3 bg-slate-950 p-2 rounded-2xl border border-slate-800 shrink-0">
          <button
            onClick={() => mudarMes(-1)}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold text-white uppercase tracking-wider capitalize px-2">
            {nomeMesAno}
          </span>
          <button
            onClick={() => mudarMes(1)}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* LEGENDA DE CORES */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-semibold px-2">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
          <span>Contas Liquidadas / Entradas</span>
        </div>
        <div className="flex items-center gap-1.5 text-amber-400">
          <span className="w-3 h-3 rounded-full bg-amber-500"></span>
          <span>Vencimento HOJE</span>
        </div>
        <div className="flex items-center gap-1.5 text-rose-400">
          <span className="w-3 h-3 rounded-full bg-rose-500"></span>
          <span>Contas a Pagar / Pendentes</span>
        </div>
      </div>

      {/* GRID DO CALENDÁRIO */}
      <div className={`p-6 rounded-3xl border shadow-xl ${
        darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* DIAS DA SEMANA */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase text-slate-400 pb-3 border-b border-slate-800">
          <div>Dom</div>
          <div>Seg</div>
          <div>Ter</div>
          <div>Qua</div>
          <div>Qui</div>
          <div>Sex</div>
          <div>Sáb</div>
        </div>

        {/* CÉLULAS DOS DIAS */}
        <div className="grid grid-cols-7 gap-2 pt-3">
          {/* Células vazias de início do mês */}
          {Array.from({ length: diaInicioSemana }).map((_, idx) => (
            <div key={`empty-${idx}`} className="min-h-[85px] rounded-2xl bg-slate-950/20 border border-slate-900/30 opacity-30"></div>
          ))}

          {/* Dias do Mês */}
          {diasDoMes.map((dia) => {
            const contasNoDia = transacoesPorDia(dia);
            const stringDia = dia < 10 ? `0${dia}` : `${dia}`;
            const stringMes = mes + 1 < 10 ? `0${mes + 1}` : `${mes + 1}`;
            const dataIsoDia = `${ano}-${stringMes}-${stringDia}`;
            const eHoje = dataIsoDia === hojeIso;

            return (
              <div
                key={`dia-${dia}`}
                className={`min-h-[85px] p-2 rounded-2xl border transition-all space-y-1 ${
                  eHoje
                    ? 'bg-amber-500/10 border-amber-500/60 ring-2 ring-amber-500/30'
                    : contasNoDia.length > 0
                    ? 'bg-slate-950 border-slate-800'
                    : 'bg-slate-950/40 border-slate-900/50'
                }`}
              >
                <div className="flex justify-between items-center text-xs">
                  <span className={`font-bold px-1.5 py-0.5 rounded-md ${
                    eHoje ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400'
                  }`}>
                    {dia}
                  </span>
                  {contasNoDia.length > 0 && (
                    <span className="text-[9px] font-semibold text-slate-400">
                      {contasNoDia.length} conta(s)
                    </span>
                  )}
                </div>

                {/* Lista de Contas no Dia */}
                <div className="space-y-1 max-h-[60px] overflow-y-auto pr-0.5">
                  {contasNoDia.map((t) => (
                    <div
                      key={t.id}
                      className={`p-1 rounded-lg text-[10px] font-semibold truncate border flex justify-between items-center ${
                        t.tipo === 'Entrada'
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                          : t.status === 'Pago'
                          ? 'bg-slate-800/80 border-slate-700 text-slate-300'
                          : eHoje
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                          : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                      }`}
                      title={`${t.descricao}: R$ ${t.valor.toFixed(2)} (${t.status})`}
                    >
                      <span className="truncate">{t.descricao}</span>
                      <span className="shrink-0 font-bold ml-1">R$ {Math.round(t.valor)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { PieChart } from 'lucide-react';
import type { TransacaoPessoal } from '../types';

interface DREGerencialProps {
  transacoesFinanceiras: TransacaoPessoal[];
  darkMode?: boolean;
}

export const DREGerencial: React.FC<DREGerencialProps> = ({
  transacoesFinanceiras,
  darkMode
}) => {
  // 1. Receita Bruta Total (Salário e Entradas Registradas pelo Usuário)
  const receitaBrutaTotal = transacoesFinanceiras
    .filter((t) => t.tipo === 'Entrada')
    .reduce((acc, t) => acc + t.valor, 0);

  // 2. Despesas Fixas (Custos Operacionais Fixos do Lar)
  const despesasFixas = transacoesFinanceiras
    .filter((t) => t.tipo === 'Despesa Fixa')
    .reduce((acc, t) => acc + t.valor, 0);

  // 3. Despesas Variáveis (Custos Variáveis / Cartões de Crédito)
  const despesasVariaveis = transacoesFinanceiras
    .filter((t) => t.tipo === 'Despesa Variável')
    .reduce((acc, t) => acc + t.valor, 0);

  const totalDespesas = despesasFixas + despesasVariaveis;

  // 4. Resultado Líquido Final (Saldo Líquido Real)
  const lucroLiquidoReal = receitaBrutaTotal - totalDespesas;
  const margemLucroPct = receitaBrutaTotal > 0 ? Math.round((lucroLiquidoReal / receitaBrutaTotal) * 100) : 0;

  // PROJEÇÃO DE FLUXO DE CAIXA DE 30, 60 E 90 DIAS
  const projecao30Dias = Math.round(lucroLiquidoReal);
  const projecao60Dias = Math.round(lucroLiquidoReal * 2);
  const projecao90Dias = Math.round(lucroLiquidoReal * 3);

  return (
    <div className="space-y-6 font-sans animate-fadeIn">
      {/* Banner DRE Gerencial */}
      <div className={`p-6 rounded-3xl border shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
        darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 shrink-0">
            <PieChart className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-widest">
              Demonstrativo do Resultado do Exercício (DRE Pessoal)
            </span>
            <h3 className="text-xl font-bold mt-1 flex items-center gap-2 text-white">
              DRE Gerencial Pessoal & Projeção de Fluxo de Caixa
            </h3>
            <p className="text-xs text-slate-400 font-normal">
              Estrutura contábil simplificada para acompanhar receitas, custos fixos do lar e capacidade de investimento.
            </p>
          </div>
        </div>
      </div>

      {/* TABELA CONTÁBIL DRE */}
      <div className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
        darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <h4 className="font-bold text-sm text-white uppercase tracking-wider border-b border-slate-800 pb-2">
          Demonstrativo Consolidado do Mês (R$)
        </h4>

        <div className="space-y-2 text-xs font-normal">
          {/* RECEITA BRUTA */}
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex justify-between items-center">
            <span className="font-bold text-emerald-300">(+) RECEITA BRUTA TOTAL (Salário & Entradas)</span>
            <strong className="text-emerald-400 text-sm font-bold">R$ {receitaBrutaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
          </div>

          {/* DESPESAS FIXAS */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center">
            <span className="text-slate-300">(-) Despesas Fixas do Lar (Aluguel, Luz, Faculdade)</span>
            <strong className="text-rose-400 font-bold">R$ {despesasFixas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
          </div>

          {/* DESPESAS VARIÁVEIS */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center">
            <span className="text-slate-300">(-) Despesas Variáveis & Cartões de Crédito</span>
            <strong className="text-amber-400 font-bold">R$ {despesasVariaveis.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
          </div>

          {/* TOTAL DE CUSTOS */}
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex justify-between items-center">
            <span className="font-bold text-rose-300">(=) TOTAL DE DESPESAS ACUMULADAS</span>
            <strong className="text-rose-400 text-sm font-bold">R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
          </div>

          {/* RESULTADO LÍQUIDO */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 to-emerald-950 border border-emerald-500/40 flex justify-between items-center text-sm font-bold">
            <span className="text-white">(=) RESULTADO LÍQUIDO DO MÊS (Sobra / Economia)</span>
            <strong className={lucroLiquidoReal >= 0 ? 'text-emerald-400 text-base' : 'text-rose-400 text-base'}>
              R$ {lucroLiquidoReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({margemLucroPct}%)
            </strong>
          </div>
        </div>
      </div>

      {/* PROJEÇÃO PREDITIVA DE FLUXO DE CAIXA DE 30, 60 E 90 DIAS */}
      <div className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
        darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <h4 className="font-bold text-sm text-white uppercase tracking-wider border-b border-slate-800 pb-2">
          🔮 Projeção Preditiva de Fluxo de Caixa do Lar (Acumulado)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-normal">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-400 font-semibold block">Projeção Próximos 30 Dias</span>
            <strong className={`text-lg font-black block ${projecao30Dias >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              R$ {projecao30Dias.toLocaleString('pt-BR')}
            </strong>
            <span className="text-[10px] text-slate-500 block">Estimativa mantendo o padrão atual</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-400 font-semibold block">Projeção Próximos 60 Dias</span>
            <strong className={`text-lg font-black block ${projecao60Dias >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              R$ {projecao60Dias.toLocaleString('pt-BR')}
            </strong>
            <span className="text-[10px] text-slate-500 block">Acumulado projetado para 2 meses</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-400 font-semibold block">Projeção Próximos 90 Dias</span>
            <strong className={`text-lg font-black block ${projecao90Dias >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              R$ {projecao90Dias.toLocaleString('pt-BR')}
            </strong>
            <span className="text-[10px] text-slate-500 block">Acumulado projetado para 3 meses</span>
          </div>
        </div>
      </div>
    </div>
  );
};

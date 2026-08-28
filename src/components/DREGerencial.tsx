import React from 'react';
import {
  PieChart,
  Calendar,
  FileSpreadsheet
} from 'lucide-react';
import type { ItemProducaoTomo, TransacaoPessoal } from '../types';

interface DREGerencialProps {
  itensProducao: ItemProducaoTomo[];
  transacoesFinanceiras: TransacaoPessoal[];
  darkMode?: boolean;
}

export const DREGerencial: React.FC<DREGerencialProps> = ({
  itensProducao,
  transacoesFinanceiras,
  darkMode
}) => {
  // 1. Receita Bruta de Operações (Produção Unificada)
  const receitaProducaoTotal = itensProducao.reduce((acc, i) => acc + i.valor, 0);

  // 2. Outras Receitas e Entradas
  const outrasReceitas = transacoesFinanceiras
    .filter((t) => t.tipo === 'Entrada')
    .reduce((acc, t) => acc + t.valor, 0);

  const receitaBrutaTotal = receitaProducaoTotal + outrasReceitas;

  // 3. Despesas Fixas (Custos Operacionais Fixos da Casa / Empresa)
  const despesasFixas = transacoesFinanceiras
    .filter((t) => t.tipo === 'Despesa Fixa')
    .reduce((acc, t) => acc + t.valor, 0);

  // 4. Despesas Variáveis (Custos Variáveis / Cartões)
  const despesasVariaveis = transacoesFinanceiras
    .filter((t) => t.tipo === 'Despesa Variável')
    .reduce((acc, t) => acc + t.valor, 0);

  const totalDespesas = despesasFixas + despesasVariaveis;

  // 5. Resultado Líquido Final (Lucro Líquido Real)
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
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 shrink-0">
            <PieChart className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-widest">
                Demonstrativo Contábil Simplificado
              </span>
              <span className="text-[10px] font-semibold text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/30">
                DRE Gerencial
              </span>
            </div>
            <h2 className="text-xl font-bold mt-0.5 flex items-center gap-2 text-white">
              Demonstrativo de Resultado do Exercício (DRE) & Fluxo Preditivo
            </h2>
            <p className="text-xs text-slate-400 font-normal">
              Balanço oficial de Receitas Brutas, Custos Operacionais e Lucro Líquido Real para tomada de decisão.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800 shrink-0">
          <div className="text-right">
            <span className="text-[10px] font-semibold uppercase text-slate-400 block">Margem de Lucro Real</span>
            <span className={`text-lg font-bold ${margemLucroPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {margemLucroPct}% Lucratividade
            </span>
          </div>
        </div>
      </div>

      {/* ESTRUTURA FORMAL DRE */}
      <div className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
        darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <h3 className="font-bold text-base text-white border-b border-slate-800 pb-3 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-teal-400" /> Estrutura do DRE Gerencial Consolidado
        </h3>

        <div className="space-y-2 text-xs font-normal">
          {/* Linha 1: Receita Bruta da Produção */}
          <div className="flex justify-between items-center p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
            <div className="flex items-center gap-2 font-semibold text-slate-200">
              <span className="text-teal-400 font-bold">(+)</span>
              <span>Receita Bruta de Operações (Produção Unificada das Clínicas)</span>
            </div>
            <span className="font-bold text-emerald-400 text-sm">
              R$ {receitaProducaoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Linha 2: Outras Entradas */}
          <div className="flex justify-between items-center p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
            <div className="flex items-center gap-2 font-semibold text-slate-200">
              <span className="text-teal-400 font-bold">(+)</span>
              <span>Outras Entradas & Rendas Pessoais</span>
            </div>
            <span className="font-bold text-emerald-400 text-sm">
              R$ {outrasReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Subtotal Receita Bruta Total */}
          <div className="flex justify-between items-center p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold">
            <span>(=) RECEITA BRUTA TOTAL ACUMULADA</span>
            <span className="font-bold text-emerald-400 text-base">
              R$ {receitaBrutaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Linha 3: Despesas Fixas */}
          <div className="flex justify-between items-center p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
            <div className="flex items-center gap-2 font-semibold text-slate-200">
              <span className="text-rose-400 font-bold">(-)</span>
              <span>Custos Fixos Operacionais (Aluguel, Folha, Contas da Casa)</span>
            </div>
            <span className="font-bold text-rose-400 text-sm">
              R$ {despesasFixas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Linha 4: Despesas Variáveis */}
          <div className="flex justify-between items-center p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
            <div className="flex items-center gap-2 font-semibold text-slate-200">
              <span className="text-rose-400 font-bold">(-)</span>
              <span>Despesas Variáveis & Cartões de Crédito</span>
            </div>
            <span className="font-bold text-rose-400 text-sm">
              R$ {despesasVariaveis.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Subtotal Total de Custos */}
          <div className="flex justify-between items-center p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 font-semibold">
            <span>(=) TOTAL DE DESPESAS & CUSTOS OPERACIONAIS</span>
            <span className="font-bold text-rose-400 text-base">
              R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Linha Final: Lucro Líquido Real */}
          <div className={`flex justify-between items-center p-4 rounded-2xl border text-white font-bold text-sm ${
            lucroLiquidoReal >= 0
              ? 'bg-gradient-to-r from-teal-950 via-slate-950 to-emerald-950 border-emerald-500/50'
              : 'bg-gradient-to-r from-rose-950 via-slate-950 to-slate-900 border-rose-500/50'
          }`}>
            <span className="uppercase tracking-wider">(=) RESULTADO LÍQUIDO REAL DO PERÍODO (LUCRO)</span>
            <span className={`text-xl font-bold ${lucroLiquidoReal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              R$ {lucroLiquidoReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* PROJEÇÃO PREDITIVA DE FLUXO DE CAIXA */}
      <div className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
        darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <span className="text-[10px] font-semibold uppercase text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded border border-sky-500/20">
              Visão Preditiva
            </span>
            <h3 className="font-bold text-base text-white mt-0.5 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-sky-400" /> Projeção de Fluxo de Caixa Futuro (30, 60 e 90 dias)
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-semibold uppercase text-sky-400 block">Projeção em 30 Dias</span>
            <h4 className="text-xl font-bold text-white">
              R$ {projecao30Dias.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h4>
            <span className="text-[10px] text-slate-400 block">Estimativa de caixa disponível no próximo mês</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-semibold uppercase text-indigo-400 block">Projeção em 60 Dias</span>
            <h4 className="text-xl font-bold text-white">
              R$ {projecao60Dias.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h4>
            <span className="text-[10px] text-slate-400 block">Estimativa acumulada para 2 meses</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-semibold uppercase text-emerald-400 block">Projeção em 90 Dias</span>
            <h4 className="text-xl font-bold text-emerald-400">
              R$ {projecao90Dias.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h4>
            <span className="text-[10px] text-slate-400 block">Estimativa trimestral de caixa livre</span>
          </div>
        </div>
      </div>
    </div>
  );
};

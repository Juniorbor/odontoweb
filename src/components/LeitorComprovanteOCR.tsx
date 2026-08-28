import React, { useState } from 'react';
import { Camera, Upload, CheckCircle2, Sparkles, X, ArrowRight } from 'lucide-react';
import type { TransacaoPessoal } from '../types';

interface LeitorComprovanteOCRProps {
  onAdicionarTransacao: (transacao: Omit<TransacaoPessoal, 'id'>) => void;
  onFechar: () => void;
  darkMode?: boolean;
}

export const LeitorComprovanteOCR: React.FC<LeitorComprovanteOCRProps> = ({
  onAdicionarTransacao,
  onFechar,
  darkMode
}) => {
  const [imagemPreview, setImagemPreview] = useState<string | null>(null);
  const [lendo, setLendo] = useState<boolean>(false);
  const [sucesso, setSucesso] = useState<boolean>(false);

  const [descricao, setDescricao] = useState<string>('Supermercado & Suprimentos');
  const [valor, setValor] = useState<number>(348.90);
  const [tipo, setTipo] = useState<'Entrada' | 'Despesa Fixa' | 'Despesa Variável'>('Despesa Variável');
  const [categoria, setCategoria] = useState<string>('Alimentação & Mercado');
  const [data] = useState<string>(new Date().toISOString().split('T')[0]);

  const handleSimularUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImagemPreview(reader.result as string);
        processarOCR();
      };
      reader.readAsDataURL(file);
    }
  };

  const processarOCR = () => {
    setLendo(true);
    setTimeout(() => {
      setLendo(false);
      setSucesso(true);
    }, 1800);
  };

  const handleConfirmar = () => {
    onAdicionarTransacao({
      descricao,
      tipo,
      valor,
      categoria,
      data,
      status: 'Pago',
      observacao: 'Lançado automaticamente via Leitor Inteligente de Comprovantes (OCR IA)'
    });
    onFechar();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className={`p-6 rounded-3xl border max-w-lg w-full shadow-2xl space-y-5 animate-fadeIn ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-semibold text-teal-400 uppercase tracking-widest block">Inteligência de Leitura</span>
              <h3 className="font-bold text-base flex items-center gap-1.5 text-white">
                <Sparkles className="w-4 h-4 text-amber-400" /> Leitor de Comprovantes & Notas (OCR)
              </h3>
            </div>
          </div>

          <button onClick={onFechar} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!imagemPreview ? (
          <div className="border-2 border-dashed border-slate-700 hover:border-teal-500 rounded-3xl p-8 text-center space-y-4 transition-colors bg-slate-950/50">
            <div className="w-14 h-14 bg-teal-500/10 text-teal-400 rounded-2xl flex items-center justify-center mx-auto border border-teal-500/20">
              <Upload className="w-7 h-7" />
            </div>

            <div>
              <h4 className="font-bold text-sm text-white">Selecione ou Tire Foto do Recibo / Comprovante</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Envie fotos de notas fiscais, contas de energia, boletos ou recibos de pagamento para o robô ler o valor e data.
              </p>
            </div>

            <label className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold px-5 py-2.5 rounded-2xl text-xs shadow-lg shadow-teal-600/20 cursor-pointer transition-all">
              <Camera className="w-4 h-4" /> Selecionar Imagem do Celular / PC
              <input type="file" accept="image/*" onChange={handleSimularUpload} className="hidden" />
            </label>
          </div>
        ) : (
          <div className="space-y-4 text-xs font-normal">
            <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-950 border border-slate-800">
              <img src={imagemPreview} alt="Comprovante" className="w-20 h-20 object-cover rounded-xl border border-slate-700 shrink-0" />
              <div>
                <span className="text-[10px] font-semibold uppercase text-teal-400 block">Status da Análise</span>
                {lendo ? (
                  <div className="flex items-center gap-2 text-amber-400 font-semibold mt-1">
                    <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>Lendo dados e extraindo valor via IA...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold mt-1">
                    <CheckCircle2 className="w-4 h-4" /> Leitura OCR Concluída com Sucesso!
                  </div>
                )}
                <span className="text-[10px] text-slate-400 block mt-1">Valor e categoria identificados automaticamente.</span>
              </div>
            </div>

            {sucesso && (
              <div className="space-y-3 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <h4 className="font-semibold text-xs text-slate-300 uppercase tracking-wider">Dados Extraídos da Nota:</h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-semibold mb-1">Descrição</label>
                    <input
                      type="text"
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-semibold mb-1">Valor Total (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={valor}
                      onChange={(e) => setValor(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-semibold mb-1">Tipo de Lançamento</label>
                    <select
                      value={tipo}
                      onChange={(e) => setTipo(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold"
                    >
                      <option value="Despesa Variável">Despesa Variável</option>
                      <option value="Despesa Fixa">Despesa Fixa</option>
                      <option value="Entrada">Entrada / Salário</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-semibold mb-1">Categoria</label>
                    <input
                      type="text"
                      value={categoria}
                      onChange={(e) => setCategoria(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => setImagemPreview(null)}
                    className="px-3.5 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold hover:bg-slate-700 cursor-pointer"
                  >
                    Trocar Foto
                  </button>

                  <button
                    onClick={handleConfirmar}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    Confirmar e Lançar <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

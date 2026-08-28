import React, { useState } from 'react';
import { Mic, Sparkles, X, ArrowRight } from 'lucide-react';
import type { TransacaoPessoal } from '../types';

interface ComandoVozModalProps {
  onAdicionarTransacao: (transacao: Omit<TransacaoPessoal, 'id'>) => void;
  onFechar: () => void;
  darkMode?: boolean;
}

export const ComandoVozModal: React.FC<ComandoVozModalProps> = ({
  onAdicionarTransacao,
  onFechar,
  darkMode
}) => {
  const [ouvindo, setOuvindo] = useState<boolean>(false);
  const [textoVoz, setTextoVoz] = useState<string>('');

  const [descricao, setDescricao] = useState<string>('Abastecimento de Combustível');
  const [valor, setValor] = useState<number>(150);
  const [tipo] = useState<'Entrada' | 'Despesa Fixa' | 'Despesa Variável'>('Despesa Variável');
  const [categoria] = useState<string>('Transporte & Combustível');

  const iniciarGravacaoVoz = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Seu navegador não suporta reconhecimento de voz direto. Simulando entrada por voz!');
      simularVoz();
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = false;

      recognition.onstart = () => {
        setOuvindo(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setTextoVoz(transcript);
        setOuvindo(false);
        processarTextoVoz(transcript);
      };

      recognition.onerror = () => {
        setOuvindo(false);
        simularVoz();
      };

      recognition.start();
    } catch (e) {
      simularVoz();
    }
  };

  const simularVoz = () => {
    setOuvindo(true);
    setTimeout(() => {
      setOuvindo(false);
      const vozSimulada = "Lançar 150 reais de combustível";
      setTextoVoz(vozSimulada);
      processarTextoVoz(vozSimulada);
    }, 1500);
  };

  const processarTextoVoz = (texto: string) => {
    const regexNumeros = /\d+/g;
    const numerosEncontrados = texto.match(regexNumeros);
    if (numerosEncontrados && numerosEncontrados.length > 0) {
      setValor(Number(numerosEncontrados[0]));
    }
    setDescricao(texto);
  };

  const handleConfirmar = () => {
    onAdicionarTransacao({
      descricao,
      tipo,
      valor,
      categoria,
      data: new Date().toISOString().split('T')[0],
      status: 'Pago',
      observacao: 'Lançado via Comando de Voz'
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
            <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-widest block">Inteligência de Voz</span>
              <h3 className="font-bold text-base flex items-center gap-1.5 text-white">
                <Sparkles className="w-4 h-4 text-amber-400" /> Lançamento Rápido por Voz
              </h3>
            </div>
          </div>

          <button onClick={onFechar} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center space-y-4">
          <button
            onClick={iniciarGravacaoVoz}
            disabled={ouvindo}
            className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-all cursor-pointer shadow-xl ${
              ouvindo
                ? 'bg-rose-500 text-white animate-pulse ring-8 ring-rose-500/30'
                : 'bg-gradient-to-tr from-rose-600 to-amber-500 text-white hover:scale-105'
            }`}
          >
            {ouvindo ? <Mic className="w-8 h-8 animate-bounce" /> : <Mic className="w-8 h-8" />}
          </button>

          <p className="text-xs text-slate-400">
            {ouvindo ? '🎙️ Fale agora (Ex: "Lançar 50 reais de mercado")...' : 'Clique no microfone para falar o lançamento.'}
          </p>

          {textoVoz && (
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-semibold text-emerald-400">
              Voz Reconhecida: "{textoVoz}"
            </div>
          )}
        </div>

        <div className="space-y-3 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-slate-400 font-semibold mb-1">Descrição Reconhecida</label>
              <input
                type="text"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-semibold mb-1">Valor (R$)</label>
              <input
                type="number"
                value={valor}
                onChange={(e) => setValor(Number(e.target.value))}
                className="w-full p-2 rounded-xl bg-slate-900 border border-slate-700 text-emerald-400 font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={handleConfirmar}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Confirmar Lançamento <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

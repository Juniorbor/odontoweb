import React, { useState } from 'react';
import { FileText, Printer, Send } from 'lucide-react';

interface GeradorReciboPessoalProps {
  darkMode?: boolean;
}

export const GeradorReciboPessoal: React.FC<GeradorReciboPessoalProps> = ({ darkMode }) => {
  const [pagador, setPagador] = useState<string>('Crenilto Junior');
  const [cpfPagador, setCpfPagador] = useState<string>('000.000.000-00');
  const [beneficiario, setBeneficiario] = useState<string>('Prestador de Serviço / Imobiliária');
  const [valor, setValor] = useState<number>(1200);
  const [referenteA, setReferenteA] = useState<string>('Pagamento de Aluguel da Residência - Mês Atual');
  const [cidade, setCidade] = useState<string>('Porto Velho - RO');
  const [data, setData] = useState<string>(new Date().toISOString().split('T')[0]);

  const dataFormatada = new Date(data + 'T00:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const handleEnviarWhatsApp = () => {
    const texto = `*🧾 RECIBO DE PAGAMENTO - FINANÇAS PESSOAL*\n\n` +
      `Recebi(emos) de *${pagador}* (CPF/CNPJ: ${cpfPagador})\n` +
      `A quantia de *R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*\n` +
      `Referente a: _${referenteA}_\n\n` +
      `📍 ${cidade}, ${dataFormatada}\n` +
      `✍️ *Assinado por:* ${beneficiario}\n\n` +
      `✅ _Comprovante emitido via Finanças Pessoal Platform._`;

    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 font-sans animate-fadeIn">
      {/* Header Gerador de Recibo */}
      <div className={`p-6 rounded-3xl border shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
        darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-teal-500/10 text-teal-400 rounded-2xl border border-teal-500/20 shrink-0">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/30 uppercase tracking-widest">
              Emissão de Comprovante Pessoal
            </span>
            <h3 className="text-xl font-bold mt-1 flex items-center gap-2 text-white">
              Gerador de Recibos Digitais Pessoais & do Lar
            </h3>
            <p className="text-xs text-slate-400 font-normal">
              Emita recibos formais de aluguel, prestação de serviços domésticos ou reformas para imprimir ou enviar no WhatsApp.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => window.print()}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 border border-slate-700 cursor-pointer shadow"
          >
            <Printer className="w-4 h-4 text-teal-400" /> Imprimir Recibo em PDF
          </button>

          <button
            onClick={handleEnviarWhatsApp}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 cursor-pointer"
          >
            <Send className="w-4 h-4" /> Enviar Recibo no WhatsApp
          </button>
        </div>
      </div>

      {/* FORMULÁRIO E MODELO VISUAL DO RECIBO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs font-normal">
        
        {/* Formulário de Preenchimento */}
        <div className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
          darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <h4 className="font-bold text-sm text-white uppercase tracking-wider border-b border-slate-800 pb-2">
            Dados para o Recibo Pessoal:
          </h4>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Quem Pagou (Nome Completo)</label>
              <input
                type="text"
                value={pagador}
                onChange={(e) => setPagador(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">CPF / CNPJ do Pagador</label>
                <input
                  type="text"
                  value={cpfPagador}
                  onChange={(e) => setCpfPagador(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Valor Total (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={valor}
                  onChange={(e) => setValor(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Referente A (Motivo do Pagamento)</label>
              <input
                type="text"
                value={referenteA}
                onChange={(e) => setReferenteA(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Quem Recebeu (Beneficiário)</label>
              <input
                type="text"
                value={beneficiario}
                onChange={(e) => setBeneficiario(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Cidade / Estado</label>
                <input
                  type="text"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Data do Recibo</label>
                <input
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modelo Impresso Visual do Recibo */}
        <div className="p-6 rounded-3xl border border-slate-700 bg-white text-slate-900 shadow-2xl space-y-6 flex flex-col justify-between font-serif">
          <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-center font-sans">
            <div>
              <h3 className="font-black text-xl text-slate-900 uppercase tracking-widest">RECIBO</h3>
              <span className="text-[10px] text-slate-500 font-bold block">COMPROVANTE FORMAL DE PAGAMENTO</span>
            </div>
            <div className="p-2 bg-slate-100 rounded-xl border border-slate-300 text-right">
              <span className="text-xs font-bold text-slate-500 block">VALOR</span>
              <span className="text-lg font-black text-emerald-700">R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="space-y-4 font-sans text-xs leading-relaxed text-slate-800">
            <p>
              Recebi(emos) de <strong className="font-bold text-slate-950 uppercase">{pagador}</strong>, inscrito(a) no CPF/CNPJ nº <strong className="font-bold">{cpfPagador}</strong>, a quantia exata de <strong className="font-bold text-emerald-800 text-sm">R$ {valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>.
            </p>

            <p className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <strong>Referente a:</strong> {referenteA}
            </p>

            <p>
              Para clareza e fins de direito, firmo(amos) o presente recibo dando plena quitação do valor recebido.
            </p>
          </div>

          <div className="pt-6 font-sans text-xs space-y-4 text-center">
            <p className="text-slate-600 font-medium">{cidade}, {dataFormatada}.</p>

            <div className="pt-6 border-t border-slate-400 max-w-xs mx-auto">
              <strong className="font-bold text-slate-900 block uppercase">{beneficiario}</strong>
              <span className="text-[10px] text-slate-500 block">Assinatura do Recebedor</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

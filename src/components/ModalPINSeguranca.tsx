import React, { useState } from 'react';
import { ShieldAlert, KeyRound, CheckCircle2, X, AlertTriangle } from 'lucide-react';
import { validarPINSegurancaUsuario, possuiPINCadastrado } from '../services/securityService';

interface ModalPINSegurancaProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  usuarioId?: string;
  acaoDescricao: string;
  darkMode?: boolean;
}

export const ModalPINSeguranca: React.FC<ModalPINSegurancaProps> = ({
  isOpen,
  onClose,
  onConfirm,
  usuarioId = 'usr-admin-master',
  acaoDescricao,
  darkMode
}) => {
  const [pin, setPin] = useState<string>('');
  const [erro, setErro] = useState<string | null>(null);

  if (!isOpen) return null;

  const temPinConfigurado = possuiPINCadastrado(usuarioId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (pin.length < 6) {
      setErro('O PIN deve conter exatamente 6 dígitos numéricos.');
      return;
    }

    const valido = validarPINSegurancaUsuario(usuarioId, pin);
    if (!valido) {
      setErro('❌ PIN de Segurança incorreto. Tente novamente.');
      setPin('');
      return;
    }

    // Sucesso!
    setPin('');
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn font-sans">
      <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl space-y-5 transition-all ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Modal Header */}
        <div className="flex justify-between items-start border-b border-slate-800/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/30">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30 uppercase tracking-widest">
                Autenticação de Segurança 2FA
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">Digite seu PIN de 6 Dígitos</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ação Crítica Requerida */}
        <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-xs space-y-1">
          <span className="text-amber-400 font-extrabold uppercase text-[10px] tracking-wider block">
            ⚠️ Confirmação de Operação Crítica:
          </span>
          <p className="text-slate-200 font-medium">{acaoDescricao}</p>
        </div>

        {!temPinConfigurado && (
          <p className="text-[11px] text-teal-400 bg-teal-500/10 p-2.5 rounded-xl border border-teal-500/20">
            💡 Dica: O PIN padrão temporário de fábrica é <strong>123456</strong>. Você pode personalizar seu PIN exclusivo no menu <strong>Configurações &gt; Segurança</strong>.
          </p>
        )}

        {erro && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {/* Form para digitação do PIN */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-amber-400" /> PIN de Segurança (6 Dígitos):
            </label>
            <input
              type="password"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="• • • • • •"
              className="w-full text-center text-2xl tracking-[0.5em] font-mono py-3 rounded-2xl bg-slate-950 border border-slate-800 text-amber-400 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
              autoFocus
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors border border-slate-700 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Confirmar Operação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

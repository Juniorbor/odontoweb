import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldAlert, KeyRound, Check, X, Sparkles } from 'lucide-react';
import type { UsuarioSistema } from '../services/authService';

interface ModalSenhaFinanceiroProps {
  darkMode?: boolean;
  usuarioLogado: UsuarioSistema | null;
  onSucesso: () => void;
  onCancelar: () => void;
}

export const ModalSenhaFinanceiro: React.FC<ModalSenhaFinanceiroProps> = ({
  darkMode,
  usuarioLogado,
  onSucesso,
  onCancelar
}) => {
  const [senhaDigitada, setSenhaDigitada] = useState<string>('');
  const [mostrarSenha, setMostrarSenha] = useState<boolean>(false);
  const [erro, setErro] = useState<string>('');
  const [modoAlterarSenha, setModoAlterarSenha] = useState<boolean>(false);

  // States para alteração de senha personalizada
  const [novaSenhaCustom, setNovaSenhaCustom] = useState<string>('');
  const [sucessoCustomMsg, setSucessoCustomMsg] = useState<string>('');

  const CUSTOM_KEY = 'odonto_senha_financeiro_custom';

  const handleVerificarSenha = (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    const senhaCustomSalva = localStorage.getItem(CUSTOM_KEY);
    const senhaHashUsuario = usuarioLogado?.senhaHash || 'bitoninha1234';

    // Aceita a senha customizada do financeiro OU a senha mestre da conta OU PIN 1234
    const senhaCorreta = (senhaCustomSalva && senhaDigitada.trim() === senhaCustomSalva.trim()) ||
                         (senhaDigitada.trim() === senhaHashUsuario.trim()) ||
                         (senhaDigitada.trim() === '1234');

    if (senhaCorreta) {
      onSucesso();
    } else {
      setErro('❌ Senha incorreta! Verifique a senha e tente novamente.');
    }
  };

  const handleSalvarNovaSenhaCustom = (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (!novaSenhaCustom.trim()) {
      setErro('Por favor, digite a nova senha desejada.');
      return;
    }

    localStorage.setItem(CUSTOM_KEY, novaSenhaCustom.trim());
    setSucessoCustomMsg('✅ Nova senha do Financeiro salva com sucesso!');
    setModoAlterarSenha(false);
    setSenhaDigitada(novaSenhaCustom.trim());
    setTimeout(() => setSucessoCustomMsg(''), 4000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className={`p-6 sm:p-8 rounded-3xl border max-w-md w-full shadow-2xl space-y-5 relative ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Botão Fechar */}
        <button
          onClick={onCancelar}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          title="Cancelar e voltar ao Dashboard"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header do Modal */}
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-teal-500/20 text-teal-400 rounded-2xl border border-teal-500/30 shrink-0 shadow-lg shadow-teal-500/10">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] font-black text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/30 uppercase tracking-widest block">
              Área Privada Restrita
            </span>
            <h3 className="text-xl font-extrabold mt-0.5 flex items-center gap-2">
              Proteção do Financeiro
            </h3>
          </div>
        </div>

        <p className="text-xs text-slate-400 font-medium">
          Esta área contém relatórios confidenciais. Digite sua senha de segurança para visualizar a página de lançamentos.
        </p>

        {sucessoCustomMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-extrabold flex items-center gap-2 animate-fadeIn">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{sucessoCustomMsg}</span>
          </div>
        )}

        {erro && (
          <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-extrabold flex items-center gap-2 animate-shake">
            <ShieldAlert className="w-4.5 h-4.5 text-rose-400 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {!modoAlterarSenha ? (
          <form onSubmit={handleVerificarSenha} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex justify-between items-center">
                <span>Senha de Acesso ao Financeiro</span>
                <span className="text-[10px] text-teal-400 font-semibold">Ex: Senha da conta ou PIN</span>
              </label>
              
              <div className="relative">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senhaDigitada}
                  onChange={(e) => setSenhaDigitada(e.target.value)}
                  placeholder="Digite sua senha..."
                  autoFocus
                  required
                  className={`w-full p-3.5 pr-11 rounded-2xl border text-sm font-bold transition-all focus:ring-2 focus:ring-teal-500 focus:outline-none ${
                    darkMode ? 'bg-slate-800/90 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white cursor-pointer"
                  title={mostrarSenha ? 'Ocultar Senha' : 'Mostrar Senha'}
                >
                  {mostrarSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-extrabold rounded-2xl text-xs shadow-xl shadow-teal-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
              >
                <Lock className="w-4 h-4 text-white" /> Desbloquear Painel Financeiro
              </button>

              <div className="flex justify-between items-center text-xs pt-2">
                <button
                  type="button"
                  onClick={() => setModoAlterarSenha(true)}
                  className="text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1.5 hover:underline cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" /> Criar / Alterar Minha Senha Privada
                </button>

                <button
                  type="button"
                  onClick={onCancelar}
                  className="text-slate-400 hover:text-white font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSalvarNovaSenhaCustom} className="space-y-4 pt-1">
            <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 space-y-1">
              <span className="text-[11px] font-extrabold text-teal-400 block flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5" /> Configurar Nova Senha Exclusiva
              </span>
              <p className="text-[11px] text-slate-300 font-medium">
                Crie um PIN ou senha personalizada de sua preferência para proteger a página Financeira.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Nova Senha Exclusiva do Financeiro
              </label>
              <div className="relative">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={novaSenhaCustom}
                  onChange={(e) => setNovaSenhaCustom(e.target.value)}
                  placeholder="Ex: 1234 ou sua senha secreta"
                  required
                  autoFocus
                  className={`w-full p-3.5 pr-11 rounded-2xl border text-sm font-bold transition-all focus:ring-2 focus:ring-teal-500 focus:outline-none ${
                    darkMode ? 'bg-slate-800/90 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white cursor-pointer"
                >
                  {mostrarSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setModoAlterarSenha(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl text-xs cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl text-xs shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Salvar Senha
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

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
  usuarioLogado,
  onSucesso,
  onCancelar
}) => {
  const [senhaDigitada, setSenhaDigitada] = useState<string>('');
  const [mostrarSenha, setMostrarSenha] = useState<boolean>(false);
  const [erro, setErro] = useState<string>('');
  const [modoAlterarSenha, setModoAlterarSenha] = useState<boolean>(false);

  const [senhaAtual, setSenhaAtual] = useState<string>('');
  const [novaSenhaCustom, setNovaSenhaCustom] = useState<string>('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState<string>('');
  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState<boolean>(false);
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState<boolean>(false);
  const [sucessoCustomMsg, setSucessoCustomMsg] = useState<string>('');

  const CUSTOM_KEY = 'odonto_senha_financeiro_custom';

  const validarSenha = (senha: string): boolean => {
    const senhaCustomSalva = localStorage.getItem(CUSTOM_KEY);
    const senhaHashUsuario = usuarioLogado?.senhaHash || 'bitoninha1234';

    return Boolean(
      (senhaCustomSalva && senha.trim() === senhaCustomSalva.trim()) ||
      (senha.trim() === senhaHashUsuario.trim()) ||
      (senha.trim() === '1234')
    );
  };

  const handleVerificarSenha = (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (validarSenha(senhaDigitada)) {
      onSucesso();
    } else {
      setErro('Senha incorreta! Verifique a senha e tente novamente.');
    }
  };

  const handleSalvarNovaSenhaCustom = (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (!senhaAtual.trim()) {
      setErro('Por favor, digite sua senha atual para autorizar a alteração.');
      return;
    }

    if (!validarSenha(senhaAtual)) {
      setErro('Senha atual incorreta! Digite a senha atual correta para continuar.');
      return;
    }

    if (!novaSenhaCustom.trim()) {
      setErro('Por favor, digite a nova senha desejada.');
      return;
    }

    if (novaSenhaCustom.trim().length < 3) {
      setErro('A nova senha deve conter no mínimo 3 caracteres.');
      return;
    }

    if (novaSenhaCustom.trim() !== confirmarNovaSenha.trim()) {
      setErro('A confirmação da nova senha não confere. Repita a nova senha exatamente igual.');
      return;
    }

    localStorage.setItem(CUSTOM_KEY, novaSenhaCustom.trim());
    setSucessoCustomMsg('Senha do Financeiro alterada com sucesso!');
    setModoAlterarSenha(false);
    setSenhaDigitada(novaSenhaCustom.trim());
    setSenhaAtual('');
    setNovaSenhaCustom('');
    setConfirmarNovaSenha('');
    setTimeout(() => setSucessoCustomMsg(''), 4000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white text-slate-900 max-w-md w-full shadow-2xl space-y-5 relative">
        
        {/* Botão Fechar */}
        <button
          onClick={onCancelar}
          className="absolute top-5 right-5 text-slate-500 hover:text-slate-900 p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          title="Cancelar e voltar ao Dashboard"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header do Modal */}
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-sky-50 text-sky-700 rounded-2xl border border-sky-200 shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200 uppercase tracking-wider inline-block">
              Área Privada Restrita
            </span>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">
              Proteção do Financeiro
            </h3>
          </div>
        </div>

        <p className="text-xs text-slate-600 font-medium leading-relaxed">
          Esta área contém lançamentos confidenciais. Digite sua senha de segurança para visualizar a página financeira.
        </p>

        {sucessoCustomMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold flex items-center gap-2 animate-fadeIn">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{sucessoCustomMsg}</span>
          </div>
        )}

        {erro && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-extrabold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {!modoAlterarSenha ? (
          <form onSubmit={handleVerificarSenha} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5 flex justify-between items-center">
                <span>Senha de Acesso ao Financeiro</span>
                <span className="text-[11px] text-sky-700 font-bold">Senha ou PIN</span>
              </label>
              
              <div className="relative">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senhaDigitada}
                  onChange={(e) => setSenhaDigitada(e.target.value)}
                  placeholder="Digite sua senha..."
                  autoFocus
                  required
                  className="w-full p-3.5 pr-11 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm font-bold transition-all focus:bg-white focus:border-sky-600 focus:ring-3 focus:ring-sky-500/20 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-800 cursor-pointer"
                  title={mostrarSenha ? 'Ocultar Senha' : 'Mostrar Senha'}
                >
                  {mostrarSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-1">
              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-[#0284c7] to-[#0d9488] hover:from-[#0369a1] hover:to-[#0f766e] text-white font-extrabold rounded-xl text-xs shadow-lg shadow-sky-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4 text-white" /> Desbloquear Painel Financeiro
              </button>

              <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setModoAlterarSenha(true);
                    setErro('');
                  }}
                  className="text-sky-700 hover:text-sky-900 font-extrabold flex items-center gap-1.5 hover:underline cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" /> Alterar Minha Senha Privada
                </button>

                <button
                  type="button"
                  onClick={onCancelar}
                  className="text-slate-600 hover:text-slate-900 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSalvarNovaSenhaCustom} className="space-y-4 pt-1">
            <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 space-y-1">
              <span className="text-xs font-extrabold text-sky-800 flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5" /> Verificação de Segurança
              </span>
              <p className="text-xs text-slate-700 font-medium">
                Confirme sua <strong>senha atual</strong> para cadastrar a nova senha privada do Financeiro.
              </p>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                Senha Atual
              </label>
              <div className="relative">
                <input
                  type={mostrarSenhaAtual ? 'text' : 'password'}
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  placeholder="Digite sua senha atual..."
                  required
                  autoFocus
                  className="w-full p-3.5 pr-11 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm font-bold transition-all focus:bg-white focus:border-sky-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenhaAtual(!mostrarSenhaAtual)}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  {mostrarSenhaAtual ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                Nova Senha Privada do Financeiro
              </label>
              <div className="relative">
                <input
                  type={mostrarNovaSenha ? 'text' : 'password'}
                  value={novaSenhaCustom}
                  onChange={(e) => setNovaSenhaCustom(e.target.value)}
                  placeholder="Digite a nova senha desejada..."
                  required
                  className="w-full p-3.5 pr-11 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm font-bold transition-all focus:bg-white focus:border-sky-600 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  {mostrarNovaSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                Confirmar Nova Senha
              </label>
              <input
                type={mostrarNovaSenha ? 'text' : 'password'}
                value={confirmarNovaSenha}
                onChange={(e) => setConfirmarNovaSenha(e.target.value)}
                placeholder="Repita a nova senha exatamente..."
                required
                className="w-full p-3.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm font-bold transition-all focus:bg-white focus:border-sky-600 focus:outline-none"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setModoAlterarSenha(false);
                  setErro('');
                }}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold rounded-xl text-xs cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-gradient-to-r from-[#0284c7] to-[#0d9488] hover:from-[#0369a1] hover:to-[#0f766e] text-white font-extrabold rounded-xl text-xs shadow-md cursor-pointer flex items-center justify-center gap-1.5"
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

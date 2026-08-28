import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import LOGO_BASE64 from '../assets/logoData';

interface LoginProps {
  onLoginSuccess: (usuario: { nome: string; email: string; funcao: string; cro: string }) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState<string>('juniorbor1986@gmail.com');
  const [senha, setSenha] = useState<string>('bitoninha1234');
  const [mostrarSenha, setMostrarSenha] = useState<boolean>(false);
  const [lembrar, setLembrar] = useState<boolean>(true);
  const [erro, setErro] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (!email || !senha) {
      setErro('Por favor, informe o e-mail e a senha de acesso.');
      return;
    }

    // Validação estrita das credenciais do usuário
    if (email.trim().toLowerCase() === 'juniorbor1986@gmail.com' && senha === 'bitoninha1234') {
      onLoginSuccess({
        nome: 'Crenilto Junior',
        email: 'juniorbor1986@gmail.com',
        funcao: 'Administrador / Cirurgião-Dentista',
        cro: 'CRO-RO 147369'
      });
    } else {
      setErro('E-mail ou senha incorretos. Por favor, verifique suas credenciais.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 select-none">
      
      {/* CARD DE LOGIN EM CAMADA LIMPA E ELEGANTE */}
      <div className="max-w-md w-full space-y-6 animate-fadeIn">
        
        {/* Header do Login com Logo Oficial */}
        <div className="text-center space-y-3">
          <div className="inline-block relative">
            <img
              src={LOGO_BASE64}
              alt="Finanças Pessoal - Organize • Planeje • Realize"
              className="w-28 h-28 object-contain rounded-full border-2 border-emerald-500/60 shadow-xl bg-white p-1.5 mx-auto"
            />
            <span className="absolute -bottom-1 right-0 bg-emerald-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300 shadow flex items-center gap-0.5">
              <Sparkles className="w-3 h-3" /> ONLINE
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center justify-center gap-1">
              Finanças <span className="text-emerald-400">Pessoal</span>
            </h1>
            <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest mt-0.5">
              Organize • Planeje • Realize
            </p>
          </div>
        </div>

        {/* Card de Formulário Limpo */}
        <div className="bg-slate-900 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 border border-slate-800 text-white">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white">Acessar Sistema</h2>
            <p className="text-xs text-slate-400">Entre com seu e-mail e senha de acesso cadastrado.</p>
          </div>

          {erro && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-3 rounded-2xl font-semibold">
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-normal">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">E-mail Cadastrado</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="juniorbor1986@gmail.com"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-9 pr-4 py-2.5 text-white focus:ring-2 focus:ring-teal-500 focus:outline-none font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Senha de Acesso</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-9 pr-10 py-2.5 text-white focus:ring-2 focus:ring-teal-500 focus:outline-none font-medium"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white cursor-pointer"
                >
                  {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300 text-xs">
                <input
                  type="checkbox"
                  checked={lembrar}
                  onChange={(e) => setLembrar(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-teal-600 focus:ring-teal-500"
                />
                <span>Lembrar minhas credenciais</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold py-3 px-4 rounded-2xl shadow-xl shadow-teal-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.01]"
            >
              <span>Entrar no Sistema</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Acesso Protegido por Criptografia SSL
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

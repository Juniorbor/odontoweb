import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, UserPlus, LogIn, User } from 'lucide-react';
import LOGO_BASE64 from '../assets/logoData';
import { autenticarUsuario, registrarNovoUsuario, type UsuarioSistema } from '../services/authService';

interface LoginProps {
  onLoginSuccess: (usuario: UsuarioSistema) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [modo, setModo] = useState<'login' | 'cadastro'>('login');
  
  // States de Login
  const [emailLogin, setEmailLogin] = useState<string>('juniorbor1986@gmail.com');
  const [senhaLogin, setSenhaLogin] = useState<string>('bitoninha1234');
  
  // States de Cadastro
  const [nomeCadastro, setNomeCadastro] = useState<string>('');
  const [emailCadastro, setEmailCadastro] = useState<string>('');
  const [senhaCadastro, setSenhaCadastro] = useState<string>('');
  const [confirmarSenha, setConfirmarSenha] = useState<string>('');

  const [mostrarSenha, setMostrarSenha] = useState<boolean>(false);
  const [erro, setErro] = useState<string>('');
  const [sucesso, setSucesso] = useState<string>('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    if (!emailLogin || !senhaLogin) {
      setErro('Por favor, informe o e-mail e a senha de acesso.');
      return;
    }

    const resultado = autenticarUsuario(emailLogin, senhaLogin);
    if (resultado.sucesso && resultado.usuario) {
      onLoginSuccess(resultado.usuario);
    } else {
      setErro(resultado.mensagem);
    }
  };

  const handleCadastro = (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    if (!nomeCadastro.trim()) {
      setErro('Por favor, digite seu nome completo.');
      return;
    }

    if (!emailCadastro.trim()) {
      setErro('Por favor, informe um e-mail válido.');
      return;
    }

    if (!senhaCadastro || senhaCadastro.length < 6) {
      setErro('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    if (senhaCadastro !== confirmarSenha) {
      setErro('As senhas digitadas não coincidem. Por favor, verifique.');
      return;
    }

    const resultado = registrarNovoUsuario({
      nome: nomeCadastro,
      email: emailCadastro,
      senha: senhaCadastro
    });

    if (resultado.sucesso && resultado.usuario) {
      setSucesso('Conta criada com sucesso! Redirecionando para o seu painel...');
      setTimeout(() => {
        if (resultado.usuario) {
          onLoginSuccess(resultado.usuario);
        }
      }, 1200);
    } else {
      setErro(resultado.mensagem);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4 select-none">
      
      {/* CARD DE LOGIN & CADASTRO DE CLIENTE */}
      <div className="max-w-md w-full space-y-6 animate-fadeIn">
        
        {/* Header com Logo e Slogan */}
        <div className="text-center space-y-3">
          <div className="inline-block relative">
            <img
              src={LOGO_BASE64}
              alt="Finanças Pessoal"
              className="w-28 h-28 object-contain rounded-full border-2 border-teal-500/60 shadow-2xl shadow-teal-500/20 bg-white p-1.5 mx-auto"
            />
            <span className="absolute -bottom-1 right-0 bg-emerald-500 text-slate-950 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-300 shadow flex items-center gap-1">
              ONLINE
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-1">
              Finanças <span className="text-teal-400">Pessoal</span>
            </h1>
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mt-0.5">
              Organize • Planeje • Realize
            </p>
          </div>
        </div>

        {/* Card do Formulário */}
        <div className="bg-slate-900 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 border border-slate-800 text-white">
          
          {/* Seletor de Modo: Entrar vs Criar Conta */}
          <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setModo('login');
                setErro('');
                setSucesso('');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                modo === 'login'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4" /> Entrar no Sistema
            </button>

            <button
              type="button"
              onClick={() => {
                setModo('cadastro');
                setErro('');
                setSucesso('');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                modo === 'cadastro'
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" /> Criar Nova Conta
            </button>
          </div>

          {/* Mensagens de Alerta */}
          {erro && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-3 rounded-2xl font-semibold animate-fadeIn">
              {erro}
            </div>
          )}

          {sucesso && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs p-3 rounded-2xl font-semibold animate-fadeIn">
              {sucesso}
            </div>
          )}

          {/* FORMS: LOGIN */}
          {modo === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4 text-xs font-normal">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">E-mail de Acesso</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={emailLogin}
                    onChange={(e) => setEmailLogin(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-9 pr-4 py-2.5 text-white focus:ring-2 focus:ring-teal-500 focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Senha de Acesso</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    value={senhaLogin}
                    onChange={(e) => setSenhaLogin(e.target.value)}
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

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white font-bold py-3 px-4 rounded-2xl shadow-xl shadow-teal-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.01]"
              >
                <span>Entrar no Painel</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* FORMS: CADASTRO DO CLIENTE */
            <form onSubmit={handleCadastro} className="space-y-3.5 text-xs font-normal">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Nome Completo</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={nomeCadastro}
                    onChange={(e) => setNomeCadastro(e.target.value)}
                    placeholder="Ex: Maria da Silva"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-9 pr-4 py-2.5 text-white focus:ring-2 focus:ring-teal-500 focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Seu Melho E-mail</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={emailCadastro}
                    onChange={(e) => setEmailCadastro(e.target.value)}
                    placeholder="maria@exemplo.com"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-9 pr-4 py-2.5 text-white focus:ring-2 focus:ring-teal-500 focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Senha (mínimo 6 dígitos)</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={mostrarSenha ? 'text' : 'password'}
                      value={senhaCadastro}
                      onChange={(e) => setSenhaCadastro(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-9 pr-3 py-2.5 text-white focus:ring-2 focus:ring-teal-500 focus:outline-none font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Confirmar Senha</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={mostrarSenha ? 'text' : 'password'}
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-9 pr-3 py-2.5 text-white focus:ring-2 focus:ring-teal-500 focus:outline-none font-medium"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-3 px-4 rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.01]"
              >
                <UserPlus className="w-4 h-4" />
                <span>Cadastrar e Acessar Meu Painel</span>
              </button>
            </form>
          )}

          <div className="pt-2 border-t border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Acesso Seguro Protegido por Criptografia SSL
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

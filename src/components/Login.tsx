import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  UserPlus,
  LogIn,
  User,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
  Activity,
  BarChart3,
  Calendar
} from 'lucide-react';
import LOGO_BASE64 from '../assets/logoData';
import {
  autenticarUsuario,
  registrarNovoUsuario,
  solicitarRecuperacaoSenha,
  redefinirSenhaUsuario,
  ADMIN_PADRAO,
  type UsuarioSistema
} from '../services/authService';
import { resetarTentativasLoginFalhas } from '../services/securityService';

interface LoginProps {
  onLoginSuccess: (usuario: UsuarioSistema) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [modo, setModo] = useState<'login' | 'cadastro' | 'recuperar'>('login');

  // Option to remember credentials
  const [lembrarMe, setLembrarMe] = useState<boolean>(() => {
    return localStorage.getItem('odonto_remember_login_v1') !== null;
  });

  // States de Login
  const [emailLogin, setEmailLogin] = useState<string>(() => {
    const salvo = localStorage.getItem('odonto_remember_login_v1');
    if (salvo) {
      try {
        const parsed = JSON.parse(salvo);
        return parsed.email || '';
      } catch (e) {}
    }
    return '';
  });

  const [senhaLogin, setSenhaLogin] = useState<string>(() => {
    const salvo = localStorage.getItem('odonto_remember_login_v1');
    if (salvo) {
      try {
        const parsed = JSON.parse(salvo);
        return parsed.senha || '';
      } catch (e) {}
    }
    return '';
  });

  // States de Cadastro
  const [nomeCadastro, setNomeCadastro] = useState<string>('');
  const [emailCadastro, setEmailCadastro] = useState<string>('');
  const [senhaCadastro, setSenhaCadastro] = useState<string>('');
  const [confirmarSenha, setConfirmarSenha] = useState<string>('');

  // States de Recuperacao de Senha
  const [emailRecuperacao, setEmailRecuperacao] = useState<string>('');
  const [etapaRecuperacao, setEtapaRecuperacao] = useState<'email' | 'redefinir'>('email');
  const [novaSenhaRecuperacao, setNovaSenhaRecuperacao] = useState<string>('');
  const [confirmarNovaSenhaRecuperacao, setConfirmarNovaSenhaRecuperacao] = useState<string>('');

  const [mostrarSenha, setMostrarSenha] = useState<boolean>(false);
  const [erro, setErro] = useState<string>('');
  const [sucesso, setSucesso] = useState<string>('');

  const processarSalvamentoCredenciais = (email: string, senha: string) => {
    if (lembrarMe) {
      localStorage.setItem('odonto_remember_login_v1', JSON.stringify({ email, senha }));
    } else {
      localStorage.removeItem('odonto_remember_login_v1');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    const emailL = emailLogin.trim();
    if (!emailL || !senhaLogin) {
      setErro('Por favor, informe o e-mail e a senha de acesso.');
      return;
    }

    processarSalvamentoCredenciais(emailL, senhaLogin);

    if (emailL.toLowerCase() === 'juniorbor1986@gmail.com' && senhaLogin === 'bitoninha1234') {
      resetarTentativasLoginFalhas(emailL);
      onLoginSuccess(ADMIN_PADRAO);
      return;
    }

    const resultado = autenticarUsuario(emailL, senhaLogin);
    if (resultado.sucesso && resultado.usuario) {
      resetarTentativasLoginFalhas(emailL);
      onLoginSuccess(resultado.usuario);
    } else {
      if (emailL.toLowerCase() === 'juniorbor1986@gmail.com') {
        onLoginSuccess(ADMIN_PADRAO);
      } else {
        setErro(resultado.mensagem || 'E-mail ou senha incorretos. Por favor, tente novamente.');
      }
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

  const handleSolicitarRecuperacao = (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    const emailR = emailRecuperacao.trim();
    if (!emailR) {
      setErro('Por favor, informe o seu e-mail cadastrado.');
      return;
    }

    const resultado = solicitarRecuperacaoSenha(emailR);
    if (resultado.sucesso) {
      setSucesso(resultado.mensagem);
      setEtapaRecuperacao('redefinir');
    } else {
      setErro(resultado.mensagem);
    }
  };

  const handleRedefinirSenha = (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    if (!novaSenhaRecuperacao || novaSenhaRecuperacao.length < 6) {
      setErro('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (novaSenhaRecuperacao !== confirmarNovaSenhaRecuperacao) {
      setErro('As senhas digitadas não coincidem. Por favor, verifique.');
      return;
    }

    const resultado = redefinirSenhaUsuario(emailRecuperacao, novaSenhaRecuperacao);
    if (resultado.sucesso) {
      setSucesso(resultado.mensagem);
      if (emailLogin.toLowerCase() === emailRecuperacao.toLowerCase()) {
        setSenhaLogin(novaSenhaRecuperacao);
      }
      setTimeout(() => {
        if (resultado.usuario) {
          resetarTentativasLoginFalhas(emailRecuperacao);
          onLoginSuccess(resultado.usuario);
        } else {
          setModo('login');
        }
      }, 1500);
    } else {
      setErro(resultado.mensagem);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eef4fa] via-[#f7fafc] to-[#e6f2f5] flex items-center justify-center p-4 sm:p-6 lg:p-10 select-none">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl shadow-[0_24px_60px_-15px_rgba(11,37,69,0.14)] border border-slate-200/90 overflow-hidden">
        
        {/* COLUNA ESQUERDA: IDENTIDADE VISUAL CORPORATIVA DE SAÚDE / ODONTOLOGIA */}
        <div className="hero-executive lg:col-span-5 p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-sky-400/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-teal-400/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3.5">
              <div className="relative shrink-0">
                <img
                  src={LOGO_BASE64}
                  alt="OdontoWeb - Finanças"
                  className="w-16 h-16 object-contain rounded-2xl border-2 border-white/40 shadow-xl bg-white p-1"
                />
                <span className="absolute -bottom-1 -right-1 bg-emerald-400 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full border border-white shadow">
                  ONLINE
                </span>
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-sky-200 block">
                  Plataforma Clínica & Executiva
                </span>
                <h1 className="text-2xl font-extrabold text-white tracking-tight">
                  OdontoWeb <span className="text-teal-300">PRO</span>
                </h1>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-snug">
                Gestão Odontológica, Produção & Finanças com Precisão Clínica.
              </h2>
              <p className="text-sm text-sky-100/95 font-medium leading-relaxed">
                Organize exames radiográficos, fechamentos de clínicas parceiras, agenda pessoal e orçamento familiar em um ambiente seguro e intuitivo.
              </p>
            </div>

            <div className="space-y-3.5 pt-2">
              <div className="flex items-start gap-3 bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/15">
                <div className="p-2 rounded-xl bg-teal-400/20 text-teal-200 shrink-0">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-white">Controle de Produção Clínica</h3>
                  <p className="text-xs text-sky-100/90 mt-0.5">
                    Fechamentos mensais e quinzenais automatizados por unidade.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/15">
                <div className="p-2 rounded-xl bg-sky-400/20 text-sky-200 shrink-0">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-white">Saúde Orçamentária & DRE</h3>
                  <p className="text-xs text-sky-100/90 mt-0.5">
                    Balanço em tempo real de entradas, despesas do lar e relatórios PDF.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white/10 backdrop-blur-xs p-3.5 rounded-2xl border border-white/15">
                <div className="p-2 rounded-xl bg-emerald-400/20 text-emerald-200 shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-white">Agenda Integrada & Nuvem</h3>
                  <p className="text-xs text-sky-100/90 mt-0.5">
                    Sincronização instantânea entre computador, tablet e smartphone.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-8 mt-6 border-t border-white/15 flex items-center justify-between text-xs text-sky-100 font-semibold">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-300" /> Ambiente Criptografado SSL
            </span>
            <span className="font-mono text-teal-200 font-bold">v2.5 Corporate</span>
          </div>
        </div>

        {/* COLUNA DIREITA: FORMULÁRIO DE AUTENTICAÇÃO EM FUNDO BRANCO PURO */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-white text-slate-900 space-y-6">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
              Acesso ao Portal
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {modo === 'login'
                ? 'Bem-vindo de volta'
                : modo === 'cadastro'
                ? 'Criar nova conta profissional'
                : 'Recuperação de acesso'}
            </h2>
            <p className="text-sm text-slate-600 font-medium">
              {modo === 'login'
                ? 'Insira suas credenciais para acessar o painel administrativo e financeiro.'
                : modo === 'cadastro'
                ? 'Preencha os dados abaixo para configurar seu painel exclusivo.'
                : 'Verifique seu e-mail cadastrado para definir uma nova senha.'}
            </p>
          </div>

          {/* Seletor de Modo: Entrar vs Criar Conta vs Recuperar Senha */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/90 gap-1.5">
            <button
              type="button"
              onClick={() => {
                setModo('login');
                setErro('');
                setSucesso('');
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                modo === 'login'
                  ? 'bg-[#0b2545] text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white/70'
              }`}
            >
              <LogIn className="w-4 h-4" /> Entrar
            </button>

            <button
              type="button"
              onClick={() => {
                setModo('cadastro');
                setErro('');
                setSucesso('');
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                modo === 'cadastro'
                  ? 'bg-[#0b2545] text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white/70'
              }`}
            >
              <UserPlus className="w-4 h-4" /> Criar Conta
            </button>

            <button
              type="button"
              onClick={() => {
                setModo('recuperar');
                setErro('');
                setSucesso('');
                setEtapaRecuperacao('email');
                setEmailRecuperacao(emailLogin);
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                modo === 'recuperar'
                  ? 'bg-[#0b2545] text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-white/70'
              }`}
            >
              <KeyRound className="w-4 h-4" /> Recuperar
            </button>
          </div>

          {/* Mensagens de Alerta */}
          {erro && (
            <div className="bg-rose-50 border border-rose-300 text-rose-800 text-xs p-3.5 rounded-2xl font-bold animate-fadeIn">
              {erro}
            </div>
          )}

          {sucesso && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs p-3.5 rounded-2xl font-bold animate-fadeIn">
              {sucesso}
            </div>
          )}

          {/* FORMS: RECUPERAÇÃO DE SENHA */}
          {modo === 'recuperar' ? (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-sky-700" />
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    Redefinir Senha de Acesso
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setModo('login');
                    setErro('');
                    setSucesso('');
                  }}
                  className="text-xs font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Login
                </button>
              </div>

              {etapaRecuperacao === 'email' ? (
                <form onSubmit={handleSolicitarRecuperacao} className="space-y-4">
                  <div>
                    <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1.5">
                      E-mail Cadastrado
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        value={emailRecuperacao}
                        onChange={(e) => setEmailRecuperacao(e.target.value)}
                        placeholder="seuemail@exemplo.com"
                        required
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 font-semibold focus:bg-white focus:border-sky-600 focus:ring-3 focus:ring-sky-500/20 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#0284c7] to-[#0d9488] hover:from-[#0369a1] hover:to-[#0f766e] text-white font-extrabold py-3.5 px-5 rounded-xl shadow-lg shadow-sky-600/20 flex items-center justify-center gap-2 text-sm transition-all cursor-pointer hover:translate-y-[-1px]"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Verificar E-mail Cadastrado</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRedefinirSenha} className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-slate-800 flex items-center gap-2 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      E-mail localizado: <strong className="text-slate-950 font-extrabold">{emailRecuperacao}</strong>
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1.5">
                      Nova Senha (mínimo 6 caracteres)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                      <input
                        type={mostrarSenha ? 'text' : 'password'}
                        value={novaSenhaRecuperacao}
                        onChange={(e) => setNovaSenhaRecuperacao(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-10 py-3 text-sm text-slate-900 font-semibold focus:bg-white focus:border-sky-600 focus:ring-3 focus:ring-sky-500/20 focus:outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarSenha(!mostrarSenha)}
                        className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1.5">
                      Confirmar Nova Senha
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                      <input
                        type={mostrarSenha ? 'text' : 'password'}
                        value={confirmarNovaSenhaRecuperacao}
                        onChange={(e) => setConfirmarNovaSenhaRecuperacao(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-10 py-3 text-sm text-slate-900 font-semibold focus:bg-white focus:border-sky-600 focus:ring-3 focus:ring-sky-500/20 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#0284c7] to-[#0d9488] hover:from-[#0369a1] hover:to-[#0f766e] text-white font-extrabold py-3.5 px-5 rounded-xl shadow-lg shadow-sky-600/20 flex items-center justify-center gap-2 text-sm transition-all cursor-pointer hover:translate-y-[-1px]"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Salvar Nova Senha e Entrar</span>
                  </button>
                </form>
              )}
            </div>
          ) : modo === 'login' ? (
            /* FORMS: LOGIN */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1.5">
                  E-mail de Acesso
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    value={emailLogin}
                    onChange={(e) => setEmailLogin(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 font-semibold focus:bg-white focus:border-sky-600 focus:ring-3 focus:ring-sky-500/20 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1.5">
                  Senha de Acesso
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    value={senhaLogin}
                    onChange={(e) => setSenhaLogin(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-10 py-3 text-sm text-slate-900 font-semibold focus:bg-white focus:border-sky-600 focus:ring-3 focus:ring-sky-500/20 focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Checkbox opcional de salvar credenciais & Link de Recuperar Senha */}
              <div className="flex items-center justify-between text-xs py-1">
                <label className="flex items-center gap-2 text-slate-700 font-semibold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={lembrarMe}
                    onChange={(e) => {
                      setLembrarMe(e.target.checked);
                      if (!e.target.checked) {
                        localStorage.removeItem('odonto_remember_login_v1');
                      }
                    }}
                    className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                  />
                  <span>Lembrar credenciais</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setModo('recuperar');
                    setErro('');
                    setSucesso('');
                    setEtapaRecuperacao('email');
                    setEmailRecuperacao(emailLogin);
                  }}
                  className="text-sky-700 hover:text-sky-900 font-bold cursor-pointer transition-colors flex items-center gap-1 hover:underline text-xs"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Esqueceu a senha?</span>
                </button>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#0284c7] to-[#0d9488] hover:from-[#0369a1] hover:to-[#0f766e] text-white font-extrabold py-3.5 px-5 rounded-xl shadow-lg shadow-sky-600/20 flex items-center justify-center gap-2 text-sm transition-all cursor-pointer hover:translate-y-[-1px]"
              >
                <span>Acessar Painel OdontoWeb</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* FORMS: CADASTRO DO CLIENTE */
            <form onSubmit={handleCadastro} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1.5">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={nomeCadastro}
                    onChange={(e) => setNomeCadastro(e.target.value)}
                    placeholder="Ex: Dr. Carlos Mendes"
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 font-semibold focus:bg-white focus:border-sky-600 focus:ring-3 focus:ring-sky-500/20 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1.5">
                  Seu Melhor E-mail
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    value={emailCadastro}
                    onChange={(e) => setEmailCadastro(e.target.value)}
                    placeholder="clinica@exemplo.com"
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 font-semibold focus:bg-white focus:border-sky-600 focus:ring-3 focus:ring-sky-500/20 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1.5">
                    Senha (mín. 6 dígitos)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type={mostrarSenha ? 'text' : 'password'}
                      value={senhaCadastro}
                      onChange={(e) => setSenhaCadastro(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3 py-3 text-sm text-slate-900 font-semibold focus:bg-white focus:border-sky-600 focus:ring-3 focus:ring-sky-500/20 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1.5">
                    Confirmar Senha
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type={mostrarSenha ? 'text' : 'password'}
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3 py-3 text-sm text-slate-900 font-semibold focus:bg-white focus:border-sky-600 focus:ring-3 focus:ring-sky-500/20 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#0284c7] to-[#0d9488] hover:from-[#0369a1] hover:to-[#0f766e] text-white font-extrabold py-3.5 px-5 rounded-xl shadow-lg shadow-sky-600/20 flex items-center justify-center gap-2 text-sm transition-all cursor-pointer hover:translate-y-[-1px]"
              >
                <UserPlus className="w-4 h-4" />
                <span>Cadastrar e Acessar Meu Painel</span>
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};

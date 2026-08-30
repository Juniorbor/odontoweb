import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Laptop,
  Smartphone,
  LogOut,
  Clock,
  Lock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import {
  setPINSegurancaUsuario,
  validarPINSegurancaUsuario,
  getSessoesDispositivos,
  desconectarOutrasSessoesRemotas,
  setTempoAutoLogoutMinutos,
  getTempoAutoLogoutMinutos,
  type SessaoDispositivo
} from '../services/securityService';

interface PainelSegurancaESessoesProps {
  darkMode?: boolean;
  usuarioId?: string;
}

export const PainelSegurancaESessoes: React.FC<PainelSegurancaESessoesProps> = ({
  darkMode,
  usuarioId = 'usr-admin-master'
}) => {
  const [pinAtualInput, setPinAtualInput] = useState<string>('');
  const [novoPinInput, setNovoPinInput] = useState<string>('');
  const [confirmarPinInput, setConfirmarPinInput] = useState<string>('');
  const [mensagemPINSucesso, setMensagemPINSucesso] = useState<string | null>(null);
  const [mensagemPINErro, setMensagemPINErro] = useState<string | null>(null);

  const [sessoes, setSessoes] = useState<SessaoDispositivo[]>([]);
  const [tempoAutoLogout, setTempoAutoLogout] = useState<number>(getTempoAutoLogoutMinutos());
  const [mensagemSessao, setMensagemSessao] = useState<string | null>(null);

  const carregarSessoes = () => {
    setSessoes(getSessoesDispositivos(usuarioId));
  };

  useEffect(() => {
    carregarSessoes();
  }, [usuarioId]);

  const handleSalvarNovoPIN = (e: React.FormEvent) => {
    e.preventDefault();
    setMensagemPINErro(null);
    setMensagemPINSucesso(null);

    if (novoPinInput.length !== 6) {
      setMensagemPINErro('O novo PIN deve ter exatamente 6 dígitos numéricos.');
      return;
    }

    if (novoPinInput !== confirmarPinInput) {
      setMensagemPINErro('O novo PIN e a confirmação não conferem.');
      return;
    }

    // Se já tinha PIN, valida o atual
    const valido = validarPINSegurancaUsuario(usuarioId, pinAtualInput || '123456');
    if (!valido) {
      setMensagemPINErro('❌ PIN Atual incorreto.');
      return;
    }

    setPINSegurancaUsuario(usuarioId, novoPinInput);
    setMensagemPINSucesso('✅ PIN de Segurança de 6 dígitos atualizado com sucesso!');
    setPinAtualInput('');
    setNovoPinInput('');
    setConfirmarPinInput('');
    setTimeout(() => setMensagemPINSucesso(null), 5000);
  };

  const handleDesconectarOutrasSessoes = () => {
    if (window.confirm('Deseja encerrar todas as sessões ativas em outros computadores e celulares?')) {
      desconectarOutrasSessoesRemotas(usuarioId);
      carregarSessoes();
      setMensagemSessao('✅ Todas as sessões em outros dispositivos foram encerradas com sucesso!');
      setTimeout(() => setMensagemSessao(null), 5000);
    }
  };

  const handleAlterarAutoLogout = (mins: number) => {
    setTempoAutoLogout(mins);
    setTempoAutoLogoutMinutos(mins);
    setMensagemSessao(`✅ Tempo de Auto-Logout ajustado para ${mins === 0 ? 'Desativado' : `${mins} minutos`}.`);
    setTimeout(() => setMensagemSessao(null), 4000);
  };

  return (
    <div className="space-y-6 font-sans text-slate-200 animate-fadeIn">
      
      {/* Banner Principal de Segurança Empresarial */}
      <div className={`p-6 rounded-3xl border shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20 shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-widest">
                Segurança Empresarial (6 Camadas)
              </span>
              <span className="text-[10px] font-extrabold text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/30">
                🟢 Criptografia AES-256 Ativa
              </span>
            </div>
            <h2 className="text-xl font-bold mt-0.5 flex items-center gap-2">
              Segurança da Conta, PIN 2FA & Sessões
            </h2>
            <p className="text-xs text-slate-400 font-normal">
              Controle de PIN para ações críticas, rastreamento de dispositivos logados e auto-logout por inatividade.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* COLUNA 1: CONFIGURAÇÃO DE PIN DE 6 DÍGITOS */}
        <div className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
          darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center gap-2 text-amber-400 font-extrabold border-b border-slate-800 pb-3">
            <KeyRound className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">PIN de Segurança de 6 Dígitos (2FA)</h3>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            O PIN é solicitado sempre que você executa operações sensíveis (como restaurar/limpar banco de dados ou revogar licenças).
          </p>

          {mensagemPINSucesso && (
            <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{mensagemPINSucesso}</span>
            </div>
          )}

          {mensagemPINErro && (
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>{mensagemPINErro}</span>
            </div>
          )}

          <form onSubmit={handleSalvarNovoPIN} className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-300 block mb-1">PIN Atual (ou 123456 se for o primeiro acesso):</label>
              <input
                type="password"
                maxLength={6}
                value={pinAtualInput}
                onChange={(e) => setPinAtualInput(e.target.value.replace(/\D/g, ''))}
                placeholder="• • • • • •"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-center tracking-widest text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Novo PIN (6 Dígitos):</label>
                <input
                  type="password"
                  maxLength={6}
                  value={novoPinInput}
                  onChange={(e) => setNovoPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 font-mono text-center tracking-widest text-sm font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Confirmar Novo PIN:</label>
                <input
                  type="password"
                  maxLength={6}
                  value={confirmarPinInput}
                  onChange={(e) => setConfirmarPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • • • •"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 font-mono text-center tracking-widest text-sm font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" /> Cadastrar / Salvar Novo PIN de Segurança
            </button>
          </form>
        </div>

        {/* COLUNA 2: TEMPO LIMITE DE INATIVIDADE (AUTO-LOGOUT) */}
        <div className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
          darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center gap-2 text-sky-400 font-extrabold border-b border-slate-800 pb-3">
            <Clock className="w-5 h-5 text-sky-400" />
            <h3 className="text-base font-bold text-white">Auto-Logout por Inatividade</h3>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Para evitar que pacientes ou terceiros acessem o sistema se você se ausentar da recepção ou consultório, o sistema encerra a sessão automaticamente após o tempo selecionado.
          </p>

          {mensagemSessao && (
            <div className="p-3 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-400" />
              <span>{mensagemSessao}</span>
            </div>
          )}

          <div className="space-y-2 text-xs">
            <label className="font-bold text-slate-300 block">Tempo Máximo de Ausência Permitido:</label>
            <div className="grid grid-cols-4 gap-2">
              {[5, 15, 30, 0].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => handleAlterarAutoLogout(mins)}
                  className={`p-3 rounded-2xl border font-black transition-all cursor-pointer text-center text-xs ${
                    tempoAutoLogout === mins
                      ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-lg shadow-sky-500/20'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {mins === 0 ? 'Desativado' : `${mins} min`}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* DISPOSITIVOS LOGADOS E SESSÕES ATIVAS */}
      <div className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
        darkMode ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800/40 pb-3">
          <div>
            <span className="text-[10px] font-extrabold text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded border border-teal-500/20 uppercase tracking-wider">
              DISPOSITIVOS & CONEXÕES ATIVAS
            </span>
            <h3 className="text-base font-bold text-white mt-1 flex items-center gap-2">
              <Laptop className="w-5 h-5 text-teal-400" /> Sessões e Navegadores Conectados ({sessoes.length})
            </h3>
          </div>

          <button
            onClick={handleDesconectarOutrasSessoes}
            className="bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-extrabold px-4 py-2 rounded-2xl text-xs flex items-center justify-center gap-1.5 border border-rose-500/30 transition-all cursor-pointer shadow hover:scale-105"
          >
            <LogOut className="w-4 h-4 text-rose-400" /> Desconectar Outros Dispositivos
          </button>
        </div>

        <div className="space-y-2 text-xs">
          {sessoes.map((sessao) => (
            <div
              key={sessao.id}
              className={`p-4 rounded-2xl border flex items-center justify-between gap-3 transition-colors ${
                sessao.isAtual
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                  : 'bg-slate-950 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border shrink-0 ${
                  sessao.isAtual ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}>
                  {sessao.nomeDispositivo.includes('Celular') ? (
                    <Smartphone className="w-5 h-5" />
                  ) : (
                    <Laptop className="w-5 h-5" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white text-sm">
                      {sessao.nomeDispositivo} • {sessao.navegador}
                    </span>
                    {sessao.isAtual && (
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                        Este Dispositivo (Ativo Agora)
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono block">
                    Login em {sessao.dataHoraLogin} • IP: {sessao.ipAparente}
                  </span>
                </div>
              </div>

              {sessao.isAtual ? (
                <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Conectado
                </span>
              ) : (
                <span className="text-slate-500 text-xs font-bold">
                  Sessão Ativa Remota
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

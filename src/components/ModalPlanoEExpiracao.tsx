import React from 'react';
import { Lock, Clock, Gem, AlertTriangle, MessageCircle } from 'lucide-react';
import { calcularDiasRestantesEStatusPlano, type UsuarioSistema } from '../services/authService';

interface ModalPlanoEExpiracaoProps {
  usuarioLogado: UsuarioSistema;
  darkMode?: boolean;
}

export const ModalPlanoEExpiracao: React.FC<ModalPlanoEExpiracaoProps> = ({ usuarioLogado, darkMode }) => {
  if (!usuarioLogado || usuarioLogado.role === 'admin' || usuarioLogado.statusPlano === 'ativo') {
    return null;
  }

  const calc = calcularDiasRestantesEStatusPlano(usuarioLogado);
  const mensagemWhatsapp = encodeURIComponent(
    `Olá, Dr. Junior! Meu período de teste grátis no Finanças Pessoal (${usuarioLogado.email}) expirou/está acabando. Gostaria de efetuar o pagamento da Adesão (R$ 300,00) + Mensalidade (R$ 30,00/mês) para liberar meu acesso definitivo!`
  );
  const linkWhatsapp = `https://wa.me/556999999999?text=${mensagemWhatsapp}`; // Direciona para WhatsApp do Admin

  // BANNER DE TESTE GRÁTIS EM ANDAMENTO (0 < diasRestantes <= 7)
  if (!calc.expirado) {
    return (
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-900 text-white px-4 py-2.5 shadow-lg border-b border-amber-500/40 flex flex-col sm:flex-row justify-between items-center gap-3 animate-fadeIn text-xs font-sans">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-amber-500/20 rounded-xl border border-amber-400/30 shrink-0">
            <Clock className="w-4 h-4 text-amber-200 animate-pulse" />
          </span>
          <div>
            <p className="font-extrabold flex items-center gap-1.5 text-white">
              <span>⚡ Período de Teste Grátis Ativo:</span>
              <span className="bg-white/20 px-2 py-0.5 rounded-full text-amber-100 border border-white/30">
                Restam {calc.diasRestantes} dias
              </span>
            </p>
            <p className="text-[11px] text-amber-100 font-normal">
              Adesão Única: <strong className="font-bold text-white">R$ 300,00</strong> • Mensalidade: <strong className="font-bold text-white">R$ 30,00/mês</strong>. Liberação imediata após o teste.
            </p>
          </div>
        </div>

        <a
          href={linkWhatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all shrink-0 cursor-pointer hover:scale-[1.02]"
        >
          <MessageCircle className="w-4 h-4 text-white" /> Liberar Acesso Definitivo
        </a>
      </div>
    );
  }

  // TELA DE BLOQUEIO INTEGRAL QUANDO O TESTE EXPIROU (calc.expirado === true)
  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[9999] flex items-center justify-center p-4 sm:p-6 animate-fadeIn font-sans">
      <div className={`max-w-lg w-full p-6 sm:p-8 rounded-3xl border shadow-2xl space-y-6 text-center relative overflow-hidden ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500"></div>

        {/* Ícone Lock */}
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto shadow-xl">
          <Lock className="w-8 h-8 text-rose-400 animate-bounce" />
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/30 uppercase tracking-widest">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Período de Teste Grátis Expirado
          </span>
          <h2 className="text-2xl font-black text-white">Seu Acesso de 7 Dias Expirou!</h2>
          <p className="text-xs text-slate-300 leading-relaxed font-normal">
            Olá, <strong className="font-bold text-white">{usuarioLogado.nome}</strong>! Os seus 7 dias de avaliação gratuita da plataforma Finanças Pessoal chegaram ao fim.
          </p>
        </div>

        {/* Detalhes da Assinatura */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-3 text-xs">
          <h4 className="font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
            <Gem className="w-4 h-4 text-emerald-400" /> Valores para Ativação Definitiva:
          </h4>

          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 rounded-xl bg-slate-900 border border-slate-800/80">
              <span className="text-slate-300 font-medium">1. Taxa de Adesão da Plataforma (Única):</span>
              <strong className="text-emerald-400 font-extrabold text-sm">R$ 300,00</strong>
            </div>

            <div className="flex justify-between items-center p-2 rounded-xl bg-slate-900 border border-slate-800/80">
              <span className="text-slate-300 font-medium">2. Mensalidade Recorrente:</span>
              <strong className="text-teal-400 font-extrabold text-sm">R$ 30,00 / mês</strong>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 font-normal">
            Após a solicitação, o Administrador Master (<strong className="text-white">juniorbor1986@gmail.com</strong>) liberará o seu painel instantaneamente na tela dele.
          </p>
        </div>

        {/* Botão de Contato WhatsApp com o Admin */}
        <a
          href={linkWhatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black py-3.5 rounded-2xl text-xs shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
        >
          <MessageCircle className="w-5 h-5" /> Enviar Mensagem ao Admin para Liberar Acesso
        </a>
      </div>
    </div>
  );
};

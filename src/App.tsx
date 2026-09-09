import { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { Pacientes } from './components/Pacientes';
import { PerfilPaciente } from './components/PerfilPaciente';
import { AnamneseView } from './components/AnamneseView';
import { Odontograma } from './components/Odontograma';
import { RadiografiaViewer } from './components/RadiografiaViewer';
import { FotografiasGaleria } from './components/FotografiasGaleria';
import { Producao } from './components/Producao';
import { AIAssistant } from './components/AIAssistant';
import { Financeiro } from './components/Financeiro';
import { Relatorios } from './components/Relatorios';
import { Configuracoes } from './components/Configuracoes';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { HeaderBar } from './components/HeaderBar';
import { CentralNotificacoes } from './components/CentralNotificacoes';
import { BancoDeDadosBackup } from './components/BancoDeDadosBackup';
import { AgendaInteligenteMain } from './components/agenda/AgendaInteligenteMain';
import { PainelRetornosPendentes } from './components/agenda/PainelRetornosPendentes';
import { ConfiguracaoWhatsAppPainel } from './components/agenda/ConfiguracaoWhatsAppPainel';
import { PaginaAgendamentoOnlinePublico } from './components/agenda/PaginaAgendamentoOnlinePublico';
import { PainelDentistas } from './components/agenda/PainelDentistas';
import { registrarSessaoDispositivoAtual } from './services/securityService';
import { ModalPlanoEExpiracao } from './components/ModalPlanoEExpiracao';
import { ToastContainer, type ToastMessage } from './components/Toast';
import LOGO_BASE64 from './assets/logoData';

import {
  mockConsultas,
  mockPacientes,
  mockTransacoes,
  dentesIniciaisMock,
  mockAnamneseDetalhada,
  mockRadiografias,
  mockFotografias,
  mockTimeline,
  mockMensagensIA
} from './data/mockData';

import type {
  Consulta,
  Paciente,
  TransacaoFinanceira,
  StatusDente,
  DenteInfo,
  AnamneseDetalhada,
  RadiografiaExame,
  FotografiaClinica,
  HistoricoTimeline,
  MensagemIA
} from './types';

import { pushToCloud, pullFromCloud, subscribeLocalBroadcast, KEYS, getItemJSON, getUserKeys, type UsuarioOnlineInfo } from './services/cloudSync';
import { type UsuarioSistema, getNotificacoesNovosClientesAdmin, type NotificacaoNovoClienteAdmin, registrarHeartbeatLocal, getUsuariosOnlineCombinados } from './services/authService';
import { getConfigNotificacaoProducao, gerarTextoRelatorioProducaoDiaria, gerarLinkWhatsAppDirectApi } from './services/whatsappService';
import { DADOS_PRODUCAO_EXCEL } from './data/dadosProducaoExcel';
import { MessageSquare, Send, X } from 'lucide-react';

const SESSION_KEY = 'odonto_usuario_sessao_v1';

export function App() {
  // Tema Dark Mode
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Autenticação: Abre sempre na tela de login por padrão ao acessar o site
  const [usuarioLogado, setUsuarioLogado] = useState<UsuarioSistema | null>(null);
  const [isAutenticado, setIsAutenticado] = useState<boolean>(false);

  // Navegação
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [pacientePerfilSelecionado, setPacientePerfilSelecionado] = useState<Paciente | null>(null);

  // Notificações Toast
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // States da aplicação com Persistência Permanente no Dispositivo Local (localStorage)
  const [consultas, setConsultas] = useState<Consulta[]>(() => getItemJSON(KEYS.CONSULTAS, mockConsultas));
  const [pacientes, setPacientes] = useState<Paciente[]>(() => getItemJSON(KEYS.PACIENTES, mockPacientes));
  const [transacoes] = useState<TransacaoFinanceira[]>(mockTransacoes);
  const [dentes, setDentes] = useState<Record<number, DenteInfo>>(dentesIniciaisMock);
  const [pacienteOdontograma, setPacienteOdontograma] = useState<Paciente | null>(null);
  const [anamnese, setAnamnese] = useState<AnamneseDetalhada>(mockAnamneseDetalhada);
  const [radiografias, setRadiografias] = useState<RadiografiaExame[]>(mockRadiografias);
  const [fotografias, setFotografias] = useState<FotografiaClinica[]>(() => getItemJSON(KEYS.FOTOGRAFIAS, mockFotografias));
  const [timeline] = useState<HistoricoTimeline[]>(mockTimeline);
  const [mensagensIA, setMensagensIA] = useState<MensagemIA[]>(mockMensagensIA);
  const [centralNotificacoesAberto, setCentralNotificacoesAberto] = useState<boolean>(false);

  // Efeito de salvamento permanente automático no dispositivo local
  useEffect(() => {
    localStorage.setItem(KEYS.PACIENTES, JSON.stringify(pacientes));
  }, [pacientes]);

  useEffect(() => {
    localStorage.setItem(KEYS.CONSULTAS, JSON.stringify(consultas));
  }, [consultas]);

  useEffect(() => {
    localStorage.setItem(KEYS.FOTOGRAFIAS, JSON.stringify(fotografias));
  }, [fotografias]);

  // Preservação Estrita de Dados de Produção e Financeiro (Diretiva #9)
  useEffect(() => {
    localStorage.setItem('odonto_reset_100pct_zerado_v5', 'true');
  }, []);

  // Presença de Usuários Online em Tempo Real
  const [onlineUsers, setOnlineUsers] = useState<UsuarioOnlineInfo[]>([]);

  // Sincronização em nuvem, heartbeat de presença online e Auto-Logout por Inatividade
  useEffect(() => {
    if (!usuarioLogado) return;

    // Registra sessão ativa deste dispositivo
    registrarSessaoDispositivoAtual(usuarioLogado.id);

    const userInfo = {
      nome: usuarioLogado.nome,
      email: usuarioLogado.email,
      role: usuarioLogado.role
    };

    // Registra presença local imediatamente
    registrarHeartbeatLocal({
      id: usuarioLogado.id,
      nome: usuarioLogado.nome,
      email: usuarioLogado.email,
      role: usuarioLogado.role
    });



    const syncHandler = (payload: any) => {
      if (payload.pacientes && payload.pacientes.length > 0) setPacientes(payload.pacientes);
      if (payload.consultas && payload.consultas.length > 0) setConsultas(payload.consultas);
      if (payload.fotografias && payload.fotografias.length > 0) setFotografias(payload.fotografias);

      const combinados = getUsuariosOnlineCombinados(payload.onlineUsers || []);
      setOnlineUsers(combinados);
    };

    // 1. Carregamento prioritário na nuvem ao abrir a aplicação com Heartbeat
    pullFromCloud(syncHandler, true, usuarioLogado.id, userInfo);

    // 2. Escuta alterações locais de abas simultâneas via BroadcastChannel
    const unsubscribeBroadcast = subscribeLocalBroadcast(syncHandler, usuarioLogado.id);

    // Escuta broadcasts de heartbeat de presença de outros usuários no mesmo navegador
    const handleBroadcastChannel = (event: MessageEvent) => {
      if (event.data && (event.data.type === 'PRESENCE_HEARTBEAT' || event.data.type === 'SYNC_UPDATE')) {
        setOnlineUsers(getUsuariosOnlineCombinados());
      }
    };

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel('odontoweb_realtime_channel');
        bc.addEventListener('message', handleBroadcastChannel);
      } catch (e) {}
    }

    // 3. Heartbeat e Polling contínuo em tempo real a cada 3 segundos
    const interval = setInterval(() => {
      registrarHeartbeatLocal({
        id: usuarioLogado.id,
        nome: usuarioLogado.nome,
        email: usuarioLogado.email,
        role: usuarioLogado.role
      });
      pullFromCloud(syncHandler, false, usuarioLogado.id, userInfo);
    }, 3000);

    const handleFocus = () => {
      registrarHeartbeatLocal({
        id: usuarioLogado.id,
        nome: usuarioLogado.nome,
        email: usuarioLogado.email,
        role: usuarioLogado.role
      });
      pullFromCloud(syncHandler, true, usuarioLogado.id, userInfo);
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      unsubscribeBroadcast();
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [usuarioLogado]);

  // MONITOR GLOBAL DE NOTIFICAÇÃO DE WHATSAPP (18:30H)
  const [whatsappToastBanner, setWhatsappToastBanner] = useState<{
    visivel: boolean;
    mensagem: string;
    linkDirect: string;
    telefone: string;
  } | null>(null);

  useEffect(() => {
    if (!usuarioLogado) return;

    const checkWhatsappSchedule = () => {
      const config = getConfigNotificacaoProducao();
      if (!config.automacaoAtiva) return;

      const agora = new Date();
      const hora = agora.getHours();
      const minuto = agora.getMinutes();
      const hoje = agora.toISOString().split('T')[0];

      const [hAlvo, mAlvo] = (config.horario || '18:30').split(':').map(Number);
      const jaDisparou = localStorage.getItem('odonto_whatsapp_ultimo_disparo_data') === hoje;

      if (!jaDisparou && (hora > hAlvo || (hora === hAlvo && minuto >= mAlvo))) {
        localStorage.setItem('odonto_whatsapp_ultimo_disparo_data', hoje);

        const keys = getUserKeys(usuarioLogado?.id);
        let itensProd: any[] = getItemJSON<any[]>(keys.PRODUCAO, []);
        if (!Array.isArray(itensProd) || itensProd.length === 0) {
          itensProd = DADOS_PRODUCAO_EXCEL;
        }

        const textoMensagem = gerarTextoRelatorioProducaoDiaria(itensProd, config);
        const linkDirect = gerarLinkWhatsAppDirectApi(config.telefone, textoMensagem);

        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification("📲 Resumo Diário de Produção (18:30h)", {
              body: `Balanço das 7 clínicas pronto para envio para (${config.telefone})!`,
              icon: LOGO_BASE64
            });
          } catch (e) {}
        }

        try {
          window.open(linkDirect, '_blank');
        } catch (e) {}

        if (config.webhookUrl) {
          fetch(config.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone: config.telefone,
              message: textoMensagem
            })
          }).catch((err) => console.error('Erro ao enviar Webhook WhatsApp:', err));
        }

        if (config.callmebotApiKey) {
          const numLimpo = config.telefone.replace(/\D/g, '');
          const numCom55 = numLimpo.startsWith('55') ? numLimpo : `55${numLimpo}`;
          const urlCallmebot = `https://api.callmebot.com/whatsapp.php?phone=${numCom55}&text=${encodeURIComponent(textoMensagem)}&apikey=${config.callmebotApiKey}`;
          fetch(urlCallmebot, { mode: 'no-cors' }).catch(() => {});
        }

        setWhatsappToastBanner({
          visivel: true,
          mensagem: textoMensagem,
          linkDirect,
          telefone: config.telefone
        });
      }
    };

    checkWhatsappSchedule();
    const interval = setInterval(checkWhatsappSchedule, 10000);
    return () => clearInterval(interval);
  }, [usuarioLogado]);

  // Aplicar classe dark no HTML root
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Monitoramento em tempo real de novos cadastros de clientes para o Administrador Master
  useEffect(() => {
    if (usuarioLogado?.role !== 'admin') return;

    let ultimoIdNotificado = '';

    const checarNovosClientes = () => {
      const notificacoes = getNotificacoesNovosClientesAdmin();
      const naoLidas = notificacoes.filter((n: NotificacaoNovoClienteAdmin) => !n.lida);
      if (naoLidas.length > 0) {
        const maisRecente = naoLidas[0];
        if (maisRecente.id !== ultimoIdNotificado) {
          ultimoIdNotificado = maisRecente.id;
          addToast(
            `🚨 ALERTA: Novo Cliente Cadastrado!`,
            `O cliente ${maisRecente.clienteNome} (${maisRecente.clienteEmail}) criou uma conta com 7 dias de teste grátis!`,
            'info'
          );
        }
      }
    };

    checarNovosClientes();
    const interval = setInterval(checarNovosClientes, 2000);

    const handleBroadcast = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NOVO_CLIENTE_CADASTRADO') {
        const cli = event.data.payload;
        addToast(
          `🚨 ALERTA: Novo Cliente Cadastrado!`,
          `O cliente ${cli.clienteNome} (${cli.clienteEmail}) criou uma conta com 7 dias de teste grátis!`,
          'info'
        );
      }
    };

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel('odontoweb_realtime_channel');
        bc.addEventListener('message', handleBroadcast);
        return () => {
          clearInterval(interval);
          bc.removeEventListener('message', handleBroadcast);
        };
      } catch (e) {}
    }

    return () => clearInterval(interval);
  }, [usuarioLogado]);

  const addToast = (mensagem: string, descOrTipo?: string, tipoParam: 'sucesso' | 'erro' | 'info' = 'sucesso') => {
    const id = `toast-${Date.now()}`;
    const tipoFinal = (descOrTipo === 'sucesso' || descOrTipo === 'erro' || descOrTipo === 'info') ? descOrTipo : tipoParam;
    const msgCompleta = (descOrTipo && descOrTipo !== tipoFinal) ? `${mensagem} ${descOrTipo}` : mensagem;
    setToasts((prev) => [...prev, { id, mensagem: msgCompleta, tipo: tipoFinal }]);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Handlers Login/Logout Persistente
  const handleLoginSuccess = (usuario: UsuarioSistema) => {
    setUsuarioLogado(usuario);
    setIsAutenticado(true);
    setActiveTab('dashboard');
    setPacientePerfilSelecionado(null);
    setPacienteOdontograma(null);
    localStorage.setItem(SESSION_KEY, JSON.stringify(usuario));
    addToast(`Bem-vindo(a) ao Finanças Pessoal!`, 'sucesso');
  };

  const handleLogout = () => {
    setIsAutenticado(false);
    setUsuarioLogado(null);
    setActiveTab('dashboard');
    setPacientePerfilSelecionado(null);
    setPacienteOdontograma(null);
    localStorage.removeItem(SESSION_KEY);
  };

  // Handlers Pacientes (Add, Edit, Delete)

  // Handlers Pacientes (Add, Edit, Delete)
  // Handlers Pacientes (Add, Edit, Delete)
  const handleAddPaciente = (novo: Omit<Paciente, 'id' | 'dataCadastro'>) => {
    const id = `pac-${Date.now()}`;
    const dataCadastro = new Date().toISOString().split('T')[0];
    const pacienteCriado: Paciente = { id, dataCadastro, ...novo };
    const novosPacientes = [pacienteCriado, ...pacientes];

    let novasFotos = [...fotografias];
    if (novo.fotoUrl) {
      const novaFoto: FotografiaClinica = {
        id: `foto-${Date.now()}`,
        pacienteId: id,
        categoria: 'Frontal',
        data: dataCadastro,
        imagemUrl: novo.fotoUrl,
        titulo: `Foto de Perfil / Cadastro - ${novo.nome}`,
        descricao: `Fotografia de perfil inicial capturada durante o cadastro de ${novo.nome}.`
      };
      novasFotos = [novaFoto, ...novasFotos];
      setFotografias(novasFotos);
    }

    setPacientes(novosPacientes);
    pushToCloud({ pacientes: novosPacientes, fotografias: novasFotos });

    setPacienteOdontograma(pacienteCriado);
    addToast(`Paciente ${novo.nome} cadastrado com sucesso!`, 'sucesso');
  };

  const handleEditPaciente = (paciente: Paciente) => {
    const atualizados = pacientes.map((p) => (p.id === paciente.id ? paciente : p));

    let novasFotos = [...fotografias];
    if (paciente.fotoUrl) {
      const jaExiste = fotografias.some((f) => f.imagemUrl === paciente.fotoUrl || f.pacienteId === paciente.id);
      if (!jaExiste) {
        const novaFoto: FotografiaClinica = {
          id: `foto-${Date.now()}`,
          pacienteId: paciente.id,
          categoria: 'Frontal',
          data: new Date().toISOString().split('T')[0],
          imagemUrl: paciente.fotoUrl,
          titulo: `Foto de Perfil - ${paciente.nome}`,
          descricao: `Fotografia atualizada de perfil do paciente ${paciente.nome}.`
        };
        novasFotos = [novaFoto, ...novasFotos];
        setFotografias(novasFotos);
      }
    }

    setPacientes(atualizados);
    pushToCloud({ pacientes: atualizados, fotografias: novasFotos });

    if (pacientePerfilSelecionado?.id === paciente.id) {
      setPacientePerfilSelecionado(paciente);
    }
    addToast(`Ficha do paciente ${paciente.nome} atualizada!`, 'sucesso');
  };

  const handleDeletePaciente = (id: string) => {
    const restantes = pacientes.filter((p) => p.id !== id);
    setPacientes(restantes);
    pushToCloud({ pacientes: restantes });
    if (pacientePerfilSelecionado?.id === id) {
      setPacientePerfilSelecionado(null);
      setActiveTab('pacientes');
    }
    addToast('Cadastro do paciente removido com sucesso.', 'info');
  };

  // Handlers Odontograma
  const handleUpdateDente = (numero: number, status: StatusDente, observacoes?: string) => {
    setDentes((prev) => ({
      ...prev,
      [numero]: { numero, status, observacoes }
    }));
    addToast(`Diagnóstico do dente ${numero} atualizado!`, 'sucesso');
  };

  // Handlers Radiografias (Add, Delete)
  const handleAddRadiografia = (nova: Omit<RadiografiaExame, 'id'>) => {
    const id = `rad-${Date.now()}`;
    setRadiografias((prev) => [{ id, ...nova }, ...prev]);
    addToast('Exame radiográfico adicionado ao prontuário!', 'sucesso');
  };

  const handleDeleteRadiografia = (id: string) => {
    setRadiografias((prev) => prev.filter((r) => r.id !== id));
    addToast('Exame radiográfico removido com sucesso.', 'info');
  };

  // Handlers Fotografias (Add, Delete)
  const handleAddFotografia = (nova: Omit<FotografiaClinica, 'id'>) => {
    const id = `foto-${Date.now()}`;
    const novas = [{ id, ...nova }, ...fotografias];
    setFotografias(novas);
    pushToCloud({ fotografias: novas });
    addToast('Fotografia clínica registrada na galeria!', 'sucesso');
  };

  const handleDeleteFotografia = (id: string) => {
    const restantes = fotografias.filter((f) => f.id !== id);
    setFotografias(restantes);
    pushToCloud({ fotografias: restantes });
    addToast('Fotografia clínica removida da galeria.', 'info');
  };

  const handleEnviarMensagemIA = (texto: string) => {
    const userMsg: MensagemIA = {
      id: `ia-${Date.now()}`,
      remetente: 'usuario',
      texto,
      dataHora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setMensagensIA((prev) => [...prev, userMsg]);

    setTimeout(() => {
      const respIA: MensagemIA = {
        id: `ia-resp-${Date.now()}`,
        remetente: 'ia',
        texto: `Analisando seu pedido sobre: "${texto}". Com base nas diretrizes odontológicas atuais, recomenda-se proceder com anamnese completa antes de qualquer conduta cirúrgica ou restauradora.`,
        dataHora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        sugestaoPlano: 'Conduta Profilática + Avaliação Periapical'
      };
      setMensagensIA((prev) => [...prev, respIA]);
    }, 1000);
  };

  const handleVerPerfilPaciente = (paciente: Paciente) => {
    setPacientePerfilSelecionado(paciente);
    setActiveTab('perfil_paciente');
  };

  const handleAbrirOdontogramaPaciente = (paciente: Paciente) => {
    setPacienteOdontograma(paciente);
    setActiveTab('odontograma');
  };

  if (!isAutenticado || !usuarioLogado) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const hojeIso = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
  const consultasHoje = (consultas || []).filter((c) => c && typeof c.dataHora === 'string' && c.dataHora.startsWith(hojeIso)).length;
  const pendentesCount = (transacoes || []).filter((t) => t && t.status === 'Pendente').length;

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${
      darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Banner / Tela de Bloqueio por Teste Expirado (7 Dias) */}
      <ModalPlanoEExpiracao usuarioLogado={usuarioLogado} darkMode={darkMode} />
      {/* Sidebar Retrátil & Menu Mobile */}
      <Sidebar
        activeTab={activeTab === 'perfil_paciente' ? 'pacientes' : activeTab}
        onNavigate={(tab) => {
          if (usuarioLogado?.role === 'cliente' && tab === 'producao') return;
          setActiveTab(tab);
          setPacientePerfilSelecionado(null);
          setIsMobileMenuOpen(false);
        }}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        darkMode={darkMode}
        onLogout={handleLogout}
        userRole={usuarioLogado?.role || 'admin'}
        badgeCounts={{
          consultasHoje,
          pacientes: pacientes.length,
          pendentes: pendentesCount
        }}
      />

      {/* Main Content Area (Calculado perfeitamente para nao cortar nada na direita) */}
      <div className={`transition-all duration-300 flex flex-col min-h-screen box-border overflow-x-hidden w-full ${
        isSidebarCollapsed ? 'md:ml-20 md:w-[calc(100%-5rem)]' : 'md:ml-64 md:w-[calc(100%-16rem)]'
      }`}>
        {/* Header Superior */}
        <HeaderBar
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          usuarioLogado={usuarioLogado}
          onLogout={handleLogout}
          onNavigate={(tab) => {
            if (usuarioLogado?.role === 'cliente' && tab === 'producao') return;
            setActiveTab(tab);
          }}
          pacientes={pacientes}
          consultas={consultas}
          onSelectPaciente={(p) => handleVerPerfilPaciente(p)}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onAbrirNotificacoes={() => setCentralNotificacoesAberto(true)}
          onlineUsers={onlineUsers}
        />

        {/* BANNER FLUTUANTE GLOBAL DE NOTIFICAÇÃO DO WHATSAPP (18:30H) */}
        {whatsappToastBanner?.visivel && (
          <div className="mx-3 sm:mx-6 mt-3 bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-950 text-white p-4 rounded-3xl shadow-2xl border-2 border-emerald-400 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-400/40 text-emerald-300 shrink-0">
                  <MessageSquare className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/40">
                    ALERTA DAS 18:30H • RESUMO DAS CLÍNICAS PRONTO
                  </span>
                  <h4 className="text-sm font-extrabold text-white mt-0.5">
                    Resumo do Desempenho Financeiro por Clínica Gerado!
                  </h4>
                  <p className="text-[11px] text-emerald-100">
                    Destinatário configurado: <strong>{whatsappToastBanner.telefone}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <a
                  href={whatsappToastBanner.linkDirect}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setWhatsappToastBanner(null)}
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/30 cursor-pointer transition-all hover:scale-105"
                >
                  <Send className="w-4 h-4" /> Disparar no WhatsApp Agora
                </a>
                <button
                  onClick={() => setWhatsappToastBanner(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/80 hover:bg-slate-800 cursor-pointer"
                  title="Fechar Alerta"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Views */}
        <main className="p-3 sm:p-6 flex-1 box-border w-full max-w-full transition-all">
          {activeTab === 'dashboard' && (
            <Dashboard
              onNavigate={setActiveTab}
              darkMode={darkMode}
              userRole={usuarioLogado?.role || 'admin'}
              usuarioId={usuarioLogado?.id}
              onlineUsersCount={onlineUsers.length || 1}
            />
          )}

          {activeTab === 'pacientes' && (
            <Pacientes
              pacientes={pacientes}
              onAddPaciente={handleAddPaciente}
              onEditPaciente={handleEditPaciente}
              onDeletePaciente={handleDeletePaciente}
              onSelectPacienteParaOdontograma={handleAbrirOdontogramaPaciente}
              onVerPerfilCompleto={handleVerPerfilPaciente}
              darkMode={darkMode}
            />
          )}

          {activeTab === 'perfil_paciente' && pacientePerfilSelecionado && (
            <PerfilPaciente
              paciente={pacientePerfilSelecionado}
              consultas={consultas}
              procedimentos={[]}
              dentes={dentes}
              onUpdateDente={handleUpdateDente}
              anamnese={anamnese}
              radiografias={radiografias}
              fotografias={fotografias}
              timeline={timeline}
              onVoltar={() => setActiveTab('pacientes')}
              onAddRadiografia={handleAddRadiografia}
              onDeleteRadiografia={handleDeleteRadiografia}
              onAddFotografia={handleAddFotografia}
              onDeleteFotografia={handleDeleteFotografia}
              darkMode={darkMode}
            />
          )}

          {(activeTab === 'agenda' || activeTab === 'agendainteligente') && (
            <AgendaInteligenteMain
              darkMode={darkMode}
              usuarioId={usuarioLogado?.id}
              pacientesExistentes={pacientes}
              onNavigateToProntuario={(pId) => {
                const p = pacientes.find((pac) => pac.id === pId);
                if (p) {
                  setPacientePerfilSelecionado(p);
                  setActiveTab('prontuario');
                } else {
                  setActiveTab('pacientes');
                }
              }}
              onNavigateToAgendamentoOnline={() => setActiveTab('agendamentoonline')}
            />
          )}

          {activeTab === 'producao' && usuarioLogado?.role !== 'cliente' && (
            <Producao darkMode={darkMode} usuarioId={usuarioLogado?.id} />
          )}

          {activeTab === 'odontograma' && (
            <Odontograma
              pacienteNome={pacienteOdontograma ? pacienteOdontograma.nome : undefined}
              dentes={dentes}
              onUpdateDente={handleUpdateDente}
              darkMode={darkMode}
            />
          )}

          {activeTab === 'anamnese' && (
            <AnamneseView
              anamnese={anamnese}
              pacienteNome={pacienteOdontograma?.nome}
              onSalvarAnamnese={setAnamnese}
              darkMode={darkMode}
            />
          )}

          {activeTab === 'radiografias' && (
            <RadiografiaViewer
              exames={radiografias}
              pacienteNome={pacienteOdontograma?.nome}
              onAddRadiografia={handleAddRadiografia}
              onDeleteRadiografia={handleDeleteRadiografia}
              darkMode={darkMode}
            />
          )}

          {activeTab === 'fotografias' && (
            <FotografiasGaleria
              fotografias={fotografias}
              pacienteNome={pacienteOdontograma?.nome}
              onAddFotografia={handleAddFotografia}
              onDeleteFotografia={handleDeleteFotografia}
              darkMode={darkMode}
            />
          )}

          {activeTab === 'ia' && (
            <AIAssistant
              mensagens={mensagensIA}
              onEnviarMensagem={handleEnviarMensagemIA}
              pacientes={pacientes}
              darkMode={darkMode}
            />
          )}

          {activeTab === 'financeiro' && (
            <Financeiro
              darkMode={darkMode}
              userRole={usuarioLogado?.role || 'admin'}
              usuarioId={usuarioLogado?.id}
            />
          )}

          {activeTab === 'relatorios' && (
            <Relatorios
              darkMode={darkMode}
              userRole={usuarioLogado?.role || 'admin'}
              usuarioId={usuarioLogado?.id}
            />
          )}

          {activeTab === 'agendainteligente' && (
            <AgendaInteligenteMain
              darkMode={darkMode}
              usuarioId={usuarioLogado?.id}
              pacientesExistentes={pacientes}
              onNavigateToProntuario={(pId) => {
                const p = pacientes.find((pac) => pac.id === pId);
                if (p) {
                  setPacientePerfilSelecionado(p);
                  setActiveTab('prontuario');
                } else {
                  setActiveTab('pacientes');
                }
              }}
              onNavigateToAgendamentoOnline={() => setActiveTab('agendamentoonline')}
            />
          )}

          {activeTab === 'retornos' && (
            <PainelRetornosPendentes
              darkMode={darkMode}
              usuarioId={usuarioLogado?.id}
            />
          )}

          {activeTab === 'whatsapp' && (
            <ConfiguracaoWhatsAppPainel
              darkMode={darkMode}
              usuarioId={usuarioLogado?.id}
            />
          )}

          {activeTab === 'agendamentoonline' && (
            <PaginaAgendamentoOnlinePublico
              darkMode={darkMode}
              usuarioId={usuarioLogado?.id}
              onConcluido={() => setActiveTab('agendainteligente')}
            />
          )}

          {activeTab === 'dentistas' && (
            <PainelDentistas
              darkMode={darkMode}
              usuarioId={usuarioLogado?.id}
            />
          )}

          {activeTab === 'bancodedados' && (
            <BancoDeDadosBackup
              darkMode={darkMode}
              usuarioId={usuarioLogado?.id}
            />
          )}

          {activeTab === 'configuracoes' && (
            <Configuracoes
              darkMode={darkMode}
              onToggleDarkMode={() => setDarkMode(!darkMode)}
              usuarioLogado={usuarioLogado}
            />
          )}
        </main>

        {/* Footer */}
        <footer className={`p-4 border-t text-center text-xs transition-colors flex items-center justify-center gap-2 ${
          darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
        }`}>
          <img src={LOGO_BASE64} alt="OdontoWeb - Finanças Logo" className="w-5 h-5 object-contain rounded-full bg-white p-0.5 border border-teal-500/40 inline-block" />
          <span>OdontoWeb - Finanças Platform &copy; {new Date().getFullYear()} • Gestão Financeira & Produção</span>
        </footer>
      </div>

      {/* Container de Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />

      {centralNotificacoesAberto && (
        <CentralNotificacoes
          transacoes={getItemJSON(getUserKeys(usuarioLogado?.id).FINANCEIRO, [])}
          darkMode={darkMode}
          usuarioLogado={usuarioLogado}
          onNavegarPainelAdmin={() => setActiveTab('configuracoes')}
          onFechar={() => setCentralNotificacoesAberto(false)}
        />
      )}
    </div>
  );
}

export default App;

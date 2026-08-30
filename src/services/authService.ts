import { getItemJSON, pushToCloud } from './cloudSync';

export interface UsuarioSistema {
  id: string;
  nome: string;
  email: string;
  senhaHash?: string;
  funcao: string;
  cro?: string;
  role: 'admin' | 'cliente';
  dataCriacao: string;
  ultimoAcesso?: string;
  totalAcessos: number;
  dispositivo?: string;
  status: 'Ativo' | 'Bloqueado';
  statusPlano?: 'teste' | 'ativo' | 'expirado' | 'bloqueado';
  dataExpiraTeste?: string; // YYYY-MM-DD
  valorAdesao?: number; // 300.00
  valorMensalidade?: number; // 30.00
}

export interface LogAuditoriaAcesso {
  id: string;
  usuarioId: string;
  nomeUsuario: string;
  emailUsuario: string;
  dataHora: string;
  tipoEvento: 'LOGIN_SUCESSO' | 'LOGIN_FALHA' | 'CONTA_CRIADA' | 'ERRO_SISTEMA' | 'ALTERACAO_SENHA' | 'PLANO_ATIVADO' | 'TESTE_PRORROGADO';
  dispositivoInfo: string;
  mensagemDetalhe: string;
  status: 'Sucesso' | 'Alerta' | 'Erro';
}

export interface NotificacaoNovoClienteAdmin {
  id: string;
  clienteId: string;
  clienteNome: string;
  clienteEmail: string;
  dataHora: string;
  lida: boolean;
  mensagem: string;
}

const STORAGE_USUARIOS = 'odonto_usuarios_sistema_v1';
const STORAGE_LOGS = 'odonto_logs_auditoria_acesso_v1';
const STORAGE_NOTIFICACOES_ADMIN = 'odonto_notificacoes_novos_clientes_v1';

export const ADMIN_PADRAO: UsuarioSistema = {
  id: 'usr-admin-master',
  nome: 'Crenilto Junior',
  email: 'juniorbor1986@gmail.com',
  senhaHash: 'bitoninha1234',
  funcao: 'Administrador Master',
  role: 'admin',
  dataCriacao: '2026-01-01',
  ultimoAcesso: new Date().toISOString(),
  totalAcessos: 154,
  dispositivo: 'Windows / Chrome',
  status: 'Ativo',
  statusPlano: 'ativo',
  dataExpiraTeste: '2099-12-31',
  valorAdesao: 0,
  valorMensalidade: 0
};

const STORAGE_PRESENCE_HEARTBEATS = 'odonto_presence_heartbeats_v2';

export const registrarHeartbeatLocal = (usuario: { id: string; nome: string; email: string; role: string }) => {
  const map = getItemJSON<Record<string, { usuarioId: string; nome: string; email: string; role: string; timestamp: number }>>(STORAGE_PRESENCE_HEARTBEATS, {});
  map[usuario.id] = {
    usuarioId: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    role: usuario.role,
    timestamp: Date.now()
  };
  localStorage.setItem(STORAGE_PRESENCE_HEARTBEATS, JSON.stringify(map));

  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      const bc = new BroadcastChannel('odontoweb_realtime_channel');
      bc.postMessage({ type: 'PRESENCE_HEARTBEAT', payload: map[usuario.id] });
    } catch (e) {}
  }
};

export const getUsuariosOnlineCombinados = (remoteOnlineUsers: any[] = []): any[] => {
  const mapLocal = getItemJSON<Record<string, any>>(STORAGE_PRESENCE_HEARTBEATS, {});
  const now = Date.now();
  const result: Record<string, any> = {};

  // Inclui remotos válidos (< 60s)
  if (Array.isArray(remoteOnlineUsers)) {
    remoteOnlineUsers.forEach((u) => {
      if (u && u.usuarioId && now - (u.timestamp || 0) < 60000) {
        result[u.usuarioId] = u;
      }
    });
  }

  // Inclui locais válidos (< 60s)
  Object.values(mapLocal).forEach((u) => {
    if (u && u.usuarioId && now - (u.timestamp || 0) < 60000) {
      result[u.usuarioId] = u;
    }
  });

  return Object.values(result);
};

export const getNotificacoesNovosClientesAdmin = (): NotificacaoNovoClienteAdmin[] => {
  return getItemJSON<NotificacaoNovoClienteAdmin[]>(STORAGE_NOTIFICACOES_ADMIN, []);
};

export const marcarNotificacoesNovosClientesComoLidas = () => {
  const notificacoes = getNotificacoesNovosClientesAdmin();
  const lidas = notificacoes.map((n) => ({ ...n, lida: true }));
  localStorage.setItem(STORAGE_NOTIFICACOES_ADMIN, JSON.stringify(lidas));
};

export const adicionarNotificacaoNovoClienteAdmin = (cliente: UsuarioSistema) => {
  const notificacoes = getNotificacoesNovosClientesAdmin();
  const nova: NotificacaoNovoClienteAdmin = {
    id: `notif-cli-${Date.now()}`,
    clienteId: cliente.id,
    clienteNome: cliente.nome,
    clienteEmail: cliente.email,
    dataHora: new Date().toLocaleString('pt-BR'),
    lida: false,
    mensagem: `🚨 NOVO CLIENTE CADASTRADO: ${cliente.nome} (${cliente.email}) iniciou o teste de 7 dias grátis!`
  };
  const listaAtualizada = [nova, ...notificacoes];
  localStorage.setItem(STORAGE_NOTIFICACOES_ADMIN, JSON.stringify(listaAtualizada));

  // Push to cloud payload para notificação instantânea do Admin
  pushToCloud({
    updatedAt: Date.now(),
    updatedBy: `Novo Cliente (${cliente.nome})`
  }, 'usr-admin-master');

  // Transmissão local em tempo real para abas abertas
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      const bc = new BroadcastChannel('odontoweb_realtime_channel');
      bc.postMessage({
        type: 'NOVO_CLIENTE_CADASTRADO',
        payload: nova
      });
    } catch (e) {}
  }
};

export const calcularDiasRestantesEStatusPlano = (usuario: UsuarioSistema): {
  diasRestantes: number;
  expirado: boolean;
  statusCalculado: 'teste' | 'ativo' | 'expirado' | 'bloqueado';
} => {
  if (usuario.role === 'admin' || usuario.statusPlano === 'ativo') {
    return { diasRestantes: 999, expirado: false, statusCalculado: 'ativo' };
  }

  if (usuario.status === 'Bloqueado' || usuario.statusPlano === 'bloqueado') {
    return { diasRestantes: 0, expirado: true, statusCalculado: 'bloqueado' };
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const dataBase = usuario.dataExpiraTeste ? new Date(usuario.dataExpiraTeste) : new Date();
  dataBase.setHours(0, 0, 0, 0);

  const diffMs = dataBase.getTime() - hoje.getTime();
  const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diasRestantes <= 0) {
    return { diasRestantes: 0, expirado: true, statusCalculado: 'expirado' };
  }

  return { diasRestantes, expirado: false, statusCalculado: 'teste' };
};

export const getUsuariosCadastrados = (): UsuarioSistema[] => {
  const raw = getItemJSON<UsuarioSistema[]>(STORAGE_USUARIOS, []);
  const usuarios = Array.isArray(raw) ? raw : [];
  if (usuarios.length === 0) {
    const listaInicial = [ADMIN_PADRAO];
    localStorage.setItem(STORAGE_USUARIOS, JSON.stringify(listaInicial));
    return listaInicial;
  }
  // Garantir que o Admin padrão sempre existe com as credenciais corretas
  const indexAdmin = usuarios.findIndex((u: UsuarioSistema) => u && u.email && u.email.toLowerCase() === ADMIN_PADRAO.email.toLowerCase());
  if (indexAdmin === -1) {
    usuarios.unshift(ADMIN_PADRAO);
    localStorage.setItem(STORAGE_USUARIOS, JSON.stringify(usuarios));
  } else {
    usuarios[indexAdmin] = {
      ...usuarios[indexAdmin],
      role: 'admin',
      statusPlano: 'ativo'
    };
  }
  return usuarios;
};

export const getLogsAuditoria = (): LogAuditoriaAcesso[] => {
  const logs = getItemJSON<LogAuditoriaAcesso[]>(STORAGE_LOGS, []);
  if (logs.length === 0) {
    const logsIniciais: LogAuditoriaAcesso[] = [
      {
        id: 'log-init-1',
        usuarioId: ADMIN_PADRAO.id,
        nomeUsuario: ADMIN_PADRAO.nome,
        emailUsuario: ADMIN_PADRAO.email,
        dataHora: new Date().toLocaleString('pt-BR'),
        tipoEvento: 'LOGIN_SUCESSO',
        dispositivoInfo: 'Windows / Chrome Desktop',
        mensagemDetalhe: 'Sessão de Administrador iniciada com sucesso.',
        status: 'Sucesso'
      }
    ];
    localStorage.setItem(STORAGE_LOGS, JSON.stringify(logsIniciais));
    return logsIniciais;
  }
  return logs;
};

export const registrarLogAuditoria = (log: Omit<LogAuditoriaAcesso, 'id'>) => {
  const logs = getLogsAuditoria();
  const novoLog: LogAuditoriaAcesso = {
    ...log,
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
  };
  const listaAtualizada = [novoLog, ...logs].slice(0, 100);
  localStorage.setItem(STORAGE_LOGS, JSON.stringify(listaAtualizada));
};

export const registrarNovoUsuario = (dados: {
  nome: string;
  email: string;
  senha: string;
}): { sucesso: boolean; mensagem: string; usuario?: UsuarioSistema } => {
  const usuarios = getUsuariosCadastrados();
  const emailFormatado = (dados.email || '').trim().toLowerCase();

  if (usuarios.some(u => u && u.email && u.email.toLowerCase() === emailFormatado)) {
    registrarLogAuditoria({
      usuarioId: 'desconhecido',
      nomeUsuario: dados.nome,
      emailUsuario: emailFormatado,
      dataHora: new Date().toLocaleString('pt-BR'),
      tipoEvento: 'LOGIN_FALHA',
      dispositivoInfo: `${navigator.platform} / ${navigator.userAgent.split(' ')[0]}`,
      mensagemDetalhe: 'Tentativa de cadastro com e-mail já existente no sistema.',
      status: 'Alerta'
    });
    return { sucesso: false, mensagem: 'Este e-mail já está cadastrado no sistema. Faça login.' };
  }

  const dataHoje = new Date();
  const dataExpira = new Date(dataHoje.getTime() + 7 * 24 * 60 * 60 * 1000);

  const novoUsuario: UsuarioSistema = {
    id: `usr-cli-${Date.now()}`,
    nome: dados.nome,
    email: emailFormatado,
    senhaHash: dados.senha,
    funcao: 'Cliente / Finanças Pessoais',
    role: 'cliente',
    dataCriacao: dataHoje.toISOString().split('T')[0],
    ultimoAcesso: new Date().toLocaleString('pt-BR'),
    totalAcessos: 1,
    dispositivo: `${navigator.platform || 'Desktop'} / Browser`,
    status: 'Ativo',
    statusPlano: 'teste',
    dataExpiraTeste: dataExpira.toISOString().split('T')[0],
    valorAdesao: 300,
    valorMensalidade: 30
  };

  const listaAtualizada = [...usuarios, novoUsuario];
  localStorage.setItem(STORAGE_USUARIOS, JSON.stringify(listaAtualizada));

  // Registrar Log de Auditoria
  registrarLogAuditoria({
    usuarioId: novoUsuario.id,
    nomeUsuario: novoUsuario.nome,
    emailUsuario: novoUsuario.email,
    dataHora: new Date().toLocaleString('pt-BR'),
    tipoEvento: 'CONTA_CRIADA',
    dispositivoInfo: novoUsuario.dispositivo || 'Dispositivo Móvel/Web',
    mensagemDetalhe: `Novo cliente cadastrado com teste grátis de 7 dias (Expira em ${novoUsuario.dataExpiraTeste}).`,
    status: 'Sucesso'
  });

  // Notificar o Admin Master com alerta instantâneo
  adicionarNotificacaoNovoClienteAdmin(novoUsuario);

  return { sucesso: true, mensagem: 'Conta criada com 7 dias de teste grátis!', usuario: novoUsuario };
};

export const autenticarUsuario = (email: string = '', senha: string = ''): {
  sucesso: boolean;
  mensagem: string;
  usuario?: UsuarioSistema;
} => {
  const usuarios = getUsuariosCadastrados();
  const emailFormatado = (email || '').trim().toLowerCase();
  const usuario = usuarios.find(u => u && u.email && u.email.toLowerCase() === emailFormatado);

  const infoDispositivo = `${navigator.platform || 'Desconhecido'} / ${navigator.userAgent.split(' ')[0]}`;

  if (!usuario) {
    registrarLogAuditoria({
      usuarioId: 'desconhecido',
      nomeUsuario: 'Desconhecido',
      emailUsuario: emailFormatado,
      dataHora: new Date().toLocaleString('pt-BR'),
      tipoEvento: 'LOGIN_FALHA',
      dispositivoInfo: infoDispositivo,
      mensagemDetalhe: 'Tentativa de login com e-mail não cadastrado.',
      status: 'Alerta'
    });
    return { sucesso: false, mensagem: 'E-mail ou senha incorretos. Por favor, tente novamente.' };
  }

  if (usuario.status === 'Bloqueado') {
    registrarLogAuditoria({
      usuarioId: usuario.id,
      nomeUsuario: usuario.nome,
      emailUsuario: usuario.email,
      dataHora: new Date().toLocaleString('pt-BR'),
      tipoEvento: 'ERRO_SISTEMA',
      dispositivoInfo: infoDispositivo,
      mensagemDetalhe: 'Bloqueio de segurança: Usuário com acesso suspenso tentou efetuar login.',
      status: 'Erro'
    });
    return { sucesso: false, mensagem: 'Seu acesso está temporariamente suspenso pelo Administrador.' };
  }

  if (usuario.senhaHash !== senha) {
    registrarLogAuditoria({
      usuarioId: usuario.id,
      nomeUsuario: usuario.nome,
      emailUsuario: usuario.email,
      dataHora: new Date().toLocaleString('pt-BR'),
      tipoEvento: 'LOGIN_FALHA',
      dispositivoInfo: infoDispositivo,
      mensagemDetalhe: 'Senha incorreta informada durante a autenticação.',
      status: 'Alerta'
    });
    return { sucesso: false, mensagem: 'E-mail ou senha incorretos. Por favor, tente novamente.' };
  }

  // Atualizar cálculo do plano no login
  const calc = calcularDiasRestantesEStatusPlano(usuario);
  if (usuario.role !== 'admin' && usuario.statusPlano !== 'ativo') {
    usuario.statusPlano = calc.statusCalculado;
  }

  // Login com Sucesso: Atualiza estatísticas do usuário
  usuario.ultimoAcesso = new Date().toLocaleString('pt-BR');
  usuario.totalAcessos = (usuario.totalAcessos || 0) + 1;
  usuario.dispositivo = infoDispositivo;

  localStorage.setItem(STORAGE_USUARIOS, JSON.stringify(usuarios));

  registrarLogAuditoria({
    usuarioId: usuario.id,
    nomeUsuario: usuario.nome,
    emailUsuario: usuario.email,
    dataHora: new Date().toLocaleString('pt-BR'),
    tipoEvento: 'LOGIN_SUCESSO',
    dispositivoInfo: infoDispositivo,
    mensagemDetalhe: `Sessão iniciada (${usuario.role === 'admin' ? 'Master' : 'Cliente Plano: ' + usuario.statusPlano}).`,
    status: 'Sucesso'
  });

  return { sucesso: true, mensagem: 'Autenticado com sucesso!', usuario };
};

export const ativarPlanoDefinitivoCliente = (usuarioId: string): UsuarioSistema[] => {
  const usuarios = getUsuariosCadastrados();
  const atualizados = usuarios.map((u) => {
    if (u.id === usuarioId) {
      return {
        ...u,
        status: 'Ativo' as const,
        statusPlano: 'ativo' as const
      };
    }
    return u;
  });
  localStorage.setItem(STORAGE_USUARIOS, JSON.stringify(atualizados));

  const uTarget = atualizados.find((u) => u.id === usuarioId);
  if (uTarget) {
    registrarLogAuditoria({
      usuarioId: uTarget.id,
      nomeUsuario: uTarget.nome,
      emailUsuario: uTarget.email,
      dataHora: new Date().toLocaleString('pt-BR'),
      tipoEvento: 'PLANO_ATIVADO',
      dispositivoInfo: 'Admin Console',
      mensagemDetalhe: 'Acesso definitivo ativado pelo Administrador Master (Adesão R$ 300 + R$ 30/mês).',
      status: 'Sucesso'
    });
  }

  return atualizados;
};

export const prorrogarTesteCliente = (usuarioId: string, diasAdicionais: number = 7): UsuarioSistema[] => {
  const usuarios = getUsuariosCadastrados();
  const atualizados = usuarios.map((u) => {
    if (u.id === usuarioId) {
      const dataHoje = new Date();
      const novaExpira = new Date(dataHoje.getTime() + diasAdicionais * 24 * 60 * 60 * 1000);
      return {
        ...u,
        status: 'Ativo' as const,
        statusPlano: 'teste' as const,
        dataExpiraTeste: novaExpira.toISOString().split('T')[0]
      };
    }
    return u;
  });
  localStorage.setItem(STORAGE_USUARIOS, JSON.stringify(atualizados));

  const uTarget = atualizados.find((u) => u.id === usuarioId);
  if (uTarget) {
    registrarLogAuditoria({
      usuarioId: uTarget.id,
      nomeUsuario: uTarget.nome,
      emailUsuario: uTarget.email,
      dataHora: new Date().toLocaleString('pt-BR'),
      tipoEvento: 'TESTE_PRORROGADO',
      dispositivoInfo: 'Admin Console',
      mensagemDetalhe: `Período de teste grátis prorrogado por mais ${diasAdicionais} dias. Nova expiração: ${uTarget.dataExpiraTeste}.`,
      status: 'Sucesso'
    });
  }

  return atualizados;
};

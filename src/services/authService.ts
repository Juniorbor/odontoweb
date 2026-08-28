import { getItemJSON } from './cloudSync';

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
}

export interface LogAuditoriaAcesso {
  id: string;
  usuarioId: string;
  nomeUsuario: string;
  emailUsuario: string;
  dataHora: string;
  tipoEvento: 'LOGIN_SUCESSO' | 'LOGIN_FALHA' | 'CONTA_CRIADA' | 'ERRO_SISTEMA' | 'ALTERACAO_SENHA';
  dispositivoInfo: string;
  mensagemDetalhe: string;
  status: 'Sucesso' | 'Alerta' | 'Erro';
}

const STORAGE_USUARIOS = 'odonto_usuarios_sistema_v1';
const STORAGE_LOGS = 'odonto_logs_auditoria_acesso_v1';

export const ADMIN_PADRAO: UsuarioSistema = {
  id: 'usr-admin-master',
  nome: 'Crenilto Junior',
  email: 'juniorbor1986@gmail.com',
  senhaHash: 'bitoninha1234',
  funcao: 'Administrador / Cirurgião-Dentista',
  cro: 'CRO-RO 147369',
  role: 'admin',
  dataCriacao: '2026-01-01',
  ultimoAcesso: new Date().toISOString(),
  totalAcessos: 154,
  dispositivo: 'Windows / Chrome',
  status: 'Ativo'
};

export const getUsuariosCadastrados = (): UsuarioSistema[] => {
  const usuarios = getItemJSON<UsuarioSistema[]>(STORAGE_USUARIOS, []);
  if (usuarios.length === 0) {
    const listaInicial = [ADMIN_PADRAO];
    localStorage.setItem(STORAGE_USUARIOS, JSON.stringify(listaInicial));
    return listaInicial;
  }
  // Garantir que o Admin padrão sempre existe com as credenciais corretas
  const indexAdmin = usuarios.findIndex((u: UsuarioSistema) => u.email.toLowerCase() === ADMIN_PADRAO.email.toLowerCase());
  if (indexAdmin === -1) {
    usuarios.unshift(ADMIN_PADRAO);
    localStorage.setItem(STORAGE_USUARIOS, JSON.stringify(usuarios));
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
  const listaAtualizada = [novoLog, ...logs].slice(0, 100); // Mantém os últimos 100 registros
  localStorage.setItem(STORAGE_LOGS, JSON.stringify(listaAtualizada));
};

export const registrarNovoUsuario = (dados: {
  nome: string;
  email: string;
  senha: string;
}): { sucesso: boolean; mensagem: string; usuario?: UsuarioSistema } => {
  const usuarios = getUsuariosCadastrados();
  const emailFormatado = dados.email.trim().toLowerCase();

  if (usuarios.some(u => u.email.toLowerCase() === emailFormatado)) {
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

  const novoUsuario: UsuarioSistema = {
    id: `usr-cli-${Date.now()}`,
    nome: dados.nome,
    email: emailFormatado,
    senhaHash: dados.senha,
    funcao: 'Cliente / Finanças Pessoais',
    role: 'cliente',
    dataCriacao: new Date().toLocaleDateString('pt-BR'),
    ultimoAcesso: new Date().toLocaleString('pt-BR'),
    totalAcessos: 1,
    dispositivo: `${navigator.platform || 'Desktop'} / Browser`,
    status: 'Ativo'
  };

  const listaAtualizada = [...usuarios, novoUsuario];
  localStorage.setItem(STORAGE_USUARIOS, JSON.stringify(listaAtualizada));

  registrarLogAuditoria({
    usuarioId: novoUsuario.id,
    nomeUsuario: novoUsuario.nome,
    emailUsuario: novoUsuario.email,
    dataHora: new Date().toLocaleString('pt-BR'),
    tipoEvento: 'CONTA_CRIADA',
    dispositivoInfo: novoUsuario.dispositivo || 'Dispositivo Móvel/Web',
    mensagemDetalhe: 'Novo cliente cadastrado com sucesso. Painel pessoal inicializado.',
    status: 'Sucesso'
  });

  return { sucesso: true, mensagem: 'Conta criada com sucesso!', usuario: novoUsuario };
};

export const autenticarUsuario = (email: string, senha: string): {
  sucesso: boolean;
  mensagem: string;
  usuario?: UsuarioSistema;
} => {
  const usuarios = getUsuariosCadastrados();
  const emailFormatado = email.trim().toLowerCase();
  const usuario = usuarios.find(u => u.email.toLowerCase() === emailFormatado);

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
    mensagemDetalhe: `Sessão iniciada com sucesso. Acessos acumulados: ${usuario.totalAcessos}.`,
    status: 'Sucesso'
  });

  return { sucesso: true, mensagem: 'Autenticado com sucesso!', usuario };
};

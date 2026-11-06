// Serviço de Sincronização em Nuvem em Tempo Real com Presença de Usuários Online

const getCloudEndpoint = () => {
  if (typeof window !== 'undefined') {
    if (window.location.hostname.includes('vercel.app')) {
      return '/api/sync';
    }
    if (window.location.hostname.includes('netlify.app')) {
      return '/.netlify/functions/sync';
    }
  }
  return '/api/sync';
};

export interface UsuarioOnlineInfo {
  usuarioId: string;
  nome: string;
  email: string;
  role: string;
  timestamp: number;
}

export interface CloudDataPayload {
  usuarioId?: string;
  producao?: any[];
  fechamentos?: any[];
  financeiro?: any[];
  pacientes?: any[];
  consultas?: any[];
  fotografias?: any[];
  saldoContaPessoal?: number;
  bancoNomePessoal?: string;
  onlineUsers?: UsuarioOnlineInfo[];
  updatedAt?: number;
  updatedBy?: string;
  resetAllValues?: boolean;
}

let isSyncing = false;
const broadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('odontoweb_realtime_channel')
  : null;

// Chaves do localStorage por Usuário (Isolamento Estrito)
export const KEYS = {
  PRODUCAO: 'odonto_producao_registros_v2',
  FECHAMENTOS: 'odonto_fechamentos_producao_v1',
  FINANCEIRO: 'odonto_financeiro_pessoal_v1',
  SALDO_CONTA_PESSOAL: 'odonto_saldo_conta_pessoal_v1',
  PACIENTES: 'odonto_pacientes_v1',
  CONSULTAS: 'odonto_consultas_v1',
  FOTOGRAFIAS: 'odonto_fotografias_v1',
  LAST_UPDATE: 'odonto_last_sync_timestamp'
};

export function getUserKeys(usuarioId?: string) {
  const uid = usuarioId || 'usr-admin-master';
  return {
    PRODUCAO: uid === 'usr-admin-master' ? 'odonto_producao_registros_usr_admin_master' : `odonto_producao_registros_${uid}`,
    FECHAMENTOS: uid === 'usr-admin-master' ? 'odonto_fechamentos_producao_usr_admin_master' : `odonto_fechamentos_producao_${uid}`,
    FINANCEIRO: uid === 'usr-admin-master' ? 'odonto_financeiro_pessoal_usr_admin_master' : `odonto_financeiro_pessoal_${uid}`,
    SALDO_CONTA_PESSOAL: uid === 'usr-admin-master' ? 'odonto_saldo_conta_pessoal_usr_admin_master' : `odonto_saldo_conta_pessoal_${uid}`,
    LAST_UPDATE: `odonto_last_sync_timestamp_${uid}`
  };
}

/**
 * Converte os lançamentos de faturamento da Produção em Entradas Financeiras Consolidadas
 */
export function getProducaoComoTransacoes(usuarioId?: string): any[] {
  const keys = getUserKeys(usuarioId);
  const raw = localStorage.getItem(keys.PRODUCAO);
  if (!raw) return [];
  try {
    const itensProducao = JSON.parse(raw);
    if (!Array.isArray(itensProducao)) return [];

    return itensProducao.map((item: any, idx: number) => ({
      id: `prod-entrada-${item.id || idx}`,
      descricao: `Faturamento Produção: ${item.pacienteNome || item.paciente || 'Paciente'} - ${item.regiao || item.procedimento || 'Procedimento'} (${item.unidade || item.clinica || 'Unidade'})`,
      valor: Number(item.valor || 0),
      data: item.data || new Date().toISOString().split('T')[0],
      categoria: 'Faturamento de Produção',
      tipo: 'Entrada' as const,
      status: 'Pago' as const,
      origemProducao: true
    }));
  } catch {
    return [];
  }
}

/**
 * Executa a limpeza 100% de todos os valores adicionados (localStorage + Nuvem) para iniciar novo ciclo com alta performance
 */
export function ensureCleanSlateV10(usuarioId?: string) {
  const RESET_TAG = 'odonto_clean_slate_all_zero_v10';
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(RESET_TAG) === 'true') return;

  localStorage.setItem(RESET_TAG, 'true');
  const keys = getUserKeys(usuarioId);
  const emptyStr = JSON.stringify([]);

  // Zera Produção Ativa
  localStorage.setItem(keys.PRODUCAO, emptyStr);
  localStorage.setItem('odonto_producao_backup_permanent', emptyStr);
  localStorage.setItem('odonto_producao_registros_usr_admin_master', emptyStr);
  localStorage.setItem('odonto_producao_registros_v2', emptyStr);
  localStorage.setItem('odonto_producao_registros', emptyStr);

  // Zera Lançamentos Financeiros (Entradas e Despesas)
  localStorage.setItem(keys.FINANCEIRO, emptyStr);
  localStorage.setItem('odonto_financeiro_backup_permanent', emptyStr);
  localStorage.setItem('odonto_financeiro_pessoal_usr_admin_master', emptyStr);
  localStorage.setItem('odonto_financeiro_pessoal_v1', emptyStr);
  localStorage.setItem('odonto_financeiro_pessoal', emptyStr);

  // Zera Saldo em Conta Pessoal
  localStorage.setItem(keys.SALDO_CONTA_PESSOAL, '0');
  localStorage.setItem('odonto_saldo_conta_pessoal_v1', '0');
  localStorage.setItem('odonto_saldo_conta_pessoal_usr_admin_master', '0');

  // Zera Agenda, Pacientes, Consultas e Metas
  localStorage.setItem(`odonto_agenda_compromissos_${usuarioId || 'usr-admin-master'}`, emptyStr);
  localStorage.setItem(KEYS.PACIENTES, emptyStr);
  localStorage.setItem(KEYS.CONSULTAS, emptyStr);
  localStorage.setItem(KEYS.FOTOGRAFIAS, emptyStr);

  const nowTs = Date.now();
  localStorage.setItem(keys.LAST_UPDATE, nowTs.toString());

  // Envia ordem de limpeza para a nuvem também
  fetch(getCloudEndpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      usuarioId: usuarioId || 'usr-admin-master',
      resetAllValues: true,
      producao: [],
      financeiro: [],
      pacientes: [],
      consultas: [],
      fotografias: [],
      saldoContaPessoal: 0,
      updatedAt: nowTs
    })
  }).catch(() => {});
}

/**
 * Envia as alterações para o localStorage local e para a nuvem isoladas por Usuário + Heartbeat de Presença
 */
export async function pushToCloud(
  data: Partial<CloudDataPayload>,
  usuarioId?: string,
  usuarioLogadoInfo?: { nome: string; email: string; role: string }
): Promise<boolean> {
  try {
    const timestamp = Date.now();
    const keys = getUserKeys(usuarioId);

    // Salva imediatamente em localStorage local (inclusive quando o array for vazio [] após zerar/fechar)
    if (Array.isArray(data.producao)) {
      const str = JSON.stringify(data.producao);
      localStorage.setItem(keys.PRODUCAO, str);
      localStorage.setItem('odonto_producao_backup_permanent', str);
      localStorage.setItem('odonto_producao_registros_usr_admin_master', str);
      localStorage.setItem('odonto_producao_registros_v2', str);
      localStorage.setItem('odonto_producao_registros', str);
    }

    if (Array.isArray(data.fechamentos)) {
      localStorage.setItem(keys.FECHAMENTOS, JSON.stringify(data.fechamentos));
    }

    if (Array.isArray(data.financeiro)) {
      const str = JSON.stringify(data.financeiro);
      localStorage.setItem(keys.FINANCEIRO, str);
      localStorage.setItem('odonto_financeiro_backup_permanent', str);
      localStorage.setItem('odonto_financeiro_pessoal_usr_admin_master', str);
      localStorage.setItem('odonto_financeiro_pessoal_v1', str);
      localStorage.setItem('odonto_financeiro_pessoal', str);
    }

    if (typeof data.saldoContaPessoal === 'number') {
      localStorage.setItem(keys.SALDO_CONTA_PESSOAL, String(data.saldoContaPessoal));
    }

    if (Array.isArray(data.pacientes)) {
      localStorage.setItem(KEYS.PACIENTES, JSON.stringify(data.pacientes));
    }
    if (Array.isArray(data.consultas)) {
      localStorage.setItem(KEYS.CONSULTAS, JSON.stringify(data.consultas));
    }
    if (Array.isArray(data.fotografias)) {
      localStorage.setItem(KEYS.FOTOGRAFIAS, JSON.stringify(data.fotografias));
    }

    localStorage.setItem(keys.LAST_UPDATE, timestamp.toString());

    const payload: CloudDataPayload & { heartbeat?: any } = {
      usuarioId: usuarioId || 'usr-admin-master',
      producao: data.producao !== undefined ? data.producao : getItemJSON(keys.PRODUCAO, []),
      fechamentos: data.fechamentos !== undefined ? data.fechamentos : getItemJSON(keys.FECHAMENTOS, []),
      financeiro: data.financeiro !== undefined ? data.financeiro : getItemJSON(keys.FINANCEIRO, []),
      pacientes: data.pacientes !== undefined ? data.pacientes : getItemJSON(KEYS.PACIENTES, []),
      consultas: data.consultas !== undefined ? data.consultas : getItemJSON(KEYS.CONSULTAS, []),
      fotografias: data.fotografias !== undefined ? data.fotografias : getItemJSON(KEYS.FOTOGRAFIAS, []),
      saldoContaPessoal: data.saldoContaPessoal !== undefined ? data.saldoContaPessoal : Number(localStorage.getItem(keys.SALDO_CONTA_PESSOAL) || '0'),
      updatedAt: timestamp,
      updatedBy: typeof window !== 'undefined' && window.innerWidth < 768 ? 'Celular (Android/iOS)' : 'Notebook/PC'
    };

    if (usuarioLogadoInfo && usuarioId) {
      payload.heartbeat = {
        usuarioId,
        nome: usuarioLogadoInfo.nome,
        email: usuarioLogadoInfo.email,
        role: usuarioLogadoInfo.role,
        timestamp: Date.now()
      };
    }

    // Notifica abas e componentes na mesma janela instantaneamente
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'SYNC_UPDATE', payload });
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('odonto_local_sync', { detail: payload }));
    }

    const res = await fetch(getCloudEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const json = await res.json();
      if (json.data && json.data.onlineUsers && data) {
        data.onlineUsers = json.data.onlineUsers;
      }
      return true;
    }
  } catch (error) {
    console.warn('Dados salvos localmente no repositório do usuário:', error);
  }
  return false;
}

/**
 * Baixa as atualizações da nuvem com presenças online em tempo real
 */
export async function pullFromCloud(
  onUpdate: (payload: CloudDataPayload) => void,
  _force: boolean = false,
  usuarioId?: string,
  usuarioLogadoInfo?: { nome: string; email: string; role: string }
): Promise<boolean> {
  if (isSyncing) return false;
  isSyncing = true;
  const keys = getUserKeys(usuarioId);

  const localProducao = getItemJSON(keys.PRODUCAO, []);
  const localFinanceiro = getItemJSON(keys.FINANCEIRO, []);

  try {
    let url = `${getCloudEndpoint()}?usuarioId=${encodeURIComponent(usuarioId || 'usr-admin-master')}`;
    if (usuarioLogadoInfo && usuarioId) {
      url += `&hbUsuarioId=${encodeURIComponent(usuarioId)}&hbNome=${encodeURIComponent(usuarioLogadoInfo.nome)}&hbEmail=${encodeURIComponent(usuarioLogadoInfo.email)}&hbRole=${encodeURIComponent(usuarioLogadoInfo.role)}`;
    }

    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!res.ok) {
      onUpdate({
        producao: localProducao,
        financeiro: localFinanceiro,
        onlineUsers: []
      });
      isSyncing = false;
      return false;
    }

    const result = await res.json();
    const cloudData: CloudDataPayload = result.data || {};

    const remoteTimestamp = cloudData.updatedAt || 0;
    const localTimestamp = Number(localStorage.getItem(keys.LAST_UPDATE) || '0');

    // Se a nuvem estiver com timestamp zerado (cold start da serverless) e o dispositivo local tiver registros, envia os dados locais para a nuvem
    if (remoteTimestamp === 0 && (localProducao.length > 0 || localFinanceiro.length > 0)) {
      pushToCloud({
        producao: localProducao,
        financeiro: localFinanceiro,
        pacientes: getItemJSON(KEYS.PACIENTES, []),
        consultas: getItemJSON(KEYS.CONSULTAS, []),
        fotografias: getItemJSON(KEYS.FOTOGRAFIAS, [])
      }, usuarioId, usuarioLogadoInfo);

      onUpdate({
        ...cloudData,
        producao: localProducao,
        financeiro: localFinanceiro
      });
      isSyncing = false;
      return true;
    }

    // Se o timestamp remoto for mais recente que o local, adota integralmente os dados atualizados da nuvem (incluindo exclusões/zeragens)
    if (remoteTimestamp > localTimestamp) {
      if (Array.isArray(cloudData.producao)) {
        const str = JSON.stringify(cloudData.producao);
        localStorage.setItem(keys.PRODUCAO, str);
        localStorage.setItem('odonto_producao_backup_permanent', str);
        localStorage.setItem('odonto_producao_registros_usr_admin_master', str);
        localStorage.setItem('odonto_producao_registros_v2', str);
        localStorage.setItem('odonto_producao_registros', str);
      }
      if (Array.isArray(cloudData.financeiro)) {
        const str = JSON.stringify(cloudData.financeiro);
        localStorage.setItem(keys.FINANCEIRO, str);
        localStorage.setItem('odonto_financeiro_backup_permanent', str);
        localStorage.setItem('odonto_financeiro_pessoal_usr_admin_master', str);
        localStorage.setItem('odonto_financeiro_pessoal_v1', str);
        localStorage.setItem('odonto_financeiro_pessoal', str);
      }
      if (typeof cloudData.saldoContaPessoal === 'number') {
        localStorage.setItem(keys.SALDO_CONTA_PESSOAL, String(cloudData.saldoContaPessoal));
      }
      localStorage.setItem(keys.LAST_UPDATE, remoteTimestamp.toString());
      onUpdate(cloudData);
    } else {
      // Preserva os dados locais seguros e mistura os usuarios online
      onUpdate({
        ...cloudData,
        producao: localProducao,
        financeiro: localFinanceiro
      });
    }

    isSyncing = false;
    return true;
  } catch (e) {
    onUpdate({
      producao: localProducao,
      financeiro: localFinanceiro,
      onlineUsers: []
    });
  }

  isSyncing = false;
  return false;
}

export function subscribeLocalBroadcast(onUpdate: (payload: CloudDataPayload) => void, usuarioId?: string) {
  const handleCustomEvent = (event: Event) => {
    const customEv = event as CustomEvent<CloudDataPayload>;
    if (customEv.detail) {
      const payload = customEv.detail;
      if (!usuarioId || !payload.usuarioId || payload.usuarioId === usuarioId) {
        onUpdate(payload);
      }
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('odonto_local_sync', handleCustomEvent);
  }

  if (!broadcastChannel) {
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('odonto_local_sync', handleCustomEvent);
      }
    };
  }

  const handleMessage = (event: MessageEvent) => {
    if (event.data && event.data.type === 'SYNC_UPDATE') {
      const payload = event.data.payload as CloudDataPayload;
      if (!usuarioId || !payload.usuarioId || payload.usuarioId === usuarioId) {
        onUpdate(payload);
      }
    }
  };

  broadcastChannel.addEventListener('message', handleMessage);
  return () => {
    broadcastChannel.removeEventListener('message', handleMessage);
    if (typeof window !== 'undefined') {
      window.removeEventListener('odonto_local_sync', handleCustomEvent);
    }
  };
}

export function getItemJSON<T = any>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null || item === undefined) return fallback;
    const parsed = JSON.parse(item);
    if (parsed === null || parsed === undefined) return fallback;
    return parsed;
  } catch {
    return fallback;
  }
}

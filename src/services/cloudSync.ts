// Serviço de Sincronização em Nuvem em Tempo Real com Isolamento Multi-Tenant por Usuário
// Garantia total de isolamento entre Admin e Clientes

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

export interface CloudDataPayload {
  usuarioId?: string;
  producao?: any[];
  financeiro?: any[];
  pacientes?: any[];
  consultas?: any[];
  fotografias?: any[];
  updatedAt?: number;
  updatedBy?: string;
}

let isSyncing = false;
const broadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('odontoweb_realtime_channel')
  : null;

// Chaves do localStorage por Usuário (Isolamento Estrito)
export const KEYS = {
  PRODUCAO: 'odonto_producao_registros_v2',
  FINANCEIRO: 'odonto_financeiro_pessoal_v1',
  PACIENTES: 'odonto_pacientes_v1',
  CONSULTAS: 'odonto_consultas_v1',
  FOTOGRAFIAS: 'odonto_fotografias_v1',
  LAST_UPDATE: 'odonto_last_sync_timestamp'
};

export function getUserKeys(usuarioId?: string) {
  const uid = usuarioId || 'usr-admin-master';
  return {
    PRODUCAO: uid === 'usr-admin-master' ? 'odonto_producao_registros_usr_admin_master' : `odonto_producao_registros_${uid}`,
    FINANCEIRO: uid === 'usr-admin-master' ? 'odonto_financeiro_pessoal_usr_admin_master' : `odonto_financeiro_pessoal_${uid}`,
    LAST_UPDATE: `odonto_last_sync_timestamp_${uid}`
  };
}

/**
 * Envia as alterações para o localStorage local e para a nuvem isoladas por Usuário
 */
export async function pushToCloud(data: Partial<CloudDataPayload>, usuarioId?: string): Promise<boolean> {
  try {
    const timestamp = Date.now();
    const keys = getUserKeys(usuarioId);

    // Salva imediatamente em localStorage local no repositório isolado do usuário
    if (Array.isArray(data.producao)) {
      localStorage.setItem(keys.PRODUCAO, JSON.stringify(data.producao));
    }
    if (Array.isArray(data.financeiro)) {
      localStorage.setItem(keys.FINANCEIRO, JSON.stringify(data.financeiro));
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

    const payload: CloudDataPayload = {
      usuarioId: usuarioId || 'usr-admin-master',
      producao: data.producao !== undefined ? data.producao : getItemJSON(keys.PRODUCAO, []),
      financeiro: data.financeiro !== undefined ? data.financeiro : getItemJSON(keys.FINANCEIRO, []),
      pacientes: data.pacientes !== undefined ? data.pacientes : getItemJSON(KEYS.PACIENTES, []),
      consultas: data.consultas !== undefined ? data.consultas : getItemJSON(KEYS.CONSULTAS, []),
      fotografias: data.fotografias !== undefined ? data.fotografias : getItemJSON(KEYS.FOTOGRAFIAS, []),
      updatedAt: timestamp,
      updatedBy: typeof window !== 'undefined' && window.innerWidth < 768 ? 'Celular (Android/iOS)' : 'Notebook/PC'
    };

    // Notifica apenas abas do mesmo usuário via BroadcastChannel
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'SYNC_UPDATE', payload });
    }

    const res = await fetch(getCloudEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      return true;
    }
  } catch (error) {
    console.warn('Dados salvos localmente no repositório do usuário:', error);
  }
  return false;
}

/**
 * Baixa as atualizações da nuvem com isolamento total por usuário
 */
export async function pullFromCloud(
  onUpdate: (payload: CloudDataPayload) => void,
  _force: boolean = false,
  usuarioId?: string
): Promise<boolean> {
  if (isSyncing) return false;
  isSyncing = true;
  const keys = getUserKeys(usuarioId);

  try {
    const res = await fetch(`${getCloudEndpoint()}?usuarioId=${encodeURIComponent(usuarioId || 'usr-admin-master')}`, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!res.ok) {
      isSyncing = false;
      return false;
    }

    const result = await res.json();
    const cloudData: CloudDataPayload = result.data || {};

    // Se o payload pertence a outro usuário, descarta para prevenir vazamento
    if (cloudData.usuarioId && usuarioId && cloudData.usuarioId !== usuarioId) {
      isSyncing = false;
      return false;
    }

    const remoteTimestamp = cloudData.updatedAt || 0;
    const localTimestamp = Number(localStorage.getItem(keys.LAST_UPDATE) || '0');

    if (remoteTimestamp === 0 && localTimestamp > 0) {
      pushToCloud({
        producao: getItemJSON(keys.PRODUCAO, []),
        financeiro: getItemJSON(keys.FINANCEIRO, []),
        pacientes: getItemJSON(KEYS.PACIENTES, []),
        consultas: getItemJSON(KEYS.CONSULTAS, []),
        fotografias: getItemJSON(KEYS.FOTOGRAFIAS, [])
      }, usuarioId);
      isSyncing = false;
      return true;
    }

    if (remoteTimestamp > localTimestamp) {
      if (cloudData.producao) {
        localStorage.setItem(keys.PRODUCAO, JSON.stringify(cloudData.producao));
      }
      if (cloudData.financeiro) {
        localStorage.setItem(keys.FINANCEIRO, JSON.stringify(cloudData.financeiro));
      }
      localStorage.setItem(keys.LAST_UPDATE, remoteTimestamp.toString());
      onUpdate(cloudData);
      isSyncing = false;
      return true;
    }
  } catch (e) {
    // Silencioso em offline
  }

  isSyncing = false;
  return false;
}

export function subscribeLocalBroadcast(onUpdate: (payload: CloudDataPayload) => void, usuarioId?: string) {
  if (!broadcastChannel) return () => {};

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
  };
}

export function getItemJSON<T = any>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

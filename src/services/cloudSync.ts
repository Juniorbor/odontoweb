// Serviço de Sincronização em Nuvem em Tempo Real para OdontoWeb
// Garante persistência permanente de dados localmente e sincronização com a nuvem sem perdas

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

// Chaves do localStorage
export const KEYS = {
  PRODUCAO: 'odonto_producao_registros_v2',
  FINANCEIRO: 'odonto_financeiro_pessoal_v1',
  PACIENTES: 'odonto_pacientes_v1',
  CONSULTAS: 'odonto_consultas_v1',
  FOTOGRAFIAS: 'odonto_fotografias_v1',
  LAST_UPDATE: 'odonto_last_sync_timestamp'
};

/**
 * Envia as alterações para o localStorage local e para a nuvem
 */
export async function pushToCloud(data: Partial<CloudDataPayload>): Promise<boolean> {
  try {
    const timestamp = Date.now();

    // Salva imediatamente em localStorage local
    if (Array.isArray(data.producao)) {
      localStorage.setItem(KEYS.PRODUCAO, JSON.stringify(data.producao));
    }
    if (Array.isArray(data.financeiro)) {
      localStorage.setItem(KEYS.FINANCEIRO, JSON.stringify(data.financeiro));
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

    localStorage.setItem(KEYS.LAST_UPDATE, timestamp.toString());

    const payload: CloudDataPayload = {
      producao: data.producao !== undefined ? data.producao : getItemJSON(KEYS.PRODUCAO, []),
      financeiro: data.financeiro !== undefined ? data.financeiro : getItemJSON(KEYS.FINANCEIRO, []),
      pacientes: data.pacientes !== undefined ? data.pacientes : getItemJSON(KEYS.PACIENTES, []),
      consultas: data.consultas !== undefined ? data.consultas : getItemJSON(KEYS.CONSULTAS, []),
      fotografias: data.fotografias !== undefined ? data.fotografias : getItemJSON(KEYS.FOTOGRAFIAS, []),
      updatedAt: timestamp,
      updatedBy: typeof window !== 'undefined' && window.innerWidth < 768 ? 'Celular (Android/iOS)' : 'Notebook/PC'
    };

    // Notifica abas locais via BroadcastChannel
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'SYNC_UPDATE', payload });
    }

    const res = await fetch(getCloudEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      console.log('✅ Alterações salvas no dispositivo e sincronizadas na nuvem!');
      return true;
    }
  } catch (error) {
    console.warn('Dados salvos no dispositivo local (serviço em nuvem aguardando conexão):', error);
  }
  return false;
}

/**
 * Baixa as atualizações da nuvem com proteção total contra sobregravação de dados locais
 */
export async function pullFromCloud(
  onUpdate: (payload: CloudDataPayload) => void,
  _force: boolean = false
): Promise<boolean> {
  if (isSyncing) return false;
  isSyncing = true;

  try {
    const res = await fetch(getCloudEndpoint(), {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!res.ok) {
      isSyncing = false;
      return false;
    }

    const result = await res.json();
    const cloudData: CloudDataPayload = result.data || {};
    const remoteTimestamp = cloudData.updatedAt || 0;
    const localTimestamp = Number(localStorage.getItem(KEYS.LAST_UPDATE) || '0');

    // PROTEÇÃO CRÍTICA: Se a nuvem estiver vazia (remoteTimestamp === 0) e houver dados locais, empurra os dados locais para a nuvem!
    if (remoteTimestamp === 0 && localTimestamp > 0) {
      console.log('📤 Inicializando dados na nuvem a partir do dispositivo local...');
      pushToCloud({
        producao: getItemJSON(KEYS.PRODUCAO, []),
        financeiro: getItemJSON(KEYS.FINANCEIRO, []),
        pacientes: getItemJSON(KEYS.PACIENTES, []),
        consultas: getItemJSON(KEYS.CONSULTAS, []),
        fotografias: getItemJSON(KEYS.FOTOGRAFIAS, [])
      });
      isSyncing = false;
      return true;
    }

    // Apenas atualiza o estado local se o payload da nuvem for ESTRITAMENTE MAIS RECENTE que o local
    if (remoteTimestamp > localTimestamp) {
      console.log(`⚡ Atualizando dispositivo com dados mais recentes da nuvem (${cloudData.updatedBy || 'Remoto'}):`, cloudData);
      
      let mudou = false;
      const updatePayload: CloudDataPayload = {};

      if (Array.isArray(cloudData.producao) && cloudData.producao.length > 0) {
        localStorage.setItem(KEYS.PRODUCAO, JSON.stringify(cloudData.producao));
        updatePayload.producao = cloudData.producao;
        mudou = true;
      }
      if (Array.isArray(cloudData.financeiro) && cloudData.financeiro.length > 0) {
        localStorage.setItem(KEYS.FINANCEIRO, JSON.stringify(cloudData.financeiro));
        updatePayload.financeiro = cloudData.financeiro;
        mudou = true;
      }
      if (Array.isArray(cloudData.pacientes) && cloudData.pacientes.length > 0) {
        localStorage.setItem(KEYS.PACIENTES, JSON.stringify(cloudData.pacientes));
        updatePayload.pacientes = cloudData.pacientes;
        mudou = true;
      }
      if (Array.isArray(cloudData.consultas) && cloudData.consultas.length > 0) {
        localStorage.setItem(KEYS.CONSULTAS, JSON.stringify(cloudData.consultas));
        updatePayload.consultas = cloudData.consultas;
        mudou = true;
      }
      if (Array.isArray(cloudData.fotografias) && cloudData.fotografias.length > 0) {
        localStorage.setItem(KEYS.FOTOGRAFIAS, JSON.stringify(cloudData.fotografias));
        updatePayload.fotografias = cloudData.fotografias;
        mudou = true;
      }

      if (mudou) {
        localStorage.setItem(KEYS.LAST_UPDATE, remoteTimestamp.toString());
        onUpdate(updatePayload);
      }
      
      isSyncing = false;
      return true;
    }
  } catch (error) {
    // Falha silenciosa
  }

  isSyncing = false;
  return false;
}

/**
 * Assina atualizações locais em tempo real entre abas no mesmo computador
 */
export function subscribeLocalBroadcast(onUpdate: (payload: CloudDataPayload) => void) {
  if (!broadcastChannel) return () => {};

  const handleMessage = (event: MessageEvent) => {
    if (event.data && event.data.type === 'SYNC_UPDATE') {
      onUpdate(event.data.payload);
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

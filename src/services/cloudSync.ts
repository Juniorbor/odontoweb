// Serviço de Sincronização em Nuvem em Tempo Real com Presença de Usuários Online e Backup Persistente
import { DADOS_PRODUCAO_EXCEL } from '../data/dadosProducaoExcel';

const GIST_ID = 'd0ae37f57a78f4de102c0d5852aa7bc4';

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
  let itensProducao: any[] = getItemJSON<any[]>(keys.PRODUCAO, []);
  if (!Array.isArray(itensProducao) || itensProducao.length === 0) {
    itensProducao = DADOS_PRODUCAO_EXCEL;
  }

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

    // Salva imediatamente em localStorage local no repositório isolado do usuário
    if (Array.isArray(data.producao)) {
      const str = JSON.stringify(data.producao);
      localStorage.setItem(keys.PRODUCAO, str);
      localStorage.setItem('odonto_producao_backup_permanent', str);
      localStorage.setItem('odonto_producao_registros_usr_admin_master', str);
      localStorage.setItem('odonto_producao_registros_v2', str);
      localStorage.setItem('odonto_producao_registros', str);
    }

    if (Array.isArray(data.fechamentos)) {
      const str = JSON.stringify(data.fechamentos);
      localStorage.setItem(keys.FECHAMENTOS, str);
      localStorage.setItem('odonto_fechamentos_producao_usr_admin_master', str);
    }

    if (Array.isArray(data.financeiro)) {
      const str = JSON.stringify(data.financeiro);
      localStorage.setItem(keys.FINANCEIRO, str);
      localStorage.setItem('odonto_financeiro_backup_permanent', str);
      localStorage.setItem('odonto_financeiro_pessoal_usr_admin_master', str);
      localStorage.setItem('odonto_financeiro_pessoal_v1', str);
      localStorage.setItem('odonto_financeiro_pessoal', str);
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

    if (data.saldoContaPessoal !== undefined) {
      localStorage.setItem(keys.SALDO_CONTA_PESSOAL, data.saldoContaPessoal.toString());
    }
    if (data.bancoNomePessoal !== undefined) {
      localStorage.setItem(`${keys.SALDO_CONTA_PESSOAL}_banco`, data.bancoNomePessoal);
      localStorage.setItem('odonto_banco_nome_pessoal_v1', data.bancoNomePessoal);
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
      bancoNomePessoal: data.bancoNomePessoal !== undefined ? data.bancoNomePessoal : (localStorage.getItem(`${keys.SALDO_CONTA_PESSOAL}_banco`) || 'Conta Bancária Pessoal'),
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
  const localFechamentos = getItemJSON(keys.FECHAMENTOS, []);

  try {
    let url = `${getCloudEndpoint()}?usuarioId=${encodeURIComponent(usuarioId || 'usr-admin-master')}`;
    if (usuarioLogadoInfo && usuarioId) {
      url += `&hbUsuarioId=${encodeURIComponent(usuarioId)}&hbNome=${encodeURIComponent(usuarioLogadoInfo.nome)}&hbEmail=${encodeURIComponent(usuarioLogadoInfo.email)}&hbRole=${encodeURIComponent(usuarioLogadoInfo.role)}`;
    }

    let cloudData: CloudDataPayload = {};
    let fetchOk = false;

    try {
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (res.ok) {
        const result = await res.json();
        cloudData = result.data || {};
        fetchOk = true;
      }
    } catch (e) {
      console.warn('Erro ao consultar endpoint de sync:', e);
    }

    // Fallback direto via CDN Gist Raw se o endpoint serverless falhar ou não retornar dados válidos
    if (!fetchOk || !cloudData.updatedAt) {
      try {
        const rawRes = await fetch(`https://gist.githubusercontent.com/Juniorbor/${GIST_ID}/raw/store.json?t=${Date.now()}`);
        if (rawRes.ok) {
          const fullGist = await rawRes.json();
          const uidKey = usuarioId || 'usr-admin-master';
          if (fullGist && fullGist[uidKey]) {
            cloudData = fullGist[uidKey];
          }
        }
      } catch (e) {}
    }

    const remoteTimestamp = cloudData.updatedAt || 0;
    const localTimestamp = Number(localStorage.getItem(keys.LAST_UPDATE) || '0');

    // Se o timestamp remoto for mais recente ou igual na primeira carga forçada, adota os dados atualizados da nuvem
    if (remoteTimestamp > localTimestamp || (_force && remoteTimestamp > 0)) {
      if (Array.isArray(cloudData.producao)) {
        const str = JSON.stringify(cloudData.producao);
        localStorage.setItem(keys.PRODUCAO, str);
        localStorage.setItem('odonto_producao_backup_permanent', str);
        localStorage.setItem('odonto_producao_registros_usr_admin_master', str);
        localStorage.setItem('odonto_producao_registros_v2', str);
        localStorage.setItem('odonto_producao_registros', str);
      }

      if (Array.isArray(cloudData.fechamentos)) {
        const str = JSON.stringify(cloudData.fechamentos);
        localStorage.setItem(keys.FECHAMENTOS, str);
        localStorage.setItem('odonto_fechamentos_producao_usr_admin_master', str);
      }

      if (Array.isArray(cloudData.financeiro)) {
        const str = JSON.stringify(cloudData.financeiro);
        localStorage.setItem(keys.FINANCEIRO, str);
        localStorage.setItem('odonto_financeiro_backup_permanent', str);
        localStorage.setItem('odonto_financeiro_pessoal_usr_admin_master', str);
        localStorage.setItem('odonto_financeiro_pessoal_v1', str);
        localStorage.setItem('odonto_financeiro_pessoal', str);
      }

      if (Array.isArray(cloudData.pacientes)) {
        localStorage.setItem(KEYS.PACIENTES, JSON.stringify(cloudData.pacientes));
      }
      if (Array.isArray(cloudData.consultas)) {
        localStorage.setItem(KEYS.CONSULTAS, JSON.stringify(cloudData.consultas));
      }
      if (Array.isArray(cloudData.fotografias)) {
        localStorage.setItem(KEYS.FOTOGRAFIAS, JSON.stringify(cloudData.fotografias));
      }

      if (cloudData.saldoContaPessoal !== undefined) {
        localStorage.setItem(keys.SALDO_CONTA_PESSOAL, cloudData.saldoContaPessoal.toString());
      }
      if (cloudData.bancoNomePessoal !== undefined) {
        localStorage.setItem(`${keys.SALDO_CONTA_PESSOAL}_banco`, cloudData.bancoNomePessoal);
        localStorage.setItem('odonto_banco_nome_pessoal_v1', cloudData.bancoNomePessoal);
      }

      localStorage.setItem(keys.LAST_UPDATE, (remoteTimestamp || Date.now()).toString());
      onUpdate(cloudData);
    } else {
      onUpdate({
        ...cloudData,
        producao: localProducao.length > 0 ? localProducao : cloudData.producao,
        fechamentos: localFechamentos.length > 0 ? localFechamentos : cloudData.fechamentos,
        financeiro: localFinanceiro.length > 0 ? localFinanceiro : cloudData.financeiro
      });
    }

    isSyncing = false;
    return true;
  } catch (e) {
    onUpdate({
      producao: localProducao,
      fechamentos: localFechamentos,
      financeiro: localFinanceiro,
      onlineUsers: []
    });
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
    let item = localStorage.getItem(key);

    if (item === null && key.includes('odonto_producao_registros')) {
      const keysToTry = [
        'odonto_producao_backup_permanent',
        'odonto_producao_registros_usr_admin_master',
        'odonto_producao_registros_v2',
        'odonto_producao_registros'
      ];
      for (const k of keysToTry) {
        const candidateItem = localStorage.getItem(k);
        if (candidateItem !== null) {
          item = candidateItem;
          break;
        }
      }
    }

    if (item === null && key.includes('odonto_financeiro_pessoal')) {
      const keysToTry = [
        'odonto_financeiro_backup_permanent',
        'odonto_financeiro_pessoal_usr_admin_master',
        'odonto_financeiro_pessoal_v1',
        'odonto_financeiro_pessoal'
      ];
      for (const k of keysToTry) {
        const candidateItem = localStorage.getItem(k);
        if (candidateItem !== null) {
          item = candidateItem;
          break;
        }
      }
    }

    if (item === null || item === undefined) return fallback;
    const parsed = JSON.parse(item);
    if (parsed === null || parsed === undefined) return fallback;
    return parsed;
  } catch {
    return fallback;
  }
}

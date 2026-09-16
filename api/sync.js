// API Serverless de Sincronização em Tempo Real Multi-Dispositivo com Persistência em Nuvem (Gist Backing) e Presença Online

const GIST_ID = 'd0ae37f57a78f4de102c0d5852aa7bc4';
const GIST_TOKEN = process.env.GIST_TOKEN || Buffer.from('Z2hvX3J2VzZXTGh0Mld5dFVXb0VXc2Yya1htM0dLVWRqMFVYaG5l', 'base64').toString('ascii');

let userStores = {};
let globalPresenceMap = {};

function getUserStore(usuarioId) {
  const key = usuarioId || 'usr-admin-master';
  if (!userStores[key]) {
    userStores[key] = {
      usuarioId: key,
      producao: [],
      fechamentos: [],
      financeiro: [],
      pacientes: [],
      consultas: [],
      fotografias: [],
      saldoContaPessoal: 0,
      bancoNomePessoal: 'Conta Bancária Pessoal',
      updatedAt: 0,
      updatedBy: ''
    };
  }
  return userStores[key];
}

async function restoreFromCloudStorage(usuarioId) {
  const key = usuarioId || 'usr-admin-master';
  try {
    const rawUrl = `https://gist.githubusercontent.com/Juniorbor/${GIST_ID}/raw/store.json?t=${Date.now()}`;
    const res = await fetch(rawUrl, { headers: { 'Cache-Control': 'no-cache' } });
    if (res.ok) {
      const fullStore = await res.json();
      const cloudUserData = fullStore[key];
      if (cloudUserData && cloudUserData.updatedAt) {
        const store = getUserStore(key);
        if (cloudUserData.updatedAt > store.updatedAt) {
          if (Array.isArray(cloudUserData.producao)) store.producao = cloudUserData.producao;
          if (Array.isArray(cloudUserData.fechamentos)) store.fechamentos = cloudUserData.fechamentos;
          if (Array.isArray(cloudUserData.financeiro)) store.financeiro = cloudUserData.financeiro;
          if (Array.isArray(cloudUserData.pacientes)) store.pacientes = cloudUserData.pacientes;
          if (Array.isArray(cloudUserData.consultas)) store.consultas = cloudUserData.consultas;
          if (Array.isArray(cloudUserData.fotografias)) store.fotografias = cloudUserData.fotografias;
          if (cloudUserData.saldoContaPessoal !== undefined) store.saldoContaPessoal = cloudUserData.saldoContaPessoal;
          if (cloudUserData.bancoNomePessoal !== undefined) store.bancoNomePessoal = cloudUserData.bancoNomePessoal;
          store.updatedAt = cloudUserData.updatedAt;
          store.updatedBy = cloudUserData.updatedBy || 'Nuvem Gist';
        }
      }
    }
  } catch (e) {
    console.warn('Erro ao restaurar armazenamento em nuvem:', e);
  }
}

async function persistToCloudStorage(usuarioId, store) {
  const key = usuarioId || 'usr-admin-master';
  try {
    // Busca estado existente para mesclar outros usuários
    let fullStore = {};
    try {
      const rawUrl = `https://gist.githubusercontent.com/Juniorbor/${GIST_ID}/raw/store.json?t=${Date.now()}`;
      const res = await fetch(rawUrl, { headers: { 'Cache-Control': 'no-cache' } });
      if (res.ok) fullStore = await res.json();
    } catch (e) {}

    fullStore[key] = {
      usuarioId: key,
      producao: store.producao,
      fechamentos: store.fechamentos,
      financeiro: store.financeiro,
      pacientes: store.pacientes,
      consultas: store.consultas,
      fotografias: store.fotografias,
      saldoContaPessoal: store.saldoContaPessoal,
      bancoNomePessoal: store.bancoNomePessoal,
      updatedAt: store.updatedAt,
      updatedBy: store.updatedBy
    };

    await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `token ${GIST_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'OdontoWebApp'
      },
      body: JSON.stringify({
        files: {
          'store.json': { content: JSON.stringify(fullStore) }
        }
      })
    });
  } catch (e) {
    console.warn('Erro ao persistir na nuvem:', e);
  }
}

function updatePresence(heartbeat) {
  if (heartbeat && heartbeat.usuarioId) {
    globalPresenceMap[heartbeat.usuarioId] = {
      usuarioId: heartbeat.usuarioId,
      nome: heartbeat.nome || 'Usuário',
      email: heartbeat.email || '',
      role: heartbeat.role || 'cliente',
      timestamp: Date.now()
    };
  }
  const now = Date.now();
  Object.keys(globalPresenceMap).forEach((id) => {
    if (now - globalPresenceMap[id].timestamp > 45000) {
      delete globalPresenceMap[id];
    }
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const usuarioId = body.usuarioId || req.query?.usuarioId || 'usr-admin-master';
      const store = getUserStore(usuarioId);

      if (body.heartbeat) {
        updatePresence(body.heartbeat);
      }

      if (Array.isArray(body.producao)) store.producao = body.producao;
      if (Array.isArray(body.fechamentos)) store.fechamentos = body.fechamentos;
      if (Array.isArray(body.financeiro)) store.financeiro = body.financeiro;
      if (Array.isArray(body.pacientes)) store.pacientes = body.pacientes;
      if (Array.isArray(body.consultas)) store.consultas = body.consultas;
      if (Array.isArray(body.fotografias)) store.fotografias = body.fotografias;
      if (body.saldoContaPessoal !== undefined) store.saldoContaPessoal = body.saldoContaPessoal;
      if (body.bancoNomePessoal !== undefined) store.bancoNomePessoal = body.bancoNomePessoal;

      store.updatedAt = body.updatedAt || Date.now();
      store.updatedBy = body.updatedBy || 'Dispositivo';

      await persistToCloudStorage(usuarioId, store);

      updatePresence();
      const onlineUsers = Object.values(globalPresenceMap);

      return res.status(200).json({ success: true, data: { ...store, onlineUsers } });
    } catch (e) {
      return res.status(400).json({ success: false, error: 'Formato JSON inválido' });
    }
  }

  // GET Request
  const usuarioId = req.query?.usuarioId || 'usr-admin-master';
  const store = getUserStore(usuarioId);

  // Se a memória local da serverless estiver zerada (cold start da lambda), restaura da nuvem persistente
  if (store.updatedAt === 0) {
    await restoreFromCloudStorage(usuarioId);
  }

  if (req.query?.hbUsuarioId) {
    updatePresence({
      usuarioId: req.query.hbUsuarioId,
      nome: req.query.hbNome,
      email: req.query.hbEmail,
      role: req.query.hbRole
    });
  } else {
    updatePresence();
  }

  const onlineUsers = Object.values(globalPresenceMap);

  return res.status(200).json({ success: true, data: { ...store, onlineUsers } });
}

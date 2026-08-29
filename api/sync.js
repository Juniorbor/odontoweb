// API Serverless de Sincronização com Isolamento Multi-Tenant por Usuário + Presença de Usuários Online em Tempo Real

let userStores = {};
let globalPresenceMap = {};

function getUserStore(usuarioId) {
  const key = usuarioId || 'usr-admin-master';
  if (!userStores[key]) {
    userStores[key] = {
      usuarioId: key,
      producao: [],
      financeiro: [],
      pacientes: [],
      consultas: [],
      fotografias: [],
      updatedAt: 0,
      updatedBy: ''
    };
  }
  return userStores[key];
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
  // Limpa usuários inativos a mais de 45 segundos
  const now = Date.now();
  Object.keys(globalPresenceMap).forEach((id) => {
    if (now - globalPresenceMap[id].timestamp > 45000) {
      delete globalPresenceMap[id];
    }
  });
}

export default function handler(req, res) {
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
      if (Array.isArray(body.financeiro)) store.financeiro = body.financeiro;
      if (Array.isArray(body.pacientes)) store.pacientes = body.pacientes;
      if (Array.isArray(body.consultas)) store.consultas = body.consultas;
      if (Array.isArray(body.fotografias)) store.fotografias = body.fotografias;

      store.updatedAt = body.updatedAt || Date.now();
      store.updatedBy = body.updatedBy || 'Dispositivo';

      updatePresence();
      const onlineUsers = Object.values(globalPresenceMap);

      return res.status(200).json({ success: true, data: { ...store, onlineUsers } });
    } catch (e) {
      return res.status(400).json({ success: false, error: 'Formato JSON inválido' });
    }
  }

  // GET Request: extrai o usuarioId da query string para isolar dados do cliente e retorna usuarios online
  const usuarioId = req.query?.usuarioId || 'usr-admin-master';
  const store = getUserStore(usuarioId);

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

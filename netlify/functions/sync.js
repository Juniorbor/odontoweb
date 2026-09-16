// Netlify Serverless Function com Presença de Usuários Online em Tempo Real

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
  const now = Date.now();
  Object.keys(globalPresenceMap).forEach((id) => {
    if (now - globalPresenceMap[id].timestamp > 45000) {
      delete globalPresenceMap[id];
    }
  });
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const queryParams = event.queryStringParameters || {};
  const queryUsuarioId = queryParams.usuarioId;

  if (event.httpMethod === 'POST' || event.httpMethod === 'PUT') {
    try {
      const body = JSON.parse(event.body || '{}');
      const usuarioId = body.usuarioId || queryUsuarioId || 'usr-admin-master';
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

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, data: { ...store, onlineUsers } })
      };
    } catch (e) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Formato JSON inválido' })
      };
    }
  }

  // GET request - Retorna os dados isolados do usuário informado + onlineUsers
  const usuarioId = queryUsuarioId || 'usr-admin-master';
  const store = getUserStore(usuarioId);

  if (queryParams.hbUsuarioId) {
    updatePresence({
      usuarioId: queryParams.hbUsuarioId,
      nome: queryParams.hbNome,
      email: queryParams.hbEmail,
      role: queryParams.hbRole
    });
  } else {
    updatePresence();
  }

  const onlineUsers = Object.values(globalPresenceMap);

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true, data: { ...store, onlineUsers } })
  };
};

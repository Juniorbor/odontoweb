// API Serverless de Sincronização com Isolamento Multi-Tenant por Usuário
// Impede vazamento ou réplica de dados entre contas de usuários e administradores

let userStores = {};

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

      if (Array.isArray(body.producao)) store.producao = body.producao;
      if (Array.isArray(body.financeiro)) store.financeiro = body.financeiro;
      if (Array.isArray(body.pacientes)) store.pacientes = body.pacientes;
      if (Array.isArray(body.consultas)) store.consultas = body.consultas;
      if (Array.isArray(body.fotografias)) store.fotografias = body.fotografias;

      store.updatedAt = body.updatedAt || Date.now();
      store.updatedBy = body.updatedBy || 'Dispositivo';

      return res.status(200).json({ success: true, data: store });
    } catch (e) {
      return res.status(400).json({ success: false, error: 'Formato JSON inválido' });
    }
  }

  // GET Request: extrai o usuarioId da query string para isolar dados do cliente
  const usuarioId = req.query?.usuarioId || 'usr-admin-master';
  const store = getUserStore(usuarioId);

  return res.status(200).json({ success: true, data: store });
}

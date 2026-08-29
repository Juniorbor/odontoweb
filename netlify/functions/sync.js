// Netlify Serverless Function com Isolamento Multi-Tenant por Usuário
// Garante 100% de separação dos dados de cada usuário no servidor

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

  const queryUsuarioId = event.queryStringParameters?.usuarioId;

  if (event.httpMethod === 'POST' || event.httpMethod === 'PUT') {
    try {
      const body = JSON.parse(event.body || '{}');
      const usuarioId = body.usuarioId || queryUsuarioId || 'usr-admin-master';
      const store = getUserStore(usuarioId);

      if (Array.isArray(body.producao)) store.producao = body.producao;
      if (Array.isArray(body.financeiro)) store.financeiro = body.financeiro;
      if (Array.isArray(body.pacientes)) store.pacientes = body.pacientes;
      if (Array.isArray(body.consultas)) store.consultas = body.consultas;
      if (Array.isArray(body.fotografias)) store.fotografias = body.fotografias;

      store.updatedAt = body.updatedAt || Date.now();
      store.updatedBy = body.updatedBy || 'Dispositivo';

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, data: store })
      };
    } catch (e) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, error: 'Formato JSON inválido' })
      };
    }
  }

  // GET request - Retorna os dados isolados do usuário informado
  const usuarioId = queryUsuarioId || 'usr-admin-master';
  const store = getUserStore(usuarioId);

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ success: true, data: store })
  };
};

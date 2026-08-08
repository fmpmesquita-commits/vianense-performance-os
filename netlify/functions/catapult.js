// Netlify Function: reencaminha pedidos para a API Catapult Connect (Europa) a partir do
// servidor, para evitar o bloqueio de CORS que existe quando o browser tenta chamar
// connect-eu.catapultsports.com diretamente a partir de outro site (o nosso Netlify).
// O token nunca fica guardado aqui -- vem em cada pedido, vindo do localStorage do browser.
const CATAPULT_BASE = 'https://connect-eu.catapultsports.com/api/v6';

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Método não permitido' }) };
  }
  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'JSON inválido no pedido' }) };
  }
  const { token, path, method, body } = payload;
  if (!token) return { statusCode: 400, body: JSON.stringify({ error: 'Falta o token da Catapult' }) };
  if (!path) return { statusCode: 400, body: JSON.stringify({ error: 'Falta o path do pedido' }) };

  try {
    const res = await fetch(CATAPULT_BASE + path, {
      method: method || 'GET',
      headers: {
        Authorization: 'Bearer ' + token,
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    return {
      statusCode: res.status,
      headers: { 'Content-Type': 'application/json' },
      body: text,
    };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: 'Erro a contactar a Catapult: ' + e.message }) };
  }
};

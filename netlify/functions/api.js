// Netlify Function: jembatan API Portal Absensi Pengawas
// Validasi sesi dan hak Admin tetap dilakukan oleh Google Apps Script.

const ALLOWED_ACTIONS = new Set([
  'portal_info',
  'portal_submit',
  'portal_admin_data',
  'portal_admin_save',
  'portal_admin_reset'
]);

function jsonResponse(statusCode, data) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin'
    },
    body: JSON.stringify(data)
  };
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
        'Vary': 'Origin'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, {
      ok: false,
      error: 'Metode tidak diizinkan.'
    });
  }

  const gasUrl = process.env.GAS_WEB_APP_URL;

  if (!gasUrl) {
    return jsonResponse(500, {
      ok: false,
      error: 'GAS_WEB_APP_URL belum diatur pada Environment Variables Netlify.'
    });
  }

  let input;

  try {
    input = JSON.parse(event.body || '{}');
  } catch (_) {
    return jsonResponse(400, {
      ok: false,
      error: 'Format permintaan tidak valid.'
    });
  }

  if (!input || !ALLOWED_ACTIONS.has(input.action)) {
    return jsonResponse(400, {
      ok: false,
      error: 'Action tidak diizinkan melalui endpoint portal.'
    });
  }

  try {
    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(input),
      redirect: 'follow'
    });

    const raw = await response.text();

    let data;

    try {
      data = JSON.parse(raw);
    } catch (_) {
      return jsonResponse(502, {
        ok: false,
        error: 'Respons Apps Script bukan JSON. Periksa GAS_WEB_APP_URL dan akses Web App.'
      });
    }

    return jsonResponse(response.ok ? 200 : 502, data);

  } catch (err) {
    return jsonResponse(502, {
      ok: false,
      error: 'Gagal menghubungi Apps Script: ' +
        (err && err.message ? err.message : String(err))
    });
  }
};

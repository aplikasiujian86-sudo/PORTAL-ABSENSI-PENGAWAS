// NETLIFY FUNCTION
// JEMBATAN API PORTAL ABSENSI PENGAWAS
// Terhubung ke Google Apps Script

const ALLOWED_ACTIONS = new Set([
  'portal_teachers',
  'portal_teacher_classes',
  'portal_info',
  'portal_submit',
  'portal_teacher_submit',
  'portal_admin_data',
  'portal_admin_save',
  'portal_admin_reset'
]);

function jsonResponse(statusCode, data) {
  return {
    statusCode: statusCode,
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

  // IZINKAN PREFLIGHT REQUEST
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

  // HANYA MENERIMA POST
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, {
      ok: false,
      error: 'Metode tidak diizinkan.'
    });
  }

  // AMBIL URL GOOGLE APPS SCRIPT
  const gasUrl = process.env.GAS_WEB_APP_URL;

  if (!gasUrl) {
    return jsonResponse(500, {
      ok: false,
      error: 'GAS_WEB_APP_URL belum diatur pada Environment Variables Netlify.'
    });
  }

  // BACA DATA PERMINTAAN
  let input;

  try {
    input = JSON.parse(event.body || '{}');
  } catch (err) {
    return jsonResponse(400, {
      ok: false,
      error: 'Format permintaan tidak valid.'
    });
  }

  // PERIKSA NAMA AKSI
  if (!input || !ALLOWED_ACTIONS.has(input.action)) {
    return jsonResponse(400, {
      ok: false,
      error: 'Aksi tidak dikenal atau tidak diizinkan: ' +
        (input && input.action ? input.action : 'kosong')
    });
  }

  // KIRIM PERMINTAAN KE GOOGLE APPS SCRIPT
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
    } catch (err) {
      return jsonResponse(502, {
        ok: false,
        error: 'Respons Apps Script bukan JSON. Periksa URL dan akses Web App.'
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

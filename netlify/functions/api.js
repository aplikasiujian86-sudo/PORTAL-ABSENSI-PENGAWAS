exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'Allow': 'POST', 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: 'Metode tidak diizinkan.' }) };
  }
  const gasUrl = process.env.GAS_WEB_APP_URL;
  if (!gasUrl) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: 'GAS_WEB_APP_URL belum diatur pada Environment Variables Netlify.' }) };
  }
  let input;
  try { input = JSON.parse(event.body || '{}'); }
  catch (_) { return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: 'Format permintaan tidak valid.' }) }; }
  if (!['portal_info', 'portal_submit'].includes(input.action)) {
    return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: false, error: 'Action tidak diizinkan melalui endpoint portal.' }) };
  }
  try {
    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(input),
      redirect: 'follow'
    });
    const raw = await response.text();
    let data;
    try { data = JSON.parse(raw); }
    catch (_) { throw new Error('Respons Apps Script bukan JSON. Pastikan Web App sudah dideploy dengan akses yang sesuai.'); }
    return { statusCode: response.ok ? 200 : 502, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, body: JSON.stringify(data) };
  } catch (err) {
    return { statusCode: 502, headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify({ ok: false, error: 'Gagal menghubungi Apps Script: ' + (err.message || err) }) };
  }
};

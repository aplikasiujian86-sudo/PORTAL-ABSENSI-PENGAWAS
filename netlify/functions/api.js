const GAS_URL = process.env.GAS_WEB_APP_URL;

const ALLOWED_ACTIONS = [
  "portal_info",
  "portal_submit",
  "portal_admin_data",
  "portal_admin_save",
  "portal_admin_reset",
  "portal_teacher_classes",
  "portal_teacher_submit"
];

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json; charset=utf-8"
  };

  // Mengizinkan pemeriksaan CORS dari browser
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: ""
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        ok: false,
        error: "Metode tidak diizinkan."
      })
    };
  }

  if (!GAS_URL) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        ok: false,
        error: "GAS_WEB_APP_URL belum diatur di Netlify."
      })
    };
  }

  try {
    const body = event.isBase64Encoded
      ? Buffer.from(event.body || "", "base64").toString("utf8")
      : (event.body || "{}");

    const data = JSON.parse(body);

    if (!data.action || !ALLOWED_ACTIONS.includes(data.action)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          ok: false,
          error: "Aksi tidak dikenal atau tidak diizinkan."
        })
      };
    }

    const response = await fetch(GAS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data),
      redirect: "follow"
    });

    const resultText = await response.text();

    let result;
    try {
      result = JSON.parse(resultText);
    } catch (e) {
      result = {
        ok: false,
        error: "Respons Apps Script bukan JSON.",
        detail: resultText.substring(0, 500)
      };
    }

    return {
      statusCode: response.ok ? 200 : response.status,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        ok: false,
        error: "Gagal menghubungi server.",
        detail: error.message
      })
    };
  }
};

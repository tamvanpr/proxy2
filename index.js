export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders()
      });
    }

    const target =
      url.searchParams.get("url") ||
      url.searchParams.get("u");

    if (!target) {
      return json({
        ok: false,
        message: "Tambahkan ?url=https://example.com"
      }, 400);
    }

    let targetUrl;

    try {
      targetUrl = new URL(target);
    } catch {
      return json({
        ok: false,
        message: "URL tidak valid."
      }, 400);
    }

    if (!["http:", "https:"].includes(targetUrl.protocol)) {
      return json({
        ok: false,
        message: "Hanya mendukung http dan https."
      }, 400);
    }

    const headers = new Headers(request.headers);

    headers.delete("host");
    headers.delete("origin");
    headers.delete("referer");
    headers.delete("cf-connecting-ip");
    headers.delete("cf-ipcountry");
    headers.delete("cf-ray");
    headers.delete("cf-visitor");
    headers.delete("x-forwarded-proto");
    headers.delete("x-real-ip");

    headers.set("user-agent", headers.get("user-agent") || 
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    );

    headers.set("accept", headers.get("accept") || "*/*");
    headers.set("accept-language", headers.get("accept-language") || "en-US,en;q=0.9,id;q=0.8");

    const init = {
      method: request.method,
      headers,
      redirect: "follow"
    };

    if (!["GET", "HEAD"].includes(request.method)) {
      init.body = request.body;
    }

    try {
      const response = await fetch(targetUrl.toString(), init);

      const responseHeaders = new Headers(response.headers);

      responseHeaders.set("Access-Control-Allow-Origin", "*");
      responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD");
      responseHeaders.set("Access-Control-Allow-Headers", "*");
      responseHeaders.set("Access-Control-Expose-Headers", "*");
      responseHeaders.set("Cross-Origin-Resource-Policy", "cross-origin");

      responseHeaders.delete("content-security-policy");
      responseHeaders.delete("content-security-policy-report-only");
      responseHeaders.delete("x-frame-options");

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders
      });

    } catch (error) {
      return json({
        ok: false,
        message: "Gagal mengambil target.",
        error: error.message
      }, 502);
    }
  }
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Max-Age": "86400"
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders()
    }
  });
}

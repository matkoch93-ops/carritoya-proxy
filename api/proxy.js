const PRECIOS_CLAROS = "https://d3e6htiiul5ek9.cloudfront.net/prod";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

async function supabaseGet(tabla, filtros = "") {
  const url = `${SUPABASE_URL}/rest/v1/${tabla}?select=*${filtros}`;
  const res = await fetch(url, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
    }
  });
  return res.json();
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { action, endpoint, ...params } = req.query;

  // ── AGENTE IA (POST)
  if (req.method === "POST" && action === "ia") {
    try {
      const { prompt } = req.body;
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await r.json();
      return res.status(200).json(data);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  // ── PROMOCIONES DESDE SUPABASE
  if (action === "promociones") {
    try {
      const data = await supabaseGet("promociones", "&activa=eq.true&order=supermercado");
      res.setHeader("Cache-Control", "public, s-maxage=300");
      return res.status(200).json({ promociones: data });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── PRECIOS DESDE SUPABASE
  if (action === "precios") {
    try {
      const { supermercado, producto_id } = params;
      let filtros = "";
      if (supermercado) filtros += `&supermercado=eq.${encodeURIComponent(supermercado)}`;
      if (producto_id) filtros += `&producto_id=eq.${encodeURIComponent(producto_id)}`;
      const data = await supabaseGet("precios", filtros + "&order=precio");
      res.setHeader("Cache-Control", "public, s-maxage=180");
      return res.status(200).json({ precios: data });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // ── PRECIOS CLAROS
  if (endpoint) {
    const PERMITIDOS = ["sucursales", "productos", "producto"];
    if (!PERMITIDOS.includes(endpoint)) {
      return res.status(400).json({ error: "Endpoint inválido" });
    }
    const qs = new URLSearchParams(params).toString();
    const url = `${PRECIOS_CLAROS}/${endpoint}${qs ? `?${qs}` : ""}`;
    try {
      const r = await fetch(url, { headers: { "User-Agent": "CarritoYa/1.0" } });
      const data = await r.json();
      res.setHeader("Cache-Control", "public, s-maxage=300");
      return res.status(200).json(data);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(400).json({ error: "Parámetros inválidos" });
}

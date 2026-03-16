export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  // Endpoint IA (POST /api/proxy?action=ia)
  if (req.method === "POST" && req.query.action === "ia") {
    try {
      const { prompt } = req.body;
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
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

  // Endpoint Precios Claros (GET)
  if (req.method === "GET") {
    const { endpoint, ...params } = req.query;
    const PERMITIDOS = ["sucursales", "productos", "producto"];
    if (!endpoint || !PERMITIDOS.includes(endpoint)) {
      return res.status(400).json({ error: "Endpoint inválido" });
    }
    const qs = new URLSearchParams(params).toString();
    const url = `https://d3e6htiiul5ek9.cloudfront.net/prod/${endpoint}${qs ? `?${qs}` : ""}`;
    try {
      const r = await fetch(url, { headers: { "User-Agent": "CarritoYa/1.0" } });
      const data = await r.json();
      res.setHeader("Cache-Control", "public, s-maxage=300");
      return res.status(200).json(data);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: "Método no permitido" });
}

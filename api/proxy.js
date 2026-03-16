export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  const { endpoint, ...params } = req.query;
  const PERMITIDOS = ["sucursales", "productos", "producto"];
  if (!endpoint || !PERMITIDOS.includes(endpoint)) {
    return res.status(400).json({ error: "Endpoint invalido" });
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

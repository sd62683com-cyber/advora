module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  const u = await fetch(process.env.SUPABASE_URL + "/auth/v1/user", {
    headers: { apikey: process.env.SUPABASE_PUBLISHABLE_KEY, Authorization: "Bearer " + token }
  });
  if (!u.ok) return res.status(401).json({ error: "Connexion requise" });
  const prompt = (req.body || {}).prompt;
  if (!prompt || prompt.length > 4000) return res.status(400).json({ error: "Demande invalide" });
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-sonnet-5-5", max_tokens: 1500, messages: [{ role: "user", content: prompt }] })
  });
  if (!r.ok) return res.status(502).json({ error: "Service IA indisponible" });
  const j = await r.json();
  res.status(200).json({ text: (j.content || []).filter(b => b.type === "text").map(b => b.text).join("\n") });
};

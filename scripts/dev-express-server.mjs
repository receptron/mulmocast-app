import express from "express";

const app = express();
const host = process.env.MULMOCLAUDE_EXPRESS_HOST ?? "127.0.0.1";
const port = Number(process.env.MULMOCLAUDE_EXPRESS_PORT ?? 3001);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "mulmoclaude-express" });
});

app.get("/api/message", (_req, res) => {
  res.json({ message: "Hello from Express API" });
});

app.post("/api/echo", (req, res) => {
  res.json({ body: req.body ?? null });
});

app.listen(port, host, () => {
  console.log(`[mulmoclaude] Express server running at http://${host}:${port}`);
});

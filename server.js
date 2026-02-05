import express from "express";
import fs from "fs";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;
const LOG_DIR = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "visits.jsonl");
const GEO_API = "https://ipapi.co/json/";

app.use(express.json({ limit: "100kb" }));
app.use(express.static(process.cwd()));

app.get("/", (_req, res) => {
  res.sendFile(path.join(process.cwd(), "index.html"));
});

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  return next();
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

const safeIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress;
};

const lookupGeo = async () => {
  try {
    const response = await fetch(GEO_API, { method: "GET" });
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return {
      city: data.city,
      region: data.region,
      country: data.country_name,
    };
  } catch (error) {
    return null;
  }
};

app.post("/track", async (req, res) => {
  const geo = await lookupGeo();
  const payload = {
    time: new Date().toISOString(),
    ip: safeIp(req),
    geo,
    ...req.body,
  };

  fs.mkdirSync(LOG_DIR, { recursive: true });
  fs.appendFileSync(LOG_FILE, `${JSON.stringify(payload)}\n`, "utf8");
  res.json({ ok: true });
});

const readLogs = (limit = 200) => {
  if (!fs.existsSync(LOG_FILE)) {
    return [];
  }
  const content = fs.readFileSync(LOG_FILE, "utf8").trim();
  if (!content) return [];
  const lines = content.split("\n");
  const slice = lines.slice(Math.max(0, lines.length - limit));
  return slice
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        return null;
      }
    })
    .filter(Boolean)
    .reverse();
};

app.get("/logs", (req, res) => {
  const limit = Number.parseInt(req.query.limit, 10);
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 500) : 200;
  res.json({ ok: true, entries: readLogs(safeLimit) });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Tracker running on http://localhost:${PORT}`);
});

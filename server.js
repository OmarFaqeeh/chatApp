const path = require("path");
const http = require("http");
const express = require("express");
const { WebSocketServer } = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.static(path.join(__dirname, "public")));

function broadcast(obj) {
  const msg = JSON.stringify(obj);
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(msg);
  }
}

wss.on("connection", (ws) => {
  ws.user = { name: "مستخدم", id: Math.random().toString(16).slice(2) };

  ws.send(JSON.stringify({ type: "system", text: "تم الاتصال بالسيرفر ✅" }));
  broadcast({ type: "system", text: "مستخدم جديد دخل (اتصال جديد)" });

  ws.on("message", (data) => {
    let payload;
    try {
      payload = JSON.parse(data.toString());
    } catch {
      return;
    }

    if (payload.type === "set_name") {
      const newName = String(payload.name || "").trim().slice(0, 20);
      if (newName) {
        const old = ws.user.name;
        ws.user.name = newName;
        broadcast({ type: "system", text: `تغيير الاسم: ${old} → ${newName}` });
      }
      return;
    }

    if (payload.type === "chat") {
      const text = String(payload.text || "").trim().slice(0, 500);
      if (!text) return;

      broadcast({
        type: "chat",
        name: ws.user.name,
        text,
        ts: Date.now(),
      });
    }
  });

  ws.on("close", () => {
    broadcast({ type: "system", text: `out ${ws.user.name}` });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
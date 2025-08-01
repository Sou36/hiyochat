const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 静的ファイル（index.htmlやindex.css）を配信
app.use(express.static(path.join(__dirname, '.')));

// WebSocketの処理（例）
wss.on('connection', function connection(ws) {
  console.log('A client connected');
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
    // 受信したメッセージを全員に送信
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

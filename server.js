const WebSocket = require('ws');
const http = require('http');
const crypto = require('crypto');

// WebSocketのサーバ作成
const server = http.createServer();
const wss = new WebSocket.Server({ server });

// WebSocket接続, ws が接続したクライアント
wss.on('connection', (ws) => {
  // クライアント識別子、今回は使わない...
  const uuid = crypto.randomUUID();
  ws.send(JSON.stringify({ uuid }));

  // メッセージ受信処理
  ws.on('message', (data) => {
    const json = JSON.parse(data);
    if (!json.message) return;
    // WebSocket 接続中のクライアント対象にメッセージ送信
    wss.clients.forEach((client) => {
      // メッセージ送信先クライアントがメッセージ受信クライアントの判定を設定
      json.mine = ws === client;
      if (client.readyState === WebSocket.OPEN) {
        // メッセージを送信
        client.send(JSON.stringify(json));
      }
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});



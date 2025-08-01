const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const historyPath = path.join(__dirname, 'history.json');

// 初期化：履歴ファイルがなければ空配列で作る
if (!fs.existsSync(historyPath)) {
  fs.writeFileSync(historyPath, '[]');
}

// 履歴を読み込む関数
function loadHistory() {
  try {
    return JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
  } catch {
    return [];
  }
}

// 履歴に追加・保存
function saveMessage(msg) {
  const history = loadHistory();
  history.push(msg);
  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
}

wss.on('connection', (ws) => {
  // 接続時に履歴を送信
  const history = loadHistory();
  history.forEach(msg => ws.send(JSON.stringify(msg)));

  // UUIDを渡す
  const uuid = crypto.randomUUID();
  ws.send(JSON.stringify({ uuid }));

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());

      saveMessage(msg); // サーバーに保存
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(msg));
        }
      });
    } catch (err) {
      console.error('メッセージ処理エラー:', err);
    }
  });
});

app.use(express.static('public')); // クライアントのHTML/CSS/JSが入るフォルダ

// 動画などアップロード対応（すでに実装済みならそのまま使ってOK）
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.single('video'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'ファイルなし' });
  const videoUrl = `/uploads/${req.file.filename}`;
  res.json({ url: videoUrl });
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

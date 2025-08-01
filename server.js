const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const messagesFile = path.join(__dirname, 'messages.json');

// アップロード用ディレクトリ
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// ファイルアップロード設定
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// 静的ファイル公開
app.use(express.static('public'));
app.use('/uploads', express.static(uploadDir));

// メッセージ履歴の読み込み
function readMessages() {
  if (!fs.existsSync(messagesFile)) return [];
  const data = fs.readFileSync(messagesFile, 'utf-8');
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// メッセージ履歴の保存
function saveMessage(message) {
  const messages = readMessages();
  messages.push(message);
  fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2));
}

// 履歴取得API
app.get('/messages', (req, res) => {
  res.json(readMessages());
});

// 動画アップロードAPI
app.post('/upload', upload.single('video'), (req, res) => {
  const filePath = '/uploads/' + req.file.filename;
  res.json({ url: filePath });
});

// WebSocket
wss.on('connection', (ws) => {
  const uuid = crypto.randomUUID();
  ws.send(JSON.stringify({ uuid }));

  ws.on('message', (message) => {
    try {
      const json = JSON.parse(message);
      saveMessage(json);

      // 全クライアントに送信
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(json));
        }
      });
    } catch (err) {
      console.error('Invalid JSON', err);
    }
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

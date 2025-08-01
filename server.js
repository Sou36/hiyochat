const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); 
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const multer = require('multer');
const fs = require('fs');
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + ext;
    cb(null, name);
  }
});

const upload = multer({ storage });

// 静的ファイル（アップロードされた動画も）を公開
app.use('/uploads', express.static(uploadDir));

// アップロード処理
app.post('/upload', upload.single('video'), (req, res) => {
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});
app.use(express.static(path.join(__dirname, '.')));

wss.on('connection', function connection(ws) {
  const clientId = uuidv4(); // 各クライアントに一意のIDを割り当て
  ws.send(JSON.stringify({ uuid: clientId })); // 最初にクライアントにIDを送信

  ws.on('message', function incoming(message) {
    const json = JSON.parse(message);
    json.uuid = clientId; // 送信者のIDを付加して、みんなに配信

    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(json));
      }
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
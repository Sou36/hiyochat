const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); 
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, '.')));

wss.on('connection', function connection(ws) {
  console.log('A client connected');

  const { v4: uuidv4 } = require('uuid'); // 追加
// npm install uuid しておいてね

wss.on('connection', function connection(ws) {
  const clientId = uuidv4(); // 一人ひとりにIDを割り当て
  ws.send(JSON.stringify({ uuid: clientId }));

  ws.on('message', function incoming(message) {
    const json = JSON.parse(message);
    json.uuid = clientId; // メッセージに送信者のIDを追加して送り返す

    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(json));
      }
    });
  });
});

});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

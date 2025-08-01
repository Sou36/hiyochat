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
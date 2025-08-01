const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
const socket = new WebSocket(`${protocol}://${window.location.host}`);

let uuid = null;

socket.onopen = () => {
  console.log("WebSocket connected");
};

socket.onmessage = (event) => {
  const json = JSON.parse(event.data);
  console.log(json);
  if (json.uuid) {
    uuid = json.uuid;
  } else {
    const chatDiv = document.getElementById('chat');
    chatDiv.appendChild(createMessage(json));
    chatDiv.scrollTo(0, chatDiv.scrollHeight);
  }
};

function sendMessage() {
  const now = new Date();
  const json = {
    name: document.getElementById('nameInput').value,
    message: document.getElementById('msgInput').value,
    time: `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
    mine: true, // ← 自分のメッセージだとわかるように
  };
  socket.send(JSON.stringify(json));
  document.getElementById('msgInput').value = '';
}

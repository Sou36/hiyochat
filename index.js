const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
const socket = new WebSocket(`${protocol}://${window.location.host}`);

let myUuid = null;

// 自分のUUIDを保存・復元
window.onload = () => {
  loadMessages();

  myUuid = localStorage.getItem('myUuid');

  const msgInput = document.getElementById('msgInput');
  msgInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  });
};

socket.onopen = () => {
  console.log("WebSocket connected");
};

socket.onmessage = async (event) => {
  let json;

  if (event.data instanceof Blob) {
    const text = await event.data.text();
    json = JSON.parse(text);
  } else {
    json = JSON.parse(event.data);
  }

  console.log(json);

  // UUIDの初回受信
  if (json.uuid && !json.name && !json.message) {
    myUuid = json.uuid;
    localStorage.setItem('myUuid', myUuid);
    return;
  }

  // UUID未取得だったら復元
  if (!myUuid) {
    myUuid = localStorage.getItem('myUuid');
  }

  // 自分の発言かどうか判定
  json.mine = (json.uuid === myUuid);

  saveMessage(json);
  displayMessage(json);
};

function sendMessage() {
  const now = new Date();
  const json = {
    name: document.getElementById('nameInput').value,
    message: document.getElementById('msgInput').value,
    time: `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`
  };

  socket.send(JSON.stringify(json));
  document.getElementById('msgInput').value = '';
}

function displayMessage(json) {
  const chatDiv = document.getElementById('chat');
  chatDiv.appendChild(createMessage(json));
  chatDiv.scrollTo(0, chatDiv.scrollHeight);
}

function saveMessage(json) {
  const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
  history.push(json);
  localStorage.setItem('chatHistory', JSON.stringify(history));
}

function loadMessages() {
  const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
  history.forEach(displayMessage);
}

function createMessage(json) {
  const side = json.mine ? 'mine' : 'other';
  const sideElement = createDiv(side);
  const sideTextElement = createDiv(`${side}-text`);
  const timeElement = createDiv('time');
  const nameElement = createDiv('name');
  const textElement = createDiv('text');

  timeElement.textContent = json.time;
  nameElement.textContent = json.name;
  textElement.textContent = json.message;

  sideTextElement.appendChild(timeElement);
  sideTextElement.appendChild(nameElement);
  sideTextElement.appendChild(textElement);
  sideElement.appendChild(sideTextElement);

  return sideElement;
}

function createDiv(className) {
  const element = document.createElement('div');
  element.classList.add(className);
  return element;
}

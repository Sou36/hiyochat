const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
const socket = new WebSocket(`${protocol}://${window.location.host}`);

let myUuid = null;

// ===== 起動時の処理 =====
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

// ===== 動画ファイル選択時の処理 =====
document.getElementById('videoInput').addEventListener('change', async function () {
  const file = this.files[0];
  if (!file || !file.type.startsWith('video/')) return;

  const formData = new FormData();
  formData.append('video', file);

  try {
    const res = await fetch('/upload', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();

    const now = new Date();
    const videoMessage = {
      name: document.getElementById('nameInput').value,
      time: `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
      videoUrl: data.url,
      uuid: myUuid
    };

    socket.send(JSON.stringify(videoMessage));
  } catch (err) {
    console.error('アップロード失敗:', err);
  }
});

// ===== WebSocket 接続成功時 =====
socket.onopen = () => {
  console.log("WebSocket connected");
};

// ===== WebSocket メッセージ受信時 =====
socket.onmessage = async (event) => {
  let json;

  if (event.data instanceof Blob) {
    const text = await event.data.text();
    json = JSON.parse(text);
  } else {
    json = JSON.parse(event.data);
  }

  // UUID 受信（初回）
  if (json.uuid && !json.name && !json.message && !json.videoUrl) {
    myUuid = json.uuid;
    localStorage.setItem('myUuid', myUuid);
    return;
  }

  // UUID 未保存なら復元
  if (!myUuid) {
  myUuid = crypto.randomUUID();
  localStorage.setItem('myUuid', myUuid);
}

  // 自分の発言か判定
  json.mine = (json.uuid === myUuid);

  saveMessage(json);
  displayMessage(json);
};

// ===== テキスト送信処理 =====
function sendMessage() {
  const messageText = document.getElementById('msgInput').value.trim();
  if (messageText === '') return;

  const now = new Date();
  const json = {
    name: document.getElementById('nameInput').value,
    message: messageText,
    time: `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
    uuid: myUuid
  };

  socket.send(JSON.stringify(json));
  document.getElementById('msgInput').value = '';
}

// ===== メッセージ表示処理 =====
function displayMessage(json) {
  const chatDiv = document.getElementById('chat');
  chatDiv.appendChild(createMessage(json));
  chatDiv.scrollTo(0, chatDiv.scrollHeight);
}

// ===== ローカル保存：履歴追加 =====
function saveMessage(json) {
  const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
  history.push(json);
  localStorage.setItem('chatHistory', JSON.stringify(history));
}

// ===== ローカル保存：履歴読み込み =====
function loadMessages() {
  const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
  history.forEach(displayMessage);
}

// ===== 表示用要素生成 =====
function createMessage(json) {
  const side = json.mine ? 'mine' : 'other';
  const sideElement = createDiv(side);
  const sideTextElement = createDiv(`${side}-text`);
  const timeElement = createDiv('time');
  const nameElement = createDiv('name');

  timeElement.textContent = json.time;
  nameElement.textContent = json.name;
  sideTextElement.appendChild(timeElement);
  sideTextElement.appendChild(nameElement);

  // 動画またはテキストメッセージを表示
  if (json.videoUrl) {
    const video = document.createElement('video');
    video.src = json.videoUrl;
    video.controls = true;
    video.style.maxWidth = '200px';
    sideTextElement.appendChild(video);
  } else if (json.message) {
    const textElement = createDiv('text');
    textElement.textContent = json.message;
    sideTextElement.appendChild(textElement);
  }

  sideElement.appendChild(sideTextElement);
  return sideElement;
}

// ===== 汎用的な div 作成 =====
function createDiv(className) {
  const element = document.createElement('div');
  element.classList.add(className);
  return element;
}

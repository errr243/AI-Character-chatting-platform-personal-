const elements = {
  status: document.getElementById('status-pill'),
  select: document.getElementById('character-select'),
  info: document.getElementById('character-info'),
  chatWindow: document.getElementById('chat-window'),
  chatForm: document.getElementById('chat-form'),
  chatInput: document.getElementById('chat-input'),
  characterForm: document.getElementById('character-form'),
};

const state = {
  characters: [],
  messages: [],
  currentCharacterId: null,
  sending: false,
  openaiConfigured: false,
};

function setStatus(text, healthy = true) {
  elements.status.textContent = text;
  elements.status.style.borderColor = healthy ? '#1abc9c' : '#ff6b6b';
  elements.status.style.color = healthy ? '#1abc9c' : '#ff6b6b';
}

function renderCharacterInfo(character) {
  if (!character) {
    elements.info.innerHTML = '<p>캐릭터 정보를 불러올 수 없습니다.</p>';
    return;
  }

  elements.info.innerHTML = `
    <h2>${character.name}</h2>
    <p>${character.summary}</p>
    <p><strong>스타일</strong><br />${character.style}</p>
    <p><strong>추천 주제</strong></p>
    <ul>
      ${(character.topics || [])
        .map((topic) => `<li>${topic}</li>`)
        .join('')}
    </ul>
  `;
}

function scrollChatToBottom() {
  requestAnimationFrame(() => {
    elements.chatWindow.scrollTo({
      top: elements.chatWindow.scrollHeight,
      behavior: 'smooth',
    });
  });
}

function renderMessages() {
  elements.chatWindow.innerHTML = '';
  state.messages.forEach((message) => {
    const div = document.createElement('div');
    div.className = `bubble ${message.role}`;
    div.textContent = message.content;
    elements.chatWindow.appendChild(div);
  });
  scrollChatToBottom();
}

function resetConversation(character) {
  state.messages = [];
  if (character?.greeting) {
    state.messages.push({
      role: 'assistant',
      content: character.greeting,
    });
  }
  renderMessages();
}

async function fetchHealth() {
  try {
    const response = await fetch('/api/health');
    if (!response.ok) throw new Error('헬스체크 실패');
    const data = await response.json();
    state.openaiConfigured = Boolean(data.openaiConfigured);
    setStatus(
      state.openaiConfigured
        ? `모델 준비 완료 (${data.model})`
        : 'OPENAI_API_KEY 미설정 - 답변 생성 불가',
      state.openaiConfigured
    );
  } catch (error) {
    console.error(error);
    setStatus('서버 연결 실패', false);
  }
}

async function loadCharacters() {
  try {
    const response = await fetch('/api/characters');
    if (!response.ok) throw new Error('캐릭터 로드 실패');
    const data = await response.json();
    state.characters = data;

    elements.select.innerHTML = data
      .map(
        (character) =>
          `<option value="${character.id}">${character.name}</option>`
      )
      .join('');

    const first = data[0];
    if (first) {
      elements.select.value = first.id;
      state.currentCharacterId = first.id;
      renderCharacterInfo(first);
      resetConversation(first);
    } else {
      elements.info.innerHTML = '<p>등록된 캐릭터가 없습니다.</p>';
    }
  } catch (error) {
    console.error(error);
    elements.info.innerHTML = '<p>캐릭터 정보를 불러오는 중 오류가 발생했습니다.</p>';
  }
}

function getCurrentCharacter() {
  return state.characters.find((c) => c.id === state.currentCharacterId);
}

async function sendMessage(content) {
  if (!state.openaiConfigured) {
    alert('OPENAI_API_KEY가 설정되어 있지 않아 답변을 생성할 수 없습니다.');
    return;
  }

  if (state.sending) return;

  const payload = {
    characterId: state.currentCharacterId,
    messages: state.messages.concat({ role: 'user', content }),
  };

  state.messages.push({ role: 'user', content });
  renderMessages();
  elements.chatInput.value = '';
  state.sending = true;
  elements.chatInput.disabled = true;

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '전송 실패');
    }

    const data = await response.json();
    state.messages.push({ role: 'assistant', content: data.reply });
    renderMessages();
  } catch (error) {
    console.error(error);
    state.messages.push({
      role: 'assistant',
      content: `[오류] ${error.message}`,
    });
    renderMessages();
  } finally {
    state.sending = false;
    elements.chatInput.disabled = false;
    elements.chatInput.focus();
  }
}

elements.chatForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const content = elements.chatInput.value.trim();
  if (!content) return;
  sendMessage(content);
});

elements.chatInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    elements.chatForm.requestSubmit();
  }
});

elements.select.addEventListener('change', (event) => {
  state.currentCharacterId = event.target.value;
  const character = getCurrentCharacter();
  renderCharacterInfo(character);
  resetConversation(character);
});

elements.characterForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(elements.characterForm);
  const rawTopics = (formData.get('topics') || '').toString();
  const payload = {
    name: formData.get('name').trim(),
    summary: formData.get('summary').trim(),
    style: formData.get('style').trim(),
    greeting: formData.get('greeting').trim(),
    topics: rawTopics
      .split(',')
      .map((topic) => topic.trim())
      .filter(Boolean),
  };

  try {
    const response = await fetch('/api/characters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '캐릭터 생성 실패');
    }

    const newCharacter = await response.json();
    state.characters.push(newCharacter);
    const option = document.createElement('option');
    option.value = newCharacter.id;
    option.textContent = newCharacter.name;
    elements.select.appendChild(option);
    elements.select.value = newCharacter.id;
    state.currentCharacterId = newCharacter.id;
    renderCharacterInfo(newCharacter);
    resetConversation(newCharacter);
    elements.characterForm.reset();
  } catch (error) {
    alert(error.message);
  }
});

fetchHealth();
loadCharacters();

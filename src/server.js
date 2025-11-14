const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const OpenAI = require('openai');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const characters = [
  {
    id: 'luna',
    name: '루나',
    summary: '차분하고 세심한 AI 비서. 일과 일정 정리에 강점.',
    greeting: '안녕하세요! 오늘 해야 할 일이 있다면 같이 정리해볼까요?',
    style: '정중하지만 따뜻한 어조, 짧은 문단으로 핵심을 설명.',
    topics: ['일정 정리', '일상 계획', '생산성 팁'],
  },
  {
    id: 'milo',
    name: '밀로',
    summary: '장난기 많은 소설가 캐릭터. 상상력이 풍부하고 이야기 만들기를 좋아함.',
    greeting: '이야기 한 편 어때요? 아무 말이나 던져주면 제가 이어볼게요!',
    style: '밝고 발랄한 말투, 이모지를 가끔 사용.',
    topics: ['이야기 짓기', '세계관 설정', '창작 놀이'],
  },
  {
    id: 'aria',
    name: '아리아',
    summary: '감정 코치. 사용자의 감정을 확인하고 편안하게 해줌.',
    greeting: '지금 마음이 어떠세요? 편하게 말해 주세요.',
    style: '부드럽고 공감 가는 문장, 질문을 자주 던짐.',
    topics: ['감정 일기', '자기 돌봄', '스트레스 완화'],
  },
];

const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/^-+|-+$/g, '') || `character-${Date.now()}`;

const isKeyMissing = !process.env.OPENAI_API_KEY;
const openai = isKeyMissing
  ? null
  : new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

function buildSystemPrompt(character) {
  return [
    `당신은 개인용 AI 캐릭터 플랫폼의 캐릭터입니다.`,
    `캐릭터 이름: ${character.name}`,
    `요약: ${character.summary}`,
    `대화 스타일: ${character.style}`,
    `잘 다루는 주제: ${character.topics.join(', ')}`,
    `언제나 한국어로 대답하세요.`,
    `대답은 3~5문장 이내로 간결하게 작성하고, 상황에 맞는 질문으로 대화를 이어가세요.`,
  ].join('\n');
}

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    openaiConfigured: !isKeyMissing,
    model: MODEL,
  });
});

app.get('/api/characters', (_req, res) => {
  res.json(characters);
});

app.post('/api/characters', (req, res) => {
  const { name, summary, greeting, style, topics } = req.body || {};

  if (!name || !summary || !greeting || !style) {
    return res
      .status(400)
      .json({ error: 'name, summary, greeting, style 필드는 필수입니다.' });
  }

  const id = slugify(name);
  const exists = characters.find((c) => c.id === id);
  if (exists) {
    return res.status(409).json({ error: '이미 존재하는 캐릭터 이름입니다.' });
  }

  const newCharacter = {
    id,
    name,
    summary,
    greeting,
    style,
    topics: Array.isArray(topics) && topics.length ? topics : ['자유 대화'],
  };

  characters.push(newCharacter);
  res.status(201).json(newCharacter);
});

app.post('/api/chat', async (req, res) => {
  if (isKeyMissing) {
    return res
      .status(500)
      .json({ error: 'OPENAI_API_KEY가 설정되지 않았습니다.' });
  }

  const { characterId, messages } = req.body || {};

  const character = characters.find((c) => c.id === characterId) || characters[0];
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages 배열이 필요합니다.' });
  }

  try {
    const response = await openai.responses.create({
      model: MODEL,
      input: [
        {
          role: 'system',
          content: buildSystemPrompt(character),
        },
        ...messages.map((message) => ({
          role: message.role === 'assistant' ? 'assistant' : 'user',
          content: message.content,
        })),
      ],
    });

    const reply =
      response.output_text?.join('\n').trim() ||
      response.output?.[0]?.content?.[0]?.text?.value ||
      '대답을 생성하지 못했습니다.';

    res.json({
      reply,
      character: {
        id: character.id,
        name: character.name,
      },
    });
  } catch (error) {
    console.error('OpenAI error', error);
    res.status(500).json({
      error: '메시지를 생성하는 동안 오류가 발생했습니다.',
      details: error.message,
    });
  }
});

const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

app.get('*', (_req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`AI 캐릭터 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
  if (isKeyMissing) {
    console.warn('⚠️  OPENAI_API_KEY가 설정되어 있지 않습니다. 채팅 기능이 비활성화됩니다.');
  }
});

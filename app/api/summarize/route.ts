import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/gemini/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, existingSummary, characterName, userNote, apiKey } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: '요약할 메시지가 필요합니다.' },
        { status: 400 }
      );
    }

    // API 키 선택: 클라이언트에서 제공한 키 우선, 없으면 환경 변수 키 사용
    let selectedApiKey = apiKey;
    if (!selectedApiKey) {
      // 환경 변수에서 사용 가능한 API 키 찾기
      const envKeys = [
        process.env.GOOGLE_GEMINI_API_KEY,
        process.env.GOOGLE_GEMINI_API_KEY_2,
        process.env.GOOGLE_GEMINI_API_KEY_3,
        process.env.GOOGLE_GEMINI_API_KEY_4,
        process.env.GOOGLE_GEMINI_API_KEY_5,
      ].filter(Boolean) as string[];
      
      if (envKeys.length > 0) {
        selectedApiKey = envKeys[0];
      }
    }

    if (!selectedApiKey) {
      return NextResponse.json(
        { error: 'API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    // 선택된 API 키로 클라이언트 생성
    const { GeminiClient } = await import('@/lib/gemini/client');
    const client = new GeminiClient(selectedApiKey);
    
    // 요약할 대화 내용 구성 (대화 형식으로)
    const conversationText = messages
      .map(m => `${m.role === 'user' ? '사용자' : characterName || 'AI'}: ${m.content}`)
      .join('\n\n');

    // 롤플레잉/소설 대화에 최적화된 요약 프롬프트 구성
    let summaryPrompt = '';
    
    if (existingSummary) {
      // 누적 요약 (기존 메모리와 병합)
      summaryPrompt = `당신은 소설/롤플레잉 대화의 장기 기억을 관리하는 보조 도우미입니다.

[기존 대화 메모리]
${existingSummary}

----------------------------

[새로 추가된 대화 내용]
${conversationText}

${userNote ? `\n[사용자 노트 - 세계관/상황 설정]\n${userNote}\n` : ''}

----------------------------

위 정보를 바탕으로, '대화 메모리'를 한 번 더 정리해서 최신 상태로 만들어주세요.

요구사항:
- '대화 메모리'는 **앞으로의 대화에서 유지해야 할 중요한 설정/사실/관계**만 담습니다.
- 감정선, 캐릭터 관계, 중요한 사건, 합의된 규칙 등을 중심으로 정리하세요.
- 말투/어투 같은 것은 너무 세세하게 적지 말고, 핵심만 요약하세요.
- 새로운 정보가 들어오면 기존 메모리와 **병합**하여, 서로 모순되지 않도록 통합하세요.
- 불필요한 디테일이나 일회성 대사는 포함하지 마세요.
- 모델이 직접 말하는 문장은 넣지 말고, **서술형 요약**만 작성하세요.

출력 형식:
- 한국어로 작성.
- 짧은 단락 3~8개 또는 글머리표 목록.
- 간결하고 명확하게.`;
    } else {
      // 첫 요약
      summaryPrompt = `당신은 소설/롤플레잉 대화의 장기 기억을 관리하는 보조 도우미입니다.

[대화 내용]
${conversationText}

${userNote ? `\n[사용자 노트 - 세계관/상황 설정]\n${userNote}\n` : ''}

----------------------------

위 대화를 바탕으로 '대화 메모리'를 작성해주세요.

요구사항:
- '대화 메모리'는 **앞으로의 대화에서 유지해야 할 중요한 설정/사실/관계**만 담습니다.
- 감정선, 캐릭터 관계, 중요한 사건, 합의된 규칙 등을 중심으로 정리하세요.
- 말투/어투 같은 것은 너무 세세하게 적지 말고, 핵심만 요약하세요.
- 불필요한 디테일이나 일회성 대사는 포함하지 마세요.
- 모델이 직접 말하는 문장은 넣지 말고, **서술형 요약**만 작성하세요.

출력 형식:
- 한국어로 작성.
- 짧은 단락 3~8개 또는 글머리표 목록.
- 간결하고 명확하게.`;
    }

    const summary = await client.summarize(summaryPrompt);

    console.log('✅ 대화 요약 완료:', summary.substring(0, 100) + '...');

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Summarize API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '요약 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}


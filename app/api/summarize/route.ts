import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/gemini/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, existingSummary, characterName } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: '요약할 메시지가 필요합니다.' },
        { status: 400 }
      );
    }

    const client = getGeminiClient();
    
    // 요약할 대화 내용 구성
    const conversationText = messages
      .map(m => `${m.role === 'user' ? '사용자' : characterName || 'AI'}: ${m.content}`)
      .join('\n\n');

    // 요약 프롬프트 구성
    let summaryPrompt = '';
    
    if (existingSummary) {
      // 누적 요약
      summaryPrompt = `다음은 ${characterName || 'AI'}와의 대화 기록입니다.

[이전 대화 요약]
${existingSummary}

[최근 대화 내용]
${conversationText}

위 내용을 바탕으로 전체 대화를 간결하고 포괄적으로 요약해주세요.
이전 요약과 최근 대화를 통합하여, 중요한 정보, 결정사항, 사용자의 선호도나 특징, 진행 중인 작업 등을 포함하세요.
불필요한 세부사항은 생략하고 핵심만 간결하게 작성하세요.`;
    } else {
      // 첫 요약
      summaryPrompt = `다음은 ${characterName || 'AI'}와의 대화 내용입니다.

${conversationText}

위 대화를 핵심 내용만 간결하게 요약해주세요.
중요한 정보, 결정사항, 사용자의 선호도나 특징, 진행 중인 작업 등을 포함하세요.
불필요한 세부사항은 생략하고 핵심만 간결하게 작성하세요.`;
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


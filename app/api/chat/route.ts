import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/gemini/client';
import type { ChatMessage } from '@/lib/gemini/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, characterName, characterPersonality, model, maxOutputTokens, thinkingBudget, contextSummary, userNote } = body;

    console.log('=== Chat API Request ===');
    console.log('Messages count:', messages?.length);
    console.log('Character name:', characterName);
    console.log('Model:', model || 'gemini-pro');
    console.log('Max output tokens:', maxOutputTokens);
    console.log('Thinking budget:', thinkingBudget);
    console.log('Has context summary:', !!contextSummary);
    console.log('Has user note:', !!userNote);

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: '메시지가 필요합니다.' },
        { status: 400 }
      );
    }

    // 마지막 메시지가 사용자 메시지인지 확인
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'user') {
      return NextResponse.json(
        { error: '마지막 메시지는 사용자 메시지여야 합니다.' },
        { status: 400 }
      );
    }

    const client = getGeminiClient();
    const response = await client.chat({
      messages: messages as ChatMessage[],
      characterName,
      characterPersonality,
      contextSummary,
      userNote,
      model: model || 'gemini-pro',
      maxOutputTokens,
      thinkingBudget,
    });

    console.log('=== Gemini Client Response ===');
    console.log('Has message:', !!response?.message);
    console.log('Message length:', response?.message?.length || 0);
    console.log('Model:', response?.model);
    console.log('Tokens:', response?.tokens);

    // 응답 검증
    if (!response || !response.message) {
      console.error('❌ Invalid response from Gemini client:', response);
      return NextResponse.json(
        { error: 'AI 응답 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    console.log('✓ Returning successful response');
    return NextResponse.json(response);
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '채팅 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

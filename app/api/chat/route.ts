import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/gemini/client';
import type { ChatMessage } from '@/lib/gemini/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, characterName, characterPersonality, model, maxOutputTokens, thinkingBudget, contextSummary, userNote, activeLorebooks, apiKey, clientApiKeys } = body;

    console.log('=== Chat API Request ===');
    console.log('Messages count:', messages?.length);
    console.log('Character name:', characterName);
    console.log('Model:', model || 'gemini-pro');
    console.log('Max output tokens:', maxOutputTokens);
    console.log('Thinking budget:', thinkingBudget);
    console.log('Has context summary:', !!contextSummary);
    console.log('Has user note:', !!userNote);
    console.log('Active lorebooks:', activeLorebooks?.length || 0);
    // 보안: API 키 존재 여부만 로그 (실제 키 값은 로그하지 않음)
    console.log('Has custom API key:', !!apiKey);
    
    // 환경 변수에서 사용 가능한 API 키 개수 확인
    const envKeyEntries = [
      { key: process.env.GOOGLE_GEMINI_API_KEY, label: 'GOOGLE_GEMINI_API_KEY' },
      { key: process.env.GOOGLE_GEMINI_API_KEY_2, label: 'GOOGLE_GEMINI_API_KEY_2' },
      { key: process.env.GOOGLE_GEMINI_API_KEY_3, label: 'GOOGLE_GEMINI_API_KEY_3' },
      { key: process.env.GOOGLE_GEMINI_API_KEY_4, label: 'GOOGLE_GEMINI_API_KEY_4' },
      { key: process.env.GOOGLE_GEMINI_API_KEY_5, label: 'GOOGLE_GEMINI_API_KEY_5' },
    ].filter((entry): entry is { key: string; label: string } => Boolean(entry.key));
    
    const allEnvKeys = envKeyEntries.map(entry => entry.key);
    
    // 클라이언트에서 전달된 모든 활성 API 키들
    const clientKeys = Array.isArray(clientApiKeys) ? clientApiKeys.filter(Boolean) : [];

    // 키별 라벨 매핑 (로그 용도)
    const keyLabelMap = new Map<string, string>();
    envKeyEntries.forEach(entry => keyLabelMap.set(entry.key, entry.label));
    clientKeys.forEach((key, index) => {
      if (!keyLabelMap.has(key)) {
        keyLabelMap.set(key, `클라이언트 키 #${index + 1}`);
      }
    });

    const maskKey = (key?: string) => {
      if (!key) return '없음';
      if (key.length <= 8) return `${key.substring(0, 2)}...${key.substring(key.length - 2)}`;
      return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
    };
    
    console.log(`📊 환경 변수에서 ${allEnvKeys.length}개의 API 키를 찾았습니다.`);
    console.log(`📊 클라이언트에서 ${clientKeys.length}개의 API 키를 받았습니다.`);

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

    // API 키 선택 우선순위:
    // 1. 환경 변수 키 우선 사용 (더 안정적)
    // 2. 클라이언트에서 제공한 키는 fallback으로만 사용
    let selectedApiKey: string | undefined;
    let keySource = '';
    
    if (allEnvKeys.length > 0) {
      // 환경 변수 키 우선 사용
      const selectedEnvEntry = envKeyEntries[0];
      selectedApiKey = selectedEnvEntry.key;
      keySource = `환경 변수 (${selectedEnvEntry.label})`;
      console.log(
        `🔑 환경 변수에서 API 키 선택: ${selectedEnvEntry.label} (${maskKey(selectedEnvEntry.key)})`
      );
    } else if (apiKey) {
      // 환경 변수 키가 없으면 클라이언트에서 선택한 키 사용
      selectedApiKey = apiKey;
      keySource = '클라이언트';
      console.log(`🔑 클라이언트에서 제공한 API 키 사용 (환경 변수 키 없음) - ${maskKey(apiKey)}`);
    } else if (clientKeys.length > 0) {
      // 클라이언트 키 배열에서 첫 번째 사용
      selectedApiKey = clientKeys[0];
      keySource = '클라이언트';
      console.log(
        `🔑 클라이언트 키 배열에서 API 키 선택: ${clientKeys.length}개 중 첫 번째 키 사용 (${maskKey(selectedApiKey)})`
      );
    } else {
      console.warn('⚠️ API 키를 찾을 수 없습니다.');
    }
    
    if (!selectedApiKey) {
      return NextResponse.json(
        { error: 'API 키가 설정되지 않았습니다. 환경 변수 또는 설정에서 API 키를 추가해주세요.' },
        { status: 500 }
      );
    }

    // 선택된 API 키 또는 사용 가능한 모든 키로 클라이언트 생성
    const { GeminiClient } = await import('@/lib/gemini/client');

    // 환경 변수 키와 클라이언트 키를 결합하여 GeminiClient 생성
    const allAvailableKeys = [selectedApiKey, ...allEnvKeys, ...clientKeys].filter(key => key) as string[];
    const uniqueKeys = Array.from(new Set(allAvailableKeys)); // 중복 제거

    console.log(`🔧 GeminiClient 생성: 총 ${uniqueKeys.length}개의 API 키 사용`);
    uniqueKeys.forEach((key, index) => {
      console.log(`   [${index + 1}] ${maskKey(key)}`);
    });

    const client = new GeminiClient(uniqueKeys);

    let response;
    try {
      response = await client.chat({
        messages: messages as ChatMessage[],
        characterName,
        characterPersonality,
        contextSummary,
        userNote,
        activeLorebooks,
        model: model || 'gemini-pro',
        maxOutputTokens,
        thinkingBudget,
      });
    } catch (error: any) {
      // GeminiClient 내부에서 API 키 자동 전환 로직이 처리되므로,
      // 여기서는 최종 오류만 다시 throw
      throw error;
    }

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

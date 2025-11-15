import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/gemini/client';
import type { ChatMessage } from '@/lib/gemini/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, characterName, characterPersonality, model, maxOutputTokens, thinkingBudget, contextSummary, userNote, apiKey } = body;

    console.log('=== Chat API Request ===');
    console.log('Messages count:', messages?.length);
    console.log('Character name:', characterName);
    console.log('Model:', model || 'gemini-pro');
    console.log('Max output tokens:', maxOutputTokens);
    console.log('Thinking budget:', thinkingBudget);
    console.log('Has context summary:', !!contextSummary);
    console.log('Has user note:', !!userNote);
    console.log('Has custom API key:', !!apiKey);
    
    // 환경 변수에서 사용 가능한 API 키 개수 확인
    const envKeysCount = [
      process.env.GOOGLE_GEMINI_API_KEY,
      process.env.GOOGLE_GEMINI_API_KEY_2,
      process.env.GOOGLE_GEMINI_API_KEY_3,
      process.env.GOOGLE_GEMINI_API_KEY_4,
      process.env.GOOGLE_GEMINI_API_KEY_5,
    ].filter(Boolean).length;
    console.log(`📊 환경 변수에서 ${envKeysCount}개의 API 키를 찾았습니다.`);

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
    // 1. 요청에 포함된 키 (클라이언트에서 설정한 경우)
    // 2. 환경 변수에서 순차적으로 시도
    let selectedApiKey = apiKey;
    
    if (!selectedApiKey) {
      // 환경 변수에서 API 키 찾기 (여러 개 지원)
      const envKeys = [
        process.env.GOOGLE_GEMINI_API_KEY,
        process.env.GOOGLE_GEMINI_API_KEY_2,
        process.env.GOOGLE_GEMINI_API_KEY_3,
        process.env.GOOGLE_GEMINI_API_KEY_4,
        process.env.GOOGLE_GEMINI_API_KEY_5,
      ].filter(Boolean) as string[];
      
      if (envKeys.length > 0) {
        // 첫 번째 키 사용 (로테이션은 나중에 구현 가능)
        selectedApiKey = envKeys[0];
        console.log(`🔑 환경 변수에서 API 키 선택: ${envKeys.length}개 중 첫 번째 키 사용`);
      } else {
        console.warn('⚠️ 환경 변수에서 API 키를 찾을 수 없습니다.');
      }
    } else {
      console.log('🔑 클라이언트에서 제공한 API 키 사용');
    }
    
    if (!selectedApiKey) {
      return NextResponse.json(
        { error: 'API 키가 설정되지 않았습니다. 환경 변수 또는 설정에서 API 키를 추가해주세요.' },
        { status: 500 }
      );
    }

    // 선택된 API 키로 클라이언트 생성
    const { GeminiClient } = await import('@/lib/gemini/client');
    const client = new GeminiClient({ apiKey: selectedApiKey });
    
    let response;
    try {
      response = await client.chat({
        messages: messages as ChatMessage[],
        characterName,
        characterPersonality,
        contextSummary,
        userNote,
        model: model || 'gemini-pro',
        maxOutputTokens,
        thinkingBudget,
      });
    } catch (error: any) {
      // 429 오류 발생 시 다른 API 키로 재시도
      if (error?.message?.includes('429') || error?.message?.includes('quota')) {
        console.log('⚠️ 할당량 초과 오류 발생, 다른 API 키로 전환 시도...');
        
        // 모든 환경 변수 키 가져오기 (첫 번째 키 제외)
        const allEnvKeys = [
          process.env.GOOGLE_GEMINI_API_KEY,
          process.env.GOOGLE_GEMINI_API_KEY_2,
          process.env.GOOGLE_GEMINI_API_KEY_3,
          process.env.GOOGLE_GEMINI_API_KEY_4,
          process.env.GOOGLE_GEMINI_API_KEY_5,
        ].filter(Boolean) as string[];
        
        // 현재 사용한 키를 제외한 나머지 키들
        const fallbackKeys = allEnvKeys.filter(key => key !== selectedApiKey);
        
        console.log(`🔄 ${fallbackKeys.length}개의 대체 API 키로 재시도 중...`);

        for (let i = 0; i < fallbackKeys.length; i++) {
          const fallbackKey = fallbackKeys[i];
          
          try {
            console.log(`🔄 API 키 ${i + 1}/${fallbackKeys.length} 시도 중...`);
            const fallbackClient = new GeminiClient({ apiKey: fallbackKey });
            response = await fallbackClient.chat({
              messages: messages as ChatMessage[],
              characterName,
              characterPersonality,
              contextSummary,
              userNote,
              model: model || 'gemini-pro',
              maxOutputTokens,
              thinkingBudget,
            });
            console.log(`✅ API 키 전환 성공! (키 ${i + 1}/${fallbackKeys.length} 사용)`);
            break; // 성공하면 루프 종료
          } catch (retryError: any) {
            const isQuotaError = retryError?.message?.includes('429') || retryError?.message?.includes('quota');
            if (isQuotaError) {
              console.log(`❌ 키 ${i + 1}/${fallbackKeys.length}도 할당량 초과, 다음 키 시도...`);
            } else {
              console.log(`❌ 키 ${i + 1}/${fallbackKeys.length} 오류: ${retryError?.message?.substring(0, 50)}`);
            }
            continue; // 다음 키 시도
          }
        }
        
        // 모든 키가 실패한 경우 원래 오류를 다시 throw
        if (!response) {
          console.error('❌ 모든 API 키가 실패했습니다.');
          throw error;
        }
      } else {
        throw error; // 429가 아닌 다른 오류는 그대로 throw
      }
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

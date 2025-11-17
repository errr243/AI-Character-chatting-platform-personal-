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
    const allEnvKeys = [
      process.env.GOOGLE_GEMINI_API_KEY,
      process.env.GOOGLE_GEMINI_API_KEY_2,
      process.env.GOOGLE_GEMINI_API_KEY_3,
      process.env.GOOGLE_GEMINI_API_KEY_4,
      process.env.GOOGLE_GEMINI_API_KEY_5,
    ].filter(Boolean) as string[];
    
    // 클라이언트에서 전달된 모든 활성 API 키들
    const clientKeys = Array.isArray(clientApiKeys) ? clientApiKeys.filter(Boolean) : [];
    
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
      selectedApiKey = allEnvKeys[0];
      keySource = '환경 변수';
      console.log(`🔑 환경 변수에서 API 키 선택: ${allEnvKeys.length}개 중 첫 번째 키 사용`);
    } else if (apiKey) {
      // 환경 변수 키가 없으면 클라이언트에서 선택한 키 사용
      selectedApiKey = apiKey;
      keySource = '클라이언트';
      console.log('🔑 클라이언트에서 제공한 API 키 사용 (환경 변수 키 없음)');
    } else if (clientKeys.length > 0) {
      // 클라이언트 키 배열에서 첫 번째 사용
      selectedApiKey = clientKeys[0];
      keySource = '클라이언트';
      console.log(`🔑 클라이언트 키 배열에서 API 키 선택: ${clientKeys.length}개 중 첫 번째 키 사용`);
    } else {
      console.warn('⚠️ API 키를 찾을 수 없습니다.');
    }
    
    if (!selectedApiKey) {
      return NextResponse.json(
        { error: 'API 키가 설정되지 않았습니다. 환경 변수 또는 설정에서 API 키를 추가해주세요.' },
        { status: 500 }
      );
    }

    // 선택된 API 키로 클라이언트 생성
    const { GeminiClient } = await import('@/lib/gemini/client');
    const client = new GeminiClient(selectedApiKey);
    
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
      // 429 (할당량 초과) 또는 400 (잘못된 API 키) 오류 발생 시 다른 API 키로 재시도
      // 원본 에러 메시지도 확인 (lib/gemini/client.ts에서 보존된 originalMessage)
      const originalMessage = error?.originalMessage || error?.message || '';
      const originalStatus = error?.originalStatus || error?.status || '';
      
      const isQuotaError = 
        originalMessage?.includes('429') || 
        originalMessage?.includes('quota') || 
        originalMessage?.includes('Quota exceeded') ||
        error?.message?.includes('429') || 
        error?.message?.includes('quota') || 
        error?.message?.includes('Quota exceeded');
      
      const isInvalidKeyError = 
        originalStatus === 400 ||
        originalMessage?.includes('400') || 
        originalMessage?.includes('API key not valid') || 
        originalMessage?.includes('API_KEY_INVALID') ||
        error?.message?.includes('400') || 
        error?.message?.includes('API key not valid') || 
        error?.message?.includes('API_KEY_INVALID');
      
      if (isQuotaError || isInvalidKeyError) {
        const errorType = isInvalidKeyError ? '잘못된 API 키' : '할당량 초과';
        console.log(`⚠️ ${errorType} 오류 발생, 다른 API 키로 전환 시도...`);
        // 보안: API 키의 일부만 로그 (처음 4자 + ... + 마지막 4자)
        const maskedKey = selectedApiKey 
          ? `${selectedApiKey.substring(0, 4)}...${selectedApiKey.substring(selectedApiKey.length - 4)}`
          : '없음';
        console.log(`현재 사용 중인 키: ${maskedKey}`);
        
        // 현재 사용한 키를 제외한 나머지 키들
        // 모든 사용 가능한 키를 하나의 배열로 합치기
        const allAvailableKeys = [...allEnvKeys, ...clientKeys];
        const uniqueKeys = Array.from(new Set(allAvailableKeys)); // 중복 제거
        
        // 현재 사용한 키를 제외한 나머지 키들
        let fallbackKeys = uniqueKeys.filter(key => key !== selectedApiKey);
        
        console.log(`🔄 ${keySource} 키 실패, ${fallbackKeys.length}개의 대체 API 키로 재시도 중...`);
        console.log(`   - 환경 변수 키: ${allEnvKeys.length}개`);
        console.log(`   - 클라이언트 키: ${clientKeys.length}개`);
        console.log(`   - 총 사용 가능한 키: ${uniqueKeys.length}개`);
        
        if (fallbackKeys.length === 0) {
          console.error('❌ 사용 가능한 대체 API 키가 없습니다.');
          const finalError: any = new Error('모든 API 키가 유효하지 않습니다. 환경 변수 또는 설정에서 유효한 API 키를 확인해주세요.');
          finalError.originalMessage = originalMessage;
          finalError.originalStatus = originalStatus;
          throw finalError;
        }

        for (let i = 0; i < fallbackKeys.length; i++) {
          const fallbackKey = fallbackKeys[i];
          
          try {
            console.log(`🔄 API 키 ${i + 1}/${fallbackKeys.length} 시도 중...`);
            const fallbackClient = new GeminiClient(fallbackKey);
            response = await fallbackClient.chat({
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
            console.log(`✅ API 키 전환 성공! (키 ${i + 1}/${fallbackKeys.length} 사용)`);
            break; // 성공하면 루프 종료
          } catch (retryError: any) {
            const isRetryQuotaError = retryError?.message?.includes('429') || retryError?.message?.includes('quota');
            const isRetryInvalidKeyError = retryError?.message?.includes('400') || retryError?.message?.includes('API key not valid');
            
            if (isRetryQuotaError) {
              console.log(`❌ 키 ${i + 1}/${fallbackKeys.length}도 할당량 초과, 다음 키 시도...`);
            } else if (isRetryInvalidKeyError) {
              console.log(`❌ 키 ${i + 1}/${fallbackKeys.length}도 잘못된 키, 다음 키 시도...`);
            } else {
              console.log(`❌ 키 ${i + 1}/${fallbackKeys.length} 오류: ${retryError?.message?.substring(0, 50)}`);
            }
            continue; // 다음 키 시도
          }
        }
        
        // 모든 키가 실패한 경우 명확한 에러 메시지와 함께 throw
        if (!response) {
          console.error('❌ 모든 API 키가 실패했습니다.');
          const finalError: any = new Error('모든 API 키가 유효하지 않습니다. 환경 변수 또는 설정에서 유효한 API 키를 확인해주세요.');
          finalError.originalMessage = originalMessage;
          finalError.originalStatus = originalStatus;
          throw finalError;
        }
      } else {
        throw error; // 429/400이 아닌 다른 오류는 그대로 throw
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

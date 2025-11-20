import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ChatRequest, ChatResponse, ChatMessage } from './types';

interface ApiKeyStatus {
  status: 'valid' | 'quota-exceeded' | 'invalid';
  lastError?: Date;
}

export class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private defaultModel: 'gemini-flash' | 'gemini-pro';
  private availableKeys: string[];
  private currentKeyIndex: number;
  private keyStatus: Map<string, ApiKeyStatus>;
  private currentApiKey: string;
  private currentApiKeyId?: string;

  // 현재 사용 중인 API 키 정보 확인용 메서드
  getCurrentApiKeyInfo(): { key: string; index: number; total: number; maskedKey: string } {
    return {
      key: this.currentApiKey,
      index: this.currentKeyIndex,
      total: this.availableKeys.length,
      maskedKey: this.maskKey(this.currentApiKey)
    };
  }

  constructor(apiKeys: string | string[], model: 'gemini-flash' | 'gemini-pro' = 'gemini-flash') {
    const keys = Array.isArray(apiKeys) ? apiKeys : [apiKeys];

    if (!keys || keys.length === 0 || !keys.some(key => key)) {
      throw new Error('최소한 하나의 유효한 API 키가 필요합니다');
    }

    // 유효한 키만 필터링
    this.availableKeys = keys.filter(key => key);
    this.currentKeyIndex = 0;
    this.keyStatus = new Map();

    // 초기 키 상태 설정
    this.availableKeys.forEach(key => {
      this.keyStatus.set(key, { status: 'valid' });
    });

    // 첫 번째 유효한 키 선택
    const initialKey = this.getNextValidKey();
    if (!initialKey) {
      throw new Error('사용 가능한 유효한 API 키가 없습니다');
    }
    this.currentApiKey = initialKey;

    this.genAI = new GoogleGenerativeAI(this.currentApiKey);
    this.defaultModel = model;

    // 디버깅용 로그: 사용 가능한 키 정보 출력
    console.log(`🚀 GeminiClient 초기화 완료`);
    console.log(`🔑 총 ${this.availableKeys.length}개의 API 키가 등록됨`);
    this.availableKeys.forEach((key, index) => {
      const status = this.keyStatus.get(key);
      console.log(`   [${index + 1}] ${this.maskKey(key)} - ${status?.status || 'unknown'}`);
    });
    console.log(`🔄 현재 사용 중인 키: ${this.maskKey(this.currentApiKey)} (인덱스: ${this.currentKeyIndex + 1}/${this.availableKeys.length})`);
  }

  // API 키 전환 메서드
  switchApiKey(newApiKey: string): void {
    this.currentApiKey = newApiKey;
    this.genAI = new GoogleGenerativeAI(newApiKey);
    console.log('🔄 API 키가 전환되었습니다.');
  }

  // 유효한 다음 API 키 찾기
  private getNextValidKey(): string | null {
    if (this.availableKeys.length === 0) {
      return null;
    }

    // 현재 인덱스 다음부터 시작하여 유효한 키 찾기
    for (let i = 1; i <= this.availableKeys.length; i++) {
      const index = (this.currentKeyIndex + i) % this.availableKeys.length;
      const key = this.availableKeys[index];
      const status = this.keyStatus.get(key);

      if (status?.status === 'valid') {
        this.currentKeyIndex = index; // 현재 인덱스 업데이트
        return key;
      }
    }

    // 모든 키가 유효하지 않은 경우
    return null;
  }

  // 키 상태 업데이트
  private updateKeyStatus(apiKey: string, status: 'valid' | 'quota-exceeded' | 'invalid'): void {
    this.keyStatus.set(apiKey, {
      status,
      lastError: status !== 'valid' ? new Date() : undefined
    });
  }

  // 특정 키가 현재 사용 불가능한지 확인
  private isKeyUnavailable(apiKey: string): boolean {
    const status = this.keyStatus.get(apiKey);
    return status?.status !== 'valid';
  }

  // 재시도 헬퍼 함수 (API 키 전환 로직 포함)
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error | null = null;
    let attemptsOnCurrentKey = 0;

    while (true) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;

        const isRetryable =
          (error?.message?.includes('503') ||
            error?.message?.includes('overloaded') ||
            (error?.message?.includes('rate limit') && !error?.message?.includes('429')));

        if (isRetryable && attemptsOnCurrentKey < maxRetries) {
          attemptsOnCurrentKey++;
          const delay = baseDelay * Math.pow(2, attemptsOnCurrentKey);
          console.log(`API 요청 실패 (시도 ${attemptsOnCurrentKey}/${maxRetries}). ${delay}ms 후 재시도...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        const isQuotaExceeded =
          error?.message?.includes('429') ||
          error?.message?.includes('quota') ||
          error?.message?.includes('Quota exceeded');

        const isInvalidKey =
          error?.status === 400 ||
          error?.status === 403 ||
          error?.message?.includes('400') ||
          error?.message?.includes('403') ||
          error?.message?.includes('API key not valid') ||
          error?.message?.includes('API_KEY_INVALID') ||
          error?.message?.includes('API key was reported as leaked') ||
          error?.message?.includes('Forbidden');

        if (isQuotaExceeded) {
          this.updateKeyStatus(this.currentApiKey, 'quota-exceeded');
          console.log(`⚠️ API 키 할당량 초과 감지: ${this.maskKey(this.currentApiKey)}`);
        } else if (isInvalidKey) {
          this.updateKeyStatus(this.currentApiKey, 'invalid');
          console.log(`⚠️ 유효하지 않은 API 키 감지: ${this.maskKey(this.currentApiKey)}`);
        } else {
          // 재시도 불가능한 알 수 없는 오류. 키 상태는 바꾸지 않고 다음 키로 전환.
          console.log(`⚠️ 알 수 없는 오류로 인해 키 전환 시도: ${this.maskKey(this.currentApiKey)}`);
        }

        const nextKey = this.getNextValidKey();

        if (nextKey) {
          console.log(`🔄 다른 API 키로 자동 전환: ${this.maskKey(nextKey)}`);
          this.switchToKey(nextKey);
          attemptsOnCurrentKey = 0;
        } else {
          console.log('❌ 사용 가능한 다른 API 키가 없습니다.');

          const allKeys = this.availableKeys;
          const invalidCount = allKeys.filter(k => this.keyStatus.get(k)?.status === 'invalid').length;
          const quotaCount = allKeys.filter(k => this.keyStatus.get(k)?.status === 'quota-exceeded').length;

          let errorMessage = '모든 API 키를 시도했지만 요청에 실패했습니다.';
          if (invalidCount > 0 && invalidCount + quotaCount >= allKeys.length) {
            errorMessage = '모든 활성 API 키가 유효하지 않거나 할당량을 초과했습니다. 설정을 확인해주세요.';
          } else if (quotaCount > 0 && quotaCount === allKeys.length) {
            errorMessage = '모든 API 키의 할당량이 초과되었습니다. 잠시 후 다시 시도해주세요.';
          } else if (invalidCount > 0 && invalidCount === allKeys.length) {
            errorMessage = '모든 API 키가 유효하지 않습니다. 설정을 확인해주세요.';
          }

          const friendlyError = new Error(errorMessage);
          (friendlyError as any).status = 500;
          throw friendlyError;
        }
      }
    }
  }

  // API 키 전환
  private switchToKey(newApiKey: string): void {
    const oldKey = this.currentApiKey;
    this.currentApiKey = newApiKey;
    this.genAI = new GoogleGenerativeAI(newApiKey);
    console.log(`🔄 API 키가 ${this.maskKey(oldKey)}에서 ${this.maskKey(newApiKey)}로 전환되었습니다.`);
  }

  // 키 마스킹 유틸리티
  private maskKey(key?: string): string {
    if (!key) return '없음';
    if (key.length <= 8) return `${key.substring(0, 2)}...${key.substring(key.length - 2)}`;
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const model = request.model || this.defaultModel;

    // 현재 사용 중인 API 키 정보 로그
    const currentKeyInfo = this.getCurrentApiKeyInfo();
    console.log(`💬 채팅 요청 시작 (현재 키: ${currentKeyInfo.maskedKey}, ${currentKeyInfo.index + 1}/${currentKeyInfo.total})`);

    // Generation config 구성 (모델 초기화 시 사용)
    const modelGenerationConfig: any = {};

    // 최대 출력 토큰 수 설정
    // 주의: 너무 작은 값(256 미만)은 빈 응답을 유발할 수 있음
    if (request.maxOutputTokens !== undefined && request.maxOutputTokens < 8192) {
      // 최소 256 토큰 보장
      const safeMaxTokens = Math.max(256, request.maxOutputTokens);
      modelGenerationConfig.maxOutputTokens = safeMaxTokens;
    }

    // ThinkingBudget 설정 (Pro 모델만)
    if (model === 'gemini-pro' && request.thinkingBudget !== undefined) {
      modelGenerationConfig.thinkingConfig = {
        thinkingBudget: request.thinkingBudget
      };
    }

    const geminiModel = this.genAI.getGenerativeModel({
      model: model === 'gemini-flash' ? 'gemini-2.5-flash' : 'gemini-2.5-pro',
      generationConfig: Object.keys(modelGenerationConfig).length > 0 ? modelGenerationConfig : undefined,
    });

    // 캐릭터 설정 구성 (긴 컨텍스트 지원)
    let characterContext = '';
    if (request.characterName || request.characterPersonality) {
      characterContext = `당신은 ${request.characterName || '친근한 AI 캐릭터'}입니다.`;
      if (request.characterPersonality) {
        characterContext += `\n\n${request.characterPersonality}`;
      }

      // 유저노트 추가 (사용자가 직접 작성한 세계관/상황 설정)
      if (request.userNote) {
        characterContext += `\n\n[사용자 노트 - 세계관/상황 설정]\n${request.userNote}`;
        characterContext += '\n\n(위 내용은 사용자가 직접 작성한 설정입니다. 이를 반드시 참고하여 대화하세요.)';
      }

      // 이전 대화 요약 추가 (컨텍스트 보존)
      if (request.contextSummary) {
        characterContext += `\n\n[이전 대화 핵심 요약]\n${request.contextSummary}`;
        characterContext += '\n\n(위 내용은 최근 10턴 이전의 대화 요약입니다. 참고하되 최근 대화에 집중하세요.)';
      }

      // 로어북 정보 추가 (키워드 기반)
      if (request.activeLorebooks && request.activeLorebooks.length > 0) {
        characterContext += '\n\n[로어북 - 추가 정보]';
        for (const lorebook of request.activeLorebooks) {
          characterContext += `\n\n[키워드: ${lorebook.keywords.join(', ')}]`;
          characterContext += `\n${lorebook.content}`;
        }
        characterContext += '\n\n(위 내용은 대화에서 언급된 키워드와 관련된 추가 설정입니다. 이를 참고하여 일관된 세계관과 캐릭터성을 유지하세요.)';
      }

      // 응답 길이 제한이 있으면 프롬프트에 추가
      if (request.maxOutputTokens && request.maxOutputTokens < 8192) {
        const tokenLimit = request.maxOutputTokens;
        if (tokenLimit <= 256) {
          characterContext += '\n\n답변은 매우 간결하게, 핵심만 1-2문장으로 전달하세요.';
        } else if (tokenLimit <= 512) {
          characterContext += '\n\n답변은 간결하고 명확하게 작성하세요.';
        } else if (tokenLimit <= 1024) {
          characterContext += '\n\n답변은 적절한 길이로 작성하세요.';
        } else if (tokenLimit <= 2048) {
          characterContext += '\n\n답변은 상세하게 작성하세요.';
        } else if (tokenLimit <= 4096) {
          characterContext += '\n\n답변은 매우 상세하고 깊이 있게 작성하세요. 필요한 경우 예시와 설명을 충분히 포함하세요.';
        } else if (tokenLimit <= 6144) {
          characterContext += '\n\n답변은 극도로 상세하고 심층적으로 작성하세요. 다양한 관점과 예시, 배경 설명을 풍부하게 포함하여 완전한 이해를 돕도록 하세요.';
        }
      }


      // 대화 스타일 및 규칙
      characterContext += '\n\n[중요한 규칙]';
      characterContext += '\n- 당신은 절대로 사용자를 대신하여 메시지를 작성하면 안 됩니다.';
      characterContext += '\n- 사용자의 다음 행동이나 대사를 가정하거나 상상해서 작성하지 마세요.';
      characterContext += '\n- 당신의 응답만 작성하고, 대화를 이어가는 것은 사용자의 몫입니다.';
      characterContext += '\n\n[대화 스타일 가이드]';
      characterContext += '\n- 목차나 번호 매기기 없이 자연스럽게 대화하세요.';
      characterContext += '\n- "1. 2. 3..." 또는 "첫째, 둘째, 셋째..." 같은 형식적인 나열은 피하세요.';
      characterContext += '\n- 마치 실제 사람처럼 자연스럽고 유기적으로 대화를 이어가세요.';
      characterContext += '\n- 정보를 전달할 때도 이야기하듯 풀어서 설명하세요.';
    }

    // 대화 기록을 Gemini 형식으로 변환
    const history = request.messages.slice(0, -1); // 마지막 메시지 제외
    const currentMessage = request.messages[request.messages.length - 1];

    try {
      // 채팅 히스토리 구성
      const chatHistory: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      // 캐릭터 설정이 있고 첫 메시지인 경우, 히스토리 시작 부분에 추가
      if (characterContext && history.length === 0) {
        chatHistory.push({
          role: 'user',
          parts: [{ text: '시작하겠습니다.' }],
        });
        chatHistory.push({
          role: 'model',
          parts: [{ text: `${characterContext}\n\n알겠습니다! 준비되었습니다. 무엇을 도와드릴까요?` }],
        });
      } else if (history.length > 0) {
        // 기존 대화 히스토리가 있는 경우
        // 첫 번째 메시지가 'user' 역할인지 확인
        const firstMessage = history[0];
        if (firstMessage.role !== 'user') {
          // 첫 번째 메시지가 'assistant'인 경우, 빈 user 메시지를 추가
          chatHistory.push({
            role: 'user',
            parts: [{ text: '시작하겠습니다.' }],
          });
        }

        // 기존 대화 히스토리 추가
        chatHistory.push(...history.map(msg => ({
          role: (msg.role === 'user' ? 'user' : 'model') as 'user' | 'model',
          parts: [{ text: msg.content }],
        })));
      } else {
        // 히스토리가 없고 캐릭터 설정도 없는 경우, 빈 user 메시지 추가
        chatHistory.push({
          role: 'user',
          parts: [{ text: '시작하겠습니다.' }],
        });
      }

      // 히스토리 검증: 첫 번째 메시지는 반드시 'user'여야 함
      if (chatHistory.length > 0 && chatHistory[0].role !== 'user') {
        console.error('Invalid chat history - first message is not user:', JSON.stringify(chatHistory, null, 2));
        console.error('History input:', JSON.stringify(history, null, 2));
        console.error('Character context:', characterContext ? 'present' : 'absent');
        throw new Error('채팅 히스토리 구성 오류: 첫 번째 메시지는 사용자 메시지여야 합니다.');
      }

      // 디버깅: 히스토리 구조 확인
      if (chatHistory.length === 0) {
        console.warn('Warning: chatHistory is empty, adding default user message');
        chatHistory.push({
          role: 'user',
          parts: [{ text: '시작하겠습니다.' }],
        });
      }

      // 최종 검증: chatHistory가 비어있지 않고 첫 번째 메시지가 'user'인지 확인
      if (chatHistory.length === 0) {
        console.error('Error: chatHistory is empty before startChat');
        chatHistory.push({
          role: 'user',
          parts: [{ text: '시작하겠습니다.' }],
        });
      }

      if (chatHistory[0].role !== 'user') {
        console.error('Error: First message in chatHistory is not user:', chatHistory[0]);
        // 첫 번째 메시지를 user로 교체
        chatHistory.unshift({
          role: 'user',
          parts: [{ text: '시작하겠습니다.' }],
        });
      }

      // 재시도 로직과 함께 API 호출
      const result = await this.retryWithBackoff(async () => {
        const chat = geminiModel.startChat({
          history: chatHistory,
        });

        // thinkingBudget은 이미 generationConfig에 포함되어 모델 초기화 시 전달됨
        return await chat.sendMessage(currentMessage.content);
      });

      const response = await result.response;
      const message = response.text();

      console.log('=== Gemini API Response ===');
      console.log('Message length:', message?.length || 0);
      console.log('Preview:', message?.substring(0, 100));

      // 응답 검증
      if (!message || message.trim().length === 0) {
        console.error('Empty response from Gemini API');
        throw new Error('AI로부터 빈 응답을 받았습니다. 다시 시도해주세요.');
      }

      const tokens = this.estimateTokens(
        characterContext +
        request.messages.map(m => m.content).join('') +
        message
      );

      return {
        message: message.trim(),
        model,
        tokens,
      };
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      console.error('Error details:', {
        message: error?.message,
        status: error?.status,
        statusCode: error?.statusCode,
        statusText: error?.statusText,
        errorDetails: error?.errorDetails,
      });

      // 원본 에러 정보 추출 (API 라우트에서 자동 전환을 위해 필요)
      const originalMessage = error?.message || '';
      // GoogleGenerativeAI 에러는 status 속성에 있음
      const originalStatus = error?.status || error?.statusCode || '';

      // 사용자 친화적인 에러 메시지
      let errorMessage = '채팅 처리 중 오류가 발생했습니다.';

      if (error?.message?.includes('503') || error?.message?.includes('overloaded')) {
        errorMessage = '서버가 일시적으로 과부하 상태입니다. 잠시 후 다시 시도해주세요.';
      } else if (error?.message?.includes('429') || error?.message?.includes('rate limit') || error?.message?.includes('quota')) {
        // 할당량 초과 오류 - 특별한 에러 타입으로 표시하여 API 라우트에서 처리
        // API 라우트에서 자동 전환 로직 처리

        // 할당량 초과 오류 상세 처리
        const quotaMatch = error?.message?.match(/limit:\s*(\d+)/);
        const retryMatch = error?.message?.match(/retry in ([\d.]+)s/i);
        const modelMatch = error?.message?.match(/model:\s*([^\s,]+)/i);

        let quotaInfo = '';
        if (quotaMatch) {
          quotaInfo = ` (일일 ${quotaMatch[1]}회 제한)`;
        }

        let retryInfo = '';
        if (retryMatch) {
          const retrySeconds = Math.ceil(parseFloat(retryMatch[1]));
          const retryMinutes = Math.floor(retrySeconds / 60);
          const retrySecs = retrySeconds % 60;
          if (retryMinutes > 0) {
            retryInfo = ` 약 ${retryMinutes}분 ${retrySecs}초 후 재시도 가능합니다.`;
          } else {
            retryInfo = ` 약 ${retrySeconds}초 후 재시도 가능합니다.`;
          }
        }

        let modelInfo = '';
        if (modelMatch && modelMatch[1].includes('pro')) {
          modelInfo = ' Flash 모델로 전환하거나 잠시 후 다시 시도해주세요.';
        }

        if (error?.message?.includes('free_tier')) {
          errorMessage = `무료 티어 일일 할당량을 초과했습니다.${quotaInfo}${retryInfo}${modelInfo || ' 잠시 후 다시 시도해주세요.'}`;
        } else {
          errorMessage = `요청 한도에 도달했습니다.${quotaInfo}${retryInfo}${modelInfo || ' 잠시 후 다시 시도해주세요.'}`;
        }
      } else if (error?.message?.includes('400') || error?.message?.includes('401') || error?.message?.includes('API key not valid') || error?.message?.includes('API_KEY_INVALID')) {
        errorMessage = 'API 키가 유효하지 않습니다. 설정을 확인해주세요.';
      } else if (error?.message) {
        errorMessage = `오류: ${error.message}`;
      }

      // 원본 에러 정보를 포함한 에러 객체 생성 (API 라우트에서 자동 전환을 위해)
      const enhancedError: any = new Error(errorMessage);
      enhancedError.originalMessage = originalMessage;
      enhancedError.originalStatus = originalStatus;
      enhancedError.status = originalStatus;

      throw enhancedError;
    }
  }

  async summarize(prompt: string): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.5-flash', // 요약에는 빠른 flash 모델 사용
        generationConfig: {
          maxOutputTokens: 2048, // 요약을 위해 충분한 토큰 할당
          temperature: 0.7, // 창의성과 일관성의 균형
        }
      });

      console.log('📝 요약 요청 시작...');
      const result = await model.generateContent(prompt);
      const response = await result.response;

      // 응답 확인
      if (!response) {
        console.error('❌ 응답 객체가 없습니다');
        throw new Error('응답 객체가 없습니다');
      }

      const candidates = response.candidates;
      if (!candidates || candidates.length === 0) {
        console.error('❌ 응답 후보가 없습니다');
        const finishReason = response.candidates?.[0]?.finishReason;
        throw new Error(`응답 후보가 없습니다. Finish reason: ${finishReason || 'unknown'}`);
      }

      const candidate = candidates[0];
      if (candidate.finishReason !== 'STOP' && candidate.finishReason !== 'MAX_TOKENS') {
        console.warn(`⚠️ 비정상적인 종료 이유: ${candidate.finishReason}`);
      }

      // response.text()를 사용하는 것이 더 안전함 (chat 메서드와 동일한 방식)
      let summary: string;
      try {
        summary = response.text();
      } catch (textError) {
        // text() 메서드가 실패하면 parts를 직접 확인
        console.warn('response.text() 실패, parts 직접 확인 시도...');
        const parts = candidate.content?.parts;
        if (!parts || parts.length === 0) {
          console.error('❌ 응답 파트가 없습니다');
          console.error('Response structure:', JSON.stringify(response, null, 2));
          throw new Error('응답 파트가 없습니다');
        }
        summary = parts.map((part: any) => part.text || '').join('').trim();
      }

      if (!summary || summary.length === 0) {
        console.error('❌ 요약 텍스트가 비어있습니다');
        throw new Error('요약 생성 실패: 빈 응답');
      }

      console.log(`✅ 요약 완료 (길이: ${summary.length}자)`);
      return summary;
    } catch (error: any) {
      console.error('Summarize Error:', error);
      const errorMessage = error?.message || '알 수 없는 오류';
      throw new Error(`요약 생성 실패: ${errorMessage}`);
    }
  }

  private estimateTokens(text: string): number {
    // 대략적인 토큰 추정: 1 토큰 ≈ 4 문자 (영어 기준)
    // 한국어는 더 많은 토큰을 사용하므로 보수적으로 계산
    return Math.ceil(text.length / 3);
  }
}

// 싱글톤 인스턴스 생성 함수
let clientInstance: GeminiClient | null = null;

export function getGeminiClient(): GeminiClient {
  if (!clientInstance) {
    // 환경 변수에서 모든 API 키 가져오기
    const rawApiKeys = [
      process.env.GOOGLE_GEMINI_API_KEY,
      process.env.GOOGLE_GEMINI_API_KEY_1,
      process.env.GOOGLE_GEMINI_API_KEY_2,
      process.env.GOOGLE_GEMINI_API_KEY_3,
      process.env.GOOGLE_GEMINI_API_KEY_4,
      process.env.GOOGLE_GEMINI_API_KEY_5,
    ];

    // 중복 제거 및 유효한 키만 필터링
    const apiKeys = Array.from(new Set(rawApiKeys.filter(key => key && key.trim().length > 0))) as string[];

    if (apiKeys.length === 0) {
      throw new Error('사용 가능한 API 키가 없습니다. 환경 변수에 API 키를 설정해주세요.');
    }

    clientInstance = new GeminiClient(apiKeys);
  }
  return clientInstance;
}

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { TranslateRequest, TranslateResponse, GeminiConfig, ChatRequest, ChatResponse, ChatMessage } from './types';

export class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private defaultModel: 'gemini-flash' | 'gemini-pro';

  constructor(config: GeminiConfig) {
    if (!config.apiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY is required');
    }
    
    this.genAI = new GoogleGenerativeAI(config.apiKey);
    this.defaultModel = config.model || 'gemini-flash';
  }

  async translate(request: TranslateRequest): Promise<TranslateResponse> {
    const model = request.model || this.defaultModel;
    const geminiModel = this.genAI.getGenerativeModel({ 
      model: model === 'gemini-flash' ? 'gemini-2.5-flash' : 'gemini-2.5-pro' 
    });

    const systemPrompt = `You are a professional translator. Translate the following text from ${request.sourceLang} to ${request.targetLang}. 
    
Rules:
- Maintain the original meaning and tone
- Preserve proper nouns, numbers, and technical terms
- Keep formatting intact
- If uncertain about a term, mark it as [UNCLEAR]
- Provide only the translated text without any explanations or additional comments

Translate the following text:`;

    const prompt = `${systemPrompt}\n\n${request.text}`;

    try {
      const result = await geminiModel.generateContent(prompt);
      const response = await result.response;
      const translatedText = response.text();

      // 토큰 사용량 추정 (대략적인 계산)
      const tokens = this.estimateTokens(prompt + translatedText);

      return {
        translatedText: translatedText.trim(),
        model,
        tokens,
      };
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 재시도 헬퍼 함수
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        
        // 503 에러나 rate limit 에러인 경우에만 재시도
        const isRetryable = 
          error?.message?.includes('503') ||
          error?.message?.includes('overloaded') ||
          error?.message?.includes('rate limit') ||
          error?.message?.includes('429');

        if (!isRetryable || attempt === maxRetries - 1) {
          throw error;
        }

        // Exponential backoff: 1초, 2초, 4초
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`API 요청 실패 (시도 ${attempt + 1}/${maxRetries}). ${delay}ms 후 재시도...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError || new Error('재시도 실패');
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const model = request.model || this.defaultModel;
    
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
      
      characterContext += '\n\n자연스럽고 친근하게 대화하세요.';
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
      
      // 사용자 친화적인 에러 메시지
      let errorMessage = '채팅 처리 중 오류가 발생했습니다.';
      
      if (error?.message?.includes('503') || error?.message?.includes('overloaded')) {
        errorMessage = '서버가 일시적으로 과부하 상태입니다. 잠시 후 다시 시도해주세요.';
      } else if (error?.message?.includes('429') || error?.message?.includes('rate limit')) {
        errorMessage = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
      } else if (error?.message?.includes('401') || error?.message?.includes('API key')) {
        errorMessage = 'API 키가 유효하지 않습니다. 설정을 확인해주세요.';
      } else if (error?.message) {
        errorMessage = `오류: ${error.message}`;
      }
      
      throw new Error(errorMessage);
    }
  }

  async summarize(prompt: string): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash', // 요약에는 빠른 flash 모델 사용
        generationConfig: {
          maxOutputTokens: 500, // 요약은 간결하게
        }
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const summary = response.text();

      if (!summary || summary.trim().length === 0) {
        throw new Error('요약 생성 실패: 빈 응답');
      }

      return summary.trim();
    } catch (error: any) {
      console.error('Summarize Error:', error);
      throw new Error(`요약 생성 실패: ${error.message}`);
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
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY environment variable is not set');
    }
    clientInstance = new GeminiClient({ apiKey });
  }
  return clientInstance;
}

'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/chat/Sidebar';
import { ChatArea } from '@/components/chat/ChatArea';
import { SettingsSidebar } from '@/components/chat/SettingsSidebar';
import type { ChatMessage, Character } from '@/lib/gemini/types';
import { buildCharacterPrompt } from '@/lib/gemini/promptBuilder';
import { loadCharacters, initializeDefaultCharacters } from '@/lib/storage/characters';
import { loadSettings, type OutputSpeed, type MaxOutputTokens, type ThinkingBudget } from '@/lib/storage/settings';
import {
  loadChatHistories,
  saveChatHistory,
  deleteChatHistory,
  updateChatHistory,
  createNewChatHistory,
  generateChatTitle,
  type ChatHistory,
} from '@/lib/storage/chatHistory';

export default function ChatPage() {
  const [histories, setHistories] = useState<ChatHistory[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [currentHistory, setCurrentHistory] = useState<ChatHistory | null>(null);
  const [currentCharacter, setCurrentCharacter] = useState<Character | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [outputSpeed, setOutputSpeed] = useState<OutputSpeed>('instant');
  const [maxOutputTokens, setMaxOutputTokens] = useState<MaxOutputTokens>(8192);
  const [thinkingBudget, setThinkingBudget] = useState<ThinkingBudget>(undefined);

  // 초기 로드
  useEffect(() => {
    initializeDefaultCharacters();
    loadCharactersData();
    
    const settings = loadSettings();
    setOutputSpeed(settings.outputSpeed);
    setMaxOutputTokens(settings.maxOutputTokens);
    setThinkingBudget(settings.thinkingBudget);
    
    const loaded = loadChatHistories();
    setHistories(loaded);
    
    if (loaded.length > 0) {
      setCurrentHistory(loaded[0]);
    } else {
      const newChat = createNewChatHistory();
      setCurrentHistory(newChat);
    }
  }, []);

  // 페이지 포커스 시 캐릭터 목록 새로고침
  useEffect(() => {
    const handleFocus = () => {
      loadCharactersData();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const loadCharactersData = () => {
    try {
      const loaded = loadCharacters();
      setCharacters(loaded);
      
      // 현재 대화의 캐릭터 이름과 일치하는 캐릭터 찾기
      if (currentHistory && currentHistory.characterName) {
        const matched = loaded.find(c => c.name === currentHistory.characterName);
        if (matched) {
          setCurrentCharacter(matched);
        }
      }
    } catch (error) {
      console.error('Failed to load characters:', error);
    }
  };

  // 현재 대화 저장
  useEffect(() => {
    if (currentHistory && currentHistory.messages.length > 0) {
      saveChatHistory(currentHistory);
      setHistories(loadChatHistories());
    }
  }, [currentHistory]);

  // 새 대화 시작
  const handleNewChat = () => {
    const newChat = createNewChatHistory(
      currentHistory?.characterName || 'AI 친구',
      currentHistory?.characterPersonality || '친근하고 도움이 되는',
      currentHistory?.model || 'gemini-pro'
    );
    setCurrentHistory(newChat);
    setCurrentCharacter(null);
    saveChatHistory(newChat);
    setHistories(loadChatHistories());
  };

  // 대화 선택
  const handleSelectHistory = (id: string) => {
    const history = histories.find(h => h.id === id);
    if (history) {
      setCurrentHistory(history);
      // 선택한 대화의 캐릭터 찾기
      if (history.characterName) {
        const matched = characters.find(c => c.name === history.characterName);
        setCurrentCharacter(matched || null);
      }
    }
  };

  // 대화 삭제
  const handleDeleteHistory = (id: string) => {
    deleteChatHistory(id);
    const updated = loadChatHistories();
    setHistories(updated);
    
    if (currentHistory?.id === id) {
      if (updated.length > 0) {
        setCurrentHistory(updated[0]);
      } else {
        const newChat = createNewChatHistory();
        setCurrentHistory(newChat);
        setCurrentCharacter(null);
      }
    }
  };

  // 캐릭터 로드
  const handleLoadCharacter = (character: Character) => {
    if (currentHistory) {
      const characterPrompt = buildCharacterPrompt(character);
      const updated = {
        ...currentHistory,
        characterName: character.name,
        characterPersonality: characterPrompt,
      };
      setCurrentHistory(updated);
      setCurrentCharacter(character);
      
      // 즉시 저장
      saveChatHistory(updated);
      setHistories(loadChatHistories());
    }
  };

  // 컨텍스트 요약 함수
  const summarizeContext = async () => {
    if (!currentHistory) return;
    
    const MESSAGES_THRESHOLD = 20; // 10턴
    // 마지막 20개를 제외한 모든 메시지를 요약
    const messagesToSummarize = currentHistory.messages.slice(0, -MESSAGES_THRESHOLD);
    
    if (messagesToSummarize.length === 0) return;
    
    console.log(`📝 이전 대화 요약 중... (${messagesToSummarize.length}개 메시지)`);
    
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesToSummarize,
          existingSummary: currentHistory.contextSummary,
          characterName: currentHistory.characterName,
        }),
      });
      
      if (!response.ok) {
        throw new Error('요약 API 호출 실패');
      }
      
      const { summary } = await response.json();
      
      // 요약을 히스토리에 저장
      setCurrentHistory(prev => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          contextSummary: summary,
          lastSummaryAt: prev.messages.length,
        };
        // 즉시 localStorage에 저장
        saveChatHistory(updated);
        return updated;
      });
      
      console.log('✅ 컨텍스트 요약 완료:', summary.substring(0, 80) + '...');
    } catch (error) {
      console.error('요약 실패:', error);
      // 요약 실패 시에도 대화는 계속 진행
    }
  };

  // 메시지 전송 (최근 10턴만 전송)
  const handleSend = async () => {
    if (!input.trim() || isLoading || !currentHistory) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
    };

    const newMessages = [...currentHistory.messages, userMessage];
    
    // 10턴(20개 메시지)마다 자동 요약 트리거
    const TURNS_THRESHOLD = 10;
    const MESSAGES_THRESHOLD = TURNS_THRESHOLD * 2;
    
    const shouldSummarize = 
      newMessages.length > MESSAGES_THRESHOLD && 
      newMessages.length % MESSAGES_THRESHOLD === 0;
    
    if (shouldSummarize) {
      console.log(`🔄 ${newMessages.length / 2}턴 도달. 이전 대화 요약을 시작합니다...`);
      // 요약은 비동기로 실행 (대화는 계속 진행)
      summarizeContext().catch(err => console.error('요약 오류:', err));
    }
    
    // 최근 10턴(20개 메시지)만 API에 전송
    const MAX_TURNS = 10;
    const messagesToSend = newMessages.slice(-MAX_TURNS * 2);
    
    // 사용자 메시지 추가 (함수형 업데이트 사용)
    setCurrentHistory((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: newMessages,
        title: prev.messages.length === 0 
          ? generateChatTitle(newMessages)
          : prev.title,
      };
    });
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messagesToSend,
          contextSummary: currentHistory.contextSummary, // 이전 대화 요약 포함
          userNote: currentHistory.userNote, // 사용자 노트 포함
          characterName: currentHistory.characterName,
          characterPersonality: currentHistory.characterPersonality,
          model: currentHistory.model,
          maxOutputTokens: maxOutputTokens !== 8192 ? maxOutputTokens : undefined,
          thinkingBudget: thinkingBudget,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `서버 오류 (${response.status})`);
      }

      const data = await response.json();
      
      // 응답 구조 확인 및 디버깅
      if (!data) {
        console.error('Empty API response');
        throw new Error('서버로부터 응답을 받지 못했습니다.');
      }
      
      // 에러 응답 처리
      if (data.error) {
        console.error('API error response:', data.error);
        throw new Error(data.error);
      }
      
      // 성공 응답 확인
      if (!data.message) {
        console.error('Invalid API response structure:', data);
        throw new Error('응답 형식이 올바르지 않습니다.');
      }
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.message,
      };

      // 상태 업데이트: 함수형 업데이트 사용하여 최신 상태 보장
      setCurrentHistory((prev) => {
        if (!prev) return prev;
        // prev.messages에 이미 사용자 메시지가 포함되어 있으므로 assistant 메시지만 추가
        return {
          ...prev,
          messages: [...prev.messages, assistantMessage],
        };
      });
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: '죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.',
      };
      
      // 상태 업데이트: 함수형 업데이트 사용
      setCurrentHistory((prev) => {
        if (!prev) return prev;
        // prev.messages에 이미 사용자 메시지가 포함되어 있으므로 error 메시지만 추가
        return {
          ...prev,
          messages: [...prev.messages, errorMessage],
        };
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 설정 변경
  const handleCharacterNameChange = (name: string) => {
    if (currentHistory) {
      setCurrentHistory({ ...currentHistory, characterName: name });
      setCurrentCharacter(null);
    }
  };

  const handleCharacterPersonalityChange = (personality: string) => {
    if (currentHistory) {
      setCurrentHistory({ ...currentHistory, characterPersonality: personality });
    }
  };

  const handleModelChange = (model: 'gemini-flash' | 'gemini-pro') => {
    if (currentHistory) {
      setCurrentHistory({ ...currentHistory, model });
    }
  };

  const handleOutputSpeedChange = (speed: OutputSpeed) => {
    setOutputSpeed(speed);
  };

  const handleMaxOutputTokensChange = (tokens: MaxOutputTokens) => {
    setMaxOutputTokens(tokens);
  };

  const handleThinkingBudgetChange = (budget: ThinkingBudget) => {
    setThinkingBudget(budget);
  };

  const handleTitleChange = (title: string) => {
    if (currentHistory) {
      const updated = { ...currentHistory, title };
      setCurrentHistory(updated);
      updateChatHistory(currentHistory.id, { title });
      setHistories(loadChatHistories());
    }
  };

  const handleEditMessage = (messageIndex: number, newContent: string) => {
    if (!currentHistory) return;
    
    // 메시지 배열 복사
    const updatedMessages = [...currentHistory.messages];
    
    // 해당 메시지 내용 업데이트
    updatedMessages[messageIndex] = {
      ...updatedMessages[messageIndex],
      content: newContent,
    };
    
    // 히스토리 업데이트
    const updated = {
      ...currentHistory,
      messages: updatedMessages,
      updatedAt: Date.now(),
    };
    
    setCurrentHistory(updated);
    saveChatHistory(updated);
    
    console.log(`✏️ 메시지 ${messageIndex + 1} 수정 완료`);
  };

  const handleUserNoteChange = (note: string) => {
    if (!currentHistory) return;
    
    const updated = {
      ...currentHistory,
      userNote: note,
      updatedAt: Date.now(),
    };
    
    setCurrentHistory(updated);
    saveChatHistory(updated);
  };

  if (!currentHistory) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-[var(--text-secondary)]">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden">
      {/* 왼쪽 사이드바 */}
      <Sidebar
        histories={histories}
        characters={characters}
        currentHistoryId={currentHistory.id}
        currentCharacterId={currentCharacter?.id || null}
        onSelectHistory={handleSelectHistory}
        onNewChat={handleNewChat}
        onDeleteHistory={handleDeleteHistory}
        onLoadCharacter={handleLoadCharacter}
      />

      {/* 중앙 채팅 영역 */}
      <ChatArea
        title={currentHistory.title}
        messages={currentHistory.messages}
        input={input}
        isLoading={isLoading}
        characterName={currentHistory.characterName}
        outputSpeed={outputSpeed}
        onTitleChange={handleTitleChange}
        onInputChange={setInput}
        onSend={handleSend}
        onEditMessage={handleEditMessage}
      />

      {/* 오른쪽 설정 사이드바 */}
      <SettingsSidebar
        characterName={currentHistory.characterName}
        characterPersonality={currentHistory.characterPersonality}
        model={currentHistory.model}
        outputSpeed={outputSpeed}
        maxOutputTokens={maxOutputTokens}
        thinkingBudget={thinkingBudget}
        contextSummary={currentHistory.contextSummary}
        lastSummaryAt={currentHistory.lastSummaryAt}
        totalMessages={currentHistory.messages.length}
        userNote={currentHistory.userNote}
        onCharacterNameChange={handleCharacterNameChange}
        onCharacterPersonalityChange={handleCharacterPersonalityChange}
        onModelChange={handleModelChange}
        onOutputSpeedChange={handleOutputSpeedChange}
        onMaxOutputTokensChange={handleMaxOutputTokensChange}
        onThinkingBudgetChange={handleThinkingBudgetChange}
        onUserNoteChange={handleUserNoteChange}
      />
    </div>
  );
}

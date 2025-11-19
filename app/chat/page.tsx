'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Sidebar } from '@/components/chat/Sidebar';
import { ChatArea } from '@/components/chat/ChatArea';
import { SettingsSidebar } from '@/components/chat/SettingsSidebar';
import { MobileChatArea } from '@/components/chat/MobileChatArea';
import { MobileBottomNav } from '@/components/chat/MobileBottomNav';
import { MobileDrawer } from '@/components/chat/MobileDrawer';
import { MobileSettings } from '@/components/chat/MobileSettings';
import { MemoryModal } from '@/components/chat/MemoryModal';
import type { ChatMessage, Character } from '@/lib/gemini/types';
import { buildCharacterPrompt } from '@/lib/gemini/promptBuilder';
import { loadCharacters, initializeDefaultCharacters } from '@/lib/storage/characters';
import { loadSettings, saveSettings, type OutputSpeed, type MaxOutputTokens, type ThinkingBudget, type MaxActiveLorebooks, type UIStyle } from '@/lib/storage/settings';
import { loadLorebooks, detectKeywords } from '@/lib/storage/lorebook';
import {
  loadChatHistorySummaries,
  loadChatHistoryById,
  loadChatHistoryMessages,
  saveChatHistory,
  deleteChatHistory,
  updateChatHistory,
  createNewChatHistory,
  generateChatTitle,
  type ChatHistory,
  type ChatHistorySummary,
} from '@/lib/storage/chatHistory';

export default function ChatPage() {
  // 히스토리 목록은 메타데이터만 저장 (메모리 최적화)
  const [histories, setHistories] = useState<ChatHistorySummary[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  // 현재 선택된 히스토리만 전체 데이터 로드
  const [currentHistory, setCurrentHistory] = useState<ChatHistory | null>(null);
  // 메시지 로딩 상태 관리
  const [loadedMessageStartIndex, setLoadedMessageStartIndex] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [currentCharacter, setCurrentCharacter] = useState<Character | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [outputSpeed, setOutputSpeed] = useState<OutputSpeed>('instant');
  const [maxOutputTokens, setMaxOutputTokens] = useState<MaxOutputTokens>(8192);
  const [thinkingBudget, setThinkingBudget] = useState<ThinkingBudget>(undefined);
  const [maxActiveLorebooks, setMaxActiveLorebooks] = useState<MaxActiveLorebooks>(5);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [uiStyle, setUIStyle] = useState<UIStyle>('modern');
  const [isSettingsCollapsed, setIsSettingsCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem('settings_sidebar_collapsed');
    return saved === 'true';
  });
  const [settingsWidth, setSettingsWidth] = useState(() => {
    if (typeof window === 'undefined') return 384;
    const saved = localStorage.getItem('settings_sidebar_width');
    return saved ? parseInt(saved, 10) : 384;
  });

  // Mobile states
  const [mobileTab, setMobileTab] = useState<'chat' | 'characters' | 'history' | 'settings'>('chat');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [showMemoryModal, setShowMemoryModal] = useState(false);

  // 뷰포트 크기 감지를 위한 훅 추가
  const [isMobile, setIsMobile] = useState(false);

  // 뷰포트 크기 감지
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // 초기 감지
    checkIsMobile();

    // resize 이벤트 리스너 추가
    window.addEventListener('resize', checkIsMobile);

    // cleanup
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  // 초기 로드
  useEffect(() => {
    initializeDefaultCharacters();
    loadCharactersData();

    const settings = loadSettings();
    setOutputSpeed(settings.outputSpeed);
    setMaxOutputTokens(settings.maxOutputTokens);
    setThinkingBudget(settings.thinkingBudget);
    setMaxActiveLorebooks(settings.maxActiveLorebooks);
    setAutoScroll(settings.autoScroll);
    setUIStyle(settings.uiStyle);

    // API 키는 설정 UI에서 수동으로 추가하거나, 환경 변수로 관리
    // 보안을 위해 코드에 하드코딩하지 않음

    // 히스토리 목록은 메타데이터만 로드 (메모리 최적화)
    const loadedSummaries = loadChatHistorySummaries();
    setHistories(loadedSummaries);

    if (loadedSummaries.length > 0) {
      // 첫 번째 히스토리의 전체 데이터 로드
      const firstSummary = loadedSummaries[0];
      const fullHistory = loadChatHistoryById(firstSummary.id);

      if (fullHistory) {
        // 전체 히스토리 상태로 설정 (localStorage와 동기화)
        setCurrentHistory(fullHistory);

        // 로딩 상태 초기화
        const startIndex = Math.max(0, fullHistory.messages.length - 10);
        setLoadedMessageStartIndex(startIndex);
        setHasMoreMessages(startIndex > 0);
      } else {
        // fallback: summary만 사용
        const firstHistory: ChatHistory = {
          ...firstSummary,
          messages: firstSummary.recentMessages,
          contextSummary: undefined,
          lastSummaryAt: undefined,
          userNote: undefined,
        };
        setCurrentHistory(firstHistory);

        const startIndex = Math.max(0, firstSummary.messageCount - 10);
        setLoadedMessageStartIndex(startIndex);
        setHasMoreMessages(startIndex > 0);
      }
    } else {
      const newChat = createNewChatHistory();
      setCurrentHistory(newChat);
      setLoadedMessageStartIndex(0);
      setHasMoreMessages(false);
    }
  }, []);

  // UI 스타일 변경 시 body 클래스 업데이트
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const body = document.body;
    body.classList.remove('ui-modern', 'ui-classic');
    const className = uiStyle === 'classic' ? 'ui-classic' : 'ui-modern';
    body.classList.add(className);
  }, [uiStyle]);

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

  // 현재 대화 저장 (최적화: 목록만 업데이트, 디바운싱)
  useEffect(() => {
    if (!currentHistory || currentHistory.messages.length === 0) return;
    
    // 디바운싱: 500ms 후에 저장 (빠른 연속 업데이트 방지)
    const timeoutId = setTimeout(() => {
      saveChatHistory(currentHistory);
      // 히스토리 목록만 업데이트 (메타데이터만)
      const updatedSummaries = loadChatHistorySummaries();
      setHistories(updatedSummaries);
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [currentHistory?.id, currentHistory?.title, currentHistory?.updatedAt, currentHistory?.messages.length]);

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
    // 히스토리 목록만 업데이트 (메타데이터만)
    setHistories(loadChatHistorySummaries());
    // 로딩 상태 초기화
    setLoadedMessageStartIndex(0);
    setHasMoreMessages(false);
  };

  // 대화 선택 (localStorage와 완전히 동기화)
  const handleSelectHistory = (id: string) => {
    const summary = histories.find(h => h.id === id);

    if (summary) {
      // 전체 히스토리를 로드하여 userNote, contextSummary 등 포함
      const fullHistory = loadChatHistoryById(id);

      if (fullHistory) {
        // 전체 히스토리 상태로 설정 (localStorage와 동기화)
        setCurrentHistory(fullHistory);

        // 로딩 상태 초기화
        const startIndex = Math.max(0, fullHistory.messages.length - 10);
        setLoadedMessageStartIndex(startIndex);
        setHasMoreMessages(startIndex > 0);

        // 선택한 대화의 캐릭터 찾기
        if (fullHistory.characterName) {
          const matched = characters.find(c => c.name === fullHistory.characterName);
          setCurrentCharacter(matched || null);
        }
      } else {
        // fallback: summary만 사용 (이전 동작)
        const recentMessages = summary.recentMessages;
        const history: ChatHistory = {
          ...summary,
          messages: recentMessages,
          contextSummary: undefined,
          lastSummaryAt: undefined,
          userNote: undefined,
        };
        setCurrentHistory(history);

        const startIndex = Math.max(0, summary.messageCount - 10);
        setLoadedMessageStartIndex(startIndex);
        setHasMoreMessages(startIndex > 0);

        if (summary.characterName) {
          const matched = characters.find(c => c.name === summary.characterName);
          setCurrentCharacter(matched || null);
        }
      }
    }
  };

  // 대화 삭제
  const handleDeleteHistory = (id: string) => {
    deleteChatHistory(id);
    // 히스토리 목록만 업데이트 (메타데이터만)
    const updated = loadChatHistorySummaries();
    setHistories(updated);
    
    if (currentHistory?.id === id) {
      if (updated.length > 0) {
        // 삭제 후 첫 번째 히스토리의 전체 데이터 로드
        const firstSummary = updated[0];
        const fullHistory = loadChatHistoryById(firstSummary.id);

        if (fullHistory) {
          // 전체 히스토리 상태로 설정 (localStorage와 동기화)
          setCurrentHistory(fullHistory);

          // 로딩 상태 초기화
          const startIndex = Math.max(0, fullHistory.messages.length - 10);
          setLoadedMessageStartIndex(startIndex);
          setHasMoreMessages(startIndex > 0);
        } else {
          // fallback: summary만 사용
          const firstHistory: ChatHistory = {
            ...firstSummary,
            messages: firstSummary.recentMessages,
            contextSummary: undefined,
            lastSummaryAt: undefined,
            userNote: undefined,
          };
          setCurrentHistory(firstHistory);

          const startIndex = Math.max(0, firstSummary.messageCount - 10);
          setLoadedMessageStartIndex(startIndex);
          setHasMoreMessages(startIndex > 0);
        }
      } else {
        const newChat = createNewChatHistory();
        setCurrentHistory(newChat);
        setCurrentCharacter(null);
        setLoadedMessageStartIndex(0);
        setHasMoreMessages(false);
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
      // 히스토리 목록만 업데이트 (메타데이터만)
      setHistories(loadChatHistorySummaries());
    }
  };

  // 컨텍스트 요약 함수
  const summarizeContext = async () => {
    if (!currentHistory) return;
    
    // 전체 히스토리를 localStorage에서 가져오기
    const fullHistory = loadChatHistoryById(currentHistory.id);
    if (!fullHistory) return;
    
    const lastSummaryIndex = fullHistory.lastSummaryAt || 0;
    const totalMessages = fullHistory.messages.length;
    
    // 이미 요약된 부분 이후의 메시지만 가져오기 (새로 추가된 메시지만)
    const messagesToSummarize = fullHistory.messages.slice(lastSummaryIndex);
    
    if (messagesToSummarize.length === 0) {
      console.log('📝 요약할 새 메시지가 없습니다.');
      return;
    }
    
    console.log(`📝 이전 대화 요약 중... (${messagesToSummarize.length}개 메시지, 시작 인덱스: ${lastSummaryIndex}, 전체: ${totalMessages}개)`);
    
    try {
      // API 키 가져오기 (클라이언트에서 선택한 키)
      let apiKeyForSummary: string | undefined;
      if (typeof window !== 'undefined') {
        try {
          const { getSelectedApiKey } = require('@/lib/storage/apiKeys');
          apiKeyForSummary = getSelectedApiKey() || undefined;
        } catch {
          // 무시
        }
      }

      // 요약 API 호출 - 새 메시지만 요약
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesToSummarize, // 새 메시지만 요약
          existingSummary: fullHistory.contextSummary || undefined, // 기존 메모리와 병합
          characterName: fullHistory.characterName,
          userNote: fullHistory.userNote || undefined,
          apiKey: apiKeyForSummary,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || `요약 API 호출 실패: ${response.statusText}`);
        } catch (e) {
          throw new Error(errorText || `요약 API 호출 실패: ${response.statusText}`);
        }
      }

      const { summary } = await response.json();
      
      // 전체 히스토리를 업데이트하여 저장
      // lastSummaryAt을 현재 전체 메시지 개수로 업데이트 (모두 요약 완료)
      const updated = {
        ...fullHistory,
        contextSummary: summary,
        lastSummaryAt: totalMessages, // 지금까지의 모든 메시지가 요약됨
      };
      
      // 즉시 localStorage에 저장
      saveChatHistory(updated);
      
      // currentHistory도 업데이트 (메모리에는 최근 10개만 유지)
      setCurrentHistory(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          contextSummary: summary,
          lastSummaryAt: updated.lastSummaryAt,
        };
      });
      
      console.log('✅ 컨텍스트 요약 완료:', summary.substring(0, 80) + '...');
    } catch (error) {
      console.error('요약 실패:', error);
      // 요약 실패 시에도 대화는 계속 진행
    }
  };

  // 수동 요약 함수
  const handleManualSummarize = async () => {
    if (!currentHistory?.id || isLoading) {
      alert('대화가 없거나 처리 중입니다.');
      return;
    }

    // localStorage에 저장된 최신 전체 히스토리 가져오기
    const fullHistory = loadChatHistoryById(currentHistory.id);

    // currentHistory 상태가 최신 상태인지 확인하고 동기화
    if (fullHistory) {
      setCurrentHistory(fullHistory);
    }

    if (!fullHistory || fullHistory.messages.length === 0) {
      alert('요약할 대화가 없습니다.');
      return;
    }

    // confirm 먼저 확인 (모달 열기 전)
    if (!confirm(`지금까지의 대화 ${fullHistory.messages.length}개를 요약하시겠습니까?`)) {
      return;
    }

    setIsLoading(true);

    try {
      // API 키 가져오기 (클라이언트에서 선택한 키)
      let apiKeyForSummary: string | undefined;
      if (typeof window !== 'undefined') {
        try {
          const { getSelectedApiKey } = require('@/lib/storage/apiKeys');
          apiKeyForSummary = getSelectedApiKey() || undefined;
        } catch {
          // 무시
        }
      }

      // 전체 대화를 요약 (lastSummaryAt 무시)
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: fullHistory.messages, // 전체 메시지
          existingSummary: fullHistory.contextSummary || undefined, // 기존 메모리와 병합
          characterName: fullHistory.characterName,
          userNote: fullHistory.userNote || undefined,
          apiKey: apiKeyForSummary,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || `요약 API 호출 실패: ${response.statusText}`);
        } catch (e) {
          throw new Error(errorText || `요약 API 호출 실패: ${response.statusText}`);
        }
      }

      const { summary } = await response.json();

      // 전체 히스토리를 업데이트하여 저장
      const updated = {
        ...fullHistory,
        contextSummary: summary,
        lastSummaryAt: fullHistory.messages.length, // 전체 메시지 요약 완료
      };

      // 즉시 localStorage에 저장
      saveChatHistory(updated);

      // currentHistory도 업데이트
      setCurrentHistory(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          contextSummary: summary,
          lastSummaryAt: updated.lastSummaryAt,
        };
      });

      // 요약 완료 후 모달 자동으로 열기 (먼저 실행)
      setShowMemoryModal(true);

      // UI 업데이트가 완료될 시간을 주기 위해 약간 지연
      setTimeout(() => {
        alert('대화 요약이 완료되었습니다!');
      }, 100);

      console.log('✅ 수동 요약 완료:', summary.substring(0, 80) + '...');
    } catch (error) {
      console.error('수동 요약 실패:', error);
      alert(error instanceof Error ? error.message : '요약 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 메시지 전송 (최근 10턴만 전송)
  const handleSend = async () => {
    if (!input.trim() || isLoading || !currentHistory) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
    };

    // localStorage에서 전체 히스토리를 가져와서 전체 메시지 배열 생성
    const fullHistory = loadChatHistoryById(currentHistory.id);
    const allMessages = fullHistory 
      ? [...fullHistory.messages, userMessage]
      : [...currentHistory.messages, userMessage];
    
    const newMessages = allMessages;
    
    // 최근 10턴(20개 메시지)만 API에 전송
    const MAX_TURNS = 10;
    const messagesToSend = newMessages.slice(-MAX_TURNS * 2);
    
    // 로어북 키워드 감지
    const allLorebooks = loadLorebooks();
    const activeLorebooks = detectKeywords(messagesToSend, allLorebooks, maxActiveLorebooks);
    const activeLorebooksData = activeLorebooks.map(l => ({
      id: l.id,
      keywords: l.keywords,
      content: l.content,
    }));
    
    // 사용자 메시지 추가 (localStorage와 동기화)
    setCurrentHistory((prev) => {
      if (!prev) return prev;

      // localStorage에 전체 저장할 히스토리 (전체 메시지 포함)
      // fullHistory를 사용하여 userNote, contextSummary 등 모든 필드 포함
      const fullHistoryToSave: ChatHistory = {
        ...(fullHistory || prev), // fullHistory가 있으면 사용, 없으면 prev 사용
        messages: newMessages,
        title: prev.messages.length === 0
          ? generateChatTitle(newMessages)
          : prev.title,
        updatedAt: Date.now(),
      };

      // localStorage에 전체 저장
      saveChatHistory(fullHistoryToSave);

      // 메모리에는 최근 10개만 유지 (userNote 등은 유지)
      const recentMessages = newMessages.slice(-10);
      return {
        ...fullHistoryToSave,
        messages: recentMessages,
      };
    });
    
    // loadedMessageStartIndex 업데이트
    setLoadedMessageStartIndex((prev) => {
      const totalMessages = (currentHistory?.messages.length || 0) + 1;
      return Math.max(0, totalMessages - 10);
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
          activeLorebooks: activeLorebooksData.length > 0 ? activeLorebooksData : undefined,
          // 보안: 클라이언트에서 API 키를 직접 보내는 것은 권장하지 않음
          // 가능하면 서버 사이드에서 환경 변수로 관리하는 것을 권장
          // 개발/테스트 목적으로만 클라이언트 저장 방식 사용
          apiKey: (() => {
            if (typeof window !== 'undefined') {
              try {
                const { getSelectedApiKey } = require('@/lib/storage/apiKeys');
                const key = getSelectedApiKey();
                // 클라이언트에 키가 없으면 서버가 환경 변수 사용
                return key || undefined;
              } catch {
                return undefined;
              }
            }
            return undefined;
          })(),
          clientApiKeys: (() => {
            // 클라이언트에 저장된 모든 활성 API 키들을 서버로 전달
            if (typeof window !== 'undefined') {
              try {
                const { loadApiKeys } = require('@/lib/storage/apiKeys');
                const keys = loadApiKeys();
                console.log(`[Client] 로드된 API 키 개수: ${keys.length}`);
                keys.forEach((k: any, i: number) => {
                  console.log(`[Client] 키 ${i + 1}: ${k.name || 'Unnamed'} - Active: ${k.isActive}, QuotaExceeded: ${!!k.quotaExceeded}`);
                });
                
                // 활성화되고 할당량 초과되지 않은 키들만 반환
                const activeKeys = keys
                  .filter((k: any) => {
                    if (!k.isActive) {
                      console.log(`[Client] 키 "${k.name || 'Unnamed'}" 제외: 비활성화됨`);
                      return false;
                    }
                    if (k.quotaExceeded) {
                      const oneHour = 60 * 60 * 1000;
                      if (Date.now() - k.quotaExceeded < oneHour) {
                        console.log(`[Client] 키 "${k.name || 'Unnamed'}" 제외: 할당량 초과 (1시간 미경과)`);
                        return false; // 아직 1시간이 지나지 않음
                      }
                    }
                    return true;
                  })
                  .map((k: any) => k.key);
                
                console.log(`[Client] 전송할 활성 API 키 개수: ${activeKeys.length}`);
                return activeKeys.length > 0 ? activeKeys : undefined;
              } catch (error) {
                console.error('[Client] API 키 로드 실패:', error);
                return undefined;
              }
            }
            return undefined;
          })(),
        }),
      });

      if (!response.ok) {
        // 백엔드에서 API 키 자동 전환 로직을 처리하므로 프론트엔드에서는 단순히 오류 메시지를 표시
        if (response.status === 429) {
          throw new Error('API 할당량이 초과되었습니다. 잠시 후 다시 시도해주세요.');
        } else if (response.status === 403) {
          throw new Error('API 키 오류가 발생했습니다. 설정을 확인해주세요.');
        }
        
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || `서버 오류 (${response.status})`);
        } catch (e) {
          throw new Error(errorText || `서버 오류 (${response.status})`);
        }
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

      // 응답 메시지 추가 (localStorage와 동기화)
      setCurrentHistory((prev) => {
        if (!prev) return prev;

        // localStorage에서 전체 히스토리를 가져와서 전체 메시지 배열 생성
        const fullHistory = loadChatHistoryById(prev.id);
        const allMessages = fullHistory
          ? [...fullHistory.messages, assistantMessage]
          : [...prev.messages, assistantMessage];

        // localStorage에 전체 저장 (fullHistory를 사용하여 userNote 등 모든 필드 포함)
        const updatedHistory: ChatHistory = {
          ...(fullHistory || prev), // fullHistory가 있으면 사용, 없으면 prev 사용
          messages: allMessages,
          updatedAt: Date.now(),
        };
        saveChatHistory(updatedHistory);

        // 10턴(20개 메시지)마다 자동 요약 트리거
        // lastSummaryAt 기반으로 체크: 새로 추가된 메시지가 20개 이상이면 요약
        const lastSummaryAt = updatedHistory.lastSummaryAt || 0;
        const newMessagesCount = allMessages.length - lastSummaryAt;
        const MESSAGES_THRESHOLD = 20; // 10턴 = 20개 메시지

        if (newMessagesCount >= MESSAGES_THRESHOLD) {
          console.log(`🔄 ${newMessagesCount}개 메시지 추가됨 (10턴 도달). 이전 대화 요약을 시작합니다...`);
          // 요약은 비동기로 실행 (대화는 계속 진행)
          setTimeout(() => {
            summarizeContext().catch(err => console.error('요약 오류:', err));
          }, 0);
        }

        // 메모리에는 최근 10개만 유지 (userNote 등은 유지)
        const recentMessages = allMessages.slice(-10);
        return {
          ...updatedHistory,
          messages: recentMessages,
        };
      });
      
      // loadedMessageStartIndex 업데이트
      setLoadedMessageStartIndex((prev) => {
        const fullHistory = currentHistory ? loadChatHistoryById(currentHistory.id) : null;
        const totalMessages = fullHistory 
          ? fullHistory.messages.length + 1 // assistant 메시지 추가
          : (currentHistory?.messages.length || 0) + 1;
        return Math.max(0, totalMessages - 10);
      });
      
      // hasMoreMessages 업데이트
      setHasMoreMessages(() => {
        const fullHistory = currentHistory ? loadChatHistoryById(currentHistory.id) : null;
        const totalMessages = fullHistory 
          ? fullHistory.messages.length + 1
          : (currentHistory?.messages.length || 0) + 1;
        return totalMessages > 10;
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

  const handleMaxActiveLorebooksChange = (max: MaxActiveLorebooks) => {
    setMaxActiveLorebooks(max);
    const settings = loadSettings();
    saveSettings({ ...settings, maxActiveLorebooks: max });
  };

  // 이전 메시지 로드 함수 (메모리 최적화: 최대 50개 메시지만 메모리에 유지)
  const handleLoadPreviousMessages = useCallback(() => {
    if (!currentHistory || !hasMoreMessages) return;
    
    const MAX_MESSAGES_IN_MEMORY = 50;
    const currentMessageCount = currentHistory.messages.length;
    
    // 메모리에 너무 많은 메시지가 있으면 오래된 메시지 제거
    if (currentMessageCount >= MAX_MESSAGES_IN_MEMORY) {
      // 최근 40개 메시지만 유지하고 오래된 메시지 제거
      const messagesToKeep = currentHistory.messages.slice(-40);
      setCurrentHistory(prev => prev ? { ...prev, messages: messagesToKeep } : null);
      // 인덱스 조정
      const newStartIndex = Math.max(0, loadedMessageStartIndex - (currentMessageCount - 40));
      setLoadedMessageStartIndex(newStartIndex);
      setHasMoreMessages(newStartIndex > 0);
      return;
    }
    
    const previousStartIndex = Math.max(0, loadedMessageStartIndex - 10);
    const previousMessages = loadChatHistoryMessages(
      currentHistory.id,
      previousStartIndex,
      10
    );
    
    if (previousMessages.length > 0) {
      // 이전 메시지를 현재 메시지 앞에 추가
      setCurrentHistory((prev) => {
        if (!prev) return prev;
        const newMessages = [...previousMessages, ...prev.messages];
        
        // 메모리 제한 확인
        if (newMessages.length > MAX_MESSAGES_IN_MEMORY) {
          // 최근 50개만 유지
          return {
            ...prev,
            messages: newMessages.slice(-MAX_MESSAGES_IN_MEMORY),
          };
        }
        
        return {
          ...prev,
          messages: newMessages,
        };
      });
      
      setLoadedMessageStartIndex(previousStartIndex);
      setHasMoreMessages(previousStartIndex > 0);
    }
  }, [currentHistory, loadedMessageStartIndex, hasMoreMessages]);

  const handleTitleChange = (title: string) => {
    if (currentHistory) {
      const updated = { ...currentHistory, title };
      setCurrentHistory(updated);
      updateChatHistory(currentHistory.id, { title });
      // 히스토리 목록만 업데이트 (메타데이터만)
      setHistories(loadChatHistorySummaries());
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

  // 메시지 다시 생성 (re-roll)
  const handleRerollMessage = async (messageIndex: number) => {
    if (!currentHistory || isLoading) return;
    
    // 해당 메시지가 assistant 메시지인지 확인
    const targetMessage = currentHistory.messages[messageIndex];
    if (!targetMessage || targetMessage.role !== 'assistant') {
      console.warn('Re-roll은 assistant 메시지에만 사용할 수 있습니다.');
      return;
    }
    
    // 전체 히스토리를 가져와서 해당 메시지 이전까지의 메시지만 사용
    const fullHistory = loadChatHistoryById(currentHistory.id);
    const allMessages = fullHistory ? fullHistory.messages : currentHistory.messages;
    
    // 해당 메시지 이전까지의 메시지만 추출 (해당 메시지의 이전 user 메시지까지 포함)
    // messageIndex는 현재 메모리에 있는 인덱스이므로, 전체 히스토리에서 찾아야 함
    const messagesBeforeReroll = allMessages.slice(0, messageIndex);
    
    // 마지막 메시지가 user 메시지여야 함
    if (messagesBeforeReroll.length === 0 || messagesBeforeReroll[messagesBeforeReroll.length - 1].role !== 'user') {
      console.warn('Re-roll을 위해서는 해당 메시지 이전에 user 메시지가 있어야 합니다.');
      return;
    }
    
    // 최근 10턴(20개 메시지)만 API에 전송
    const MAX_TURNS = 10;
    const messagesToSend = messagesBeforeReroll.slice(-MAX_TURNS * 2);
    
    // 로어북 키워드 감지
    const allLorebooks = loadLorebooks();
    const activeLorebooks = detectKeywords(messagesToSend, allLorebooks, maxActiveLorebooks);
    const activeLorebooksData = activeLorebooks.map(l => ({
      id: l.id,
      keywords: l.keywords,
      content: l.content,
    }));
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messagesToSend,
          contextSummary: currentHistory.contextSummary,
          userNote: currentHistory.userNote,
          characterName: currentHistory.characterName,
          characterPersonality: currentHistory.characterPersonality,
          model: currentHistory.model,
          maxOutputTokens: maxOutputTokens !== 8192 ? maxOutputTokens : undefined,
          thinkingBudget: thinkingBudget,
          activeLorebooks: activeLorebooksData.length > 0 ? activeLorebooksData : undefined,
          apiKey: (() => {
            if (typeof window !== 'undefined') {
              try {
                const { getSelectedApiKey } = require('@/lib/storage/apiKeys');
                const key = getSelectedApiKey();
                return key || undefined;
              } catch {
                return undefined;
              }
            }
            return undefined;
          })(),
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `서버 오류 (${response.status})`;
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      if (!data || !data.message) {
        throw new Error('응답 형식이 올바르지 않습니다.');
      }
      
      const newAssistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.message,
      };
      
      // 전체 히스토리에서 해당 메시지를 새 응답으로 교체
      const updatedAllMessages = [...allMessages];
      updatedAllMessages[messageIndex] = newAssistantMessage;
      
      // 해당 메시지 이후의 메시지들은 제거 (re-roll하면 그 이후 대화는 무효)
      const finalMessages = updatedAllMessages.slice(0, messageIndex + 1);
      
      // localStorage에 전체 저장
      const updatedHistory: ChatHistory = {
        ...(fullHistory || currentHistory),
        messages: finalMessages,
        updatedAt: Date.now(),
      };
      saveChatHistory(updatedHistory);

      // 메모리에는 최근 10개만 유지
      const recentMessages = finalMessages.slice(-10);
      setCurrentHistory({
        ...updatedHistory,
        messages: recentMessages,
      });
      
      console.log(`🔄 메시지 ${messageIndex + 1} 다시 생성 완료`);
    } catch (error) {
      console.error('Re-roll error:', error);
      alert(error instanceof Error ? error.message : '메시지 다시 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
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

  const handleContextSummaryChange = (summary: string) => {
    if (!currentHistory) return;

    const updated = {
      ...currentHistory,
      contextSummary: summary,
      updatedAt: Date.now(),
    };

    // localStorage에 전체 저장
    saveChatHistory(updated);

    // 상태 업데이트 (함수형 업데이트 사용하여 경합 조건 방지)
    setCurrentHistory(prev => prev ? { ...prev, contextSummary: summary, updatedAt: Date.now() } : null);
  };

  // 사이드바 토글
  const handleToggleSettings = () => {
    const newState = !isSettingsCollapsed;
    setIsSettingsCollapsed(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('settings_sidebar_collapsed', String(newState));
    }
  };

  // 데이터 내보내기
  const handleExportData = () => {
    try {
      const chatHistories = localStorage.getItem('chat_histories');
      const chatSettings = localStorage.getItem('chat_settings');
      const characters = localStorage.getItem('characters');
      const lorebooks = localStorage.getItem('lorebooks');

      const exportData = {
        chat_histories: chatHistories ? JSON.parse(chatHistories) : [],
        chat_settings: chatSettings ? JSON.parse(chatSettings) : null,
        characters: characters ? JSON.parse(characters) : [],
        lorebooks: lorebooks ? JSON.parse(lorebooks) : [],
        exportDate: new Date().toISOString(),
        version: '1.1',
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ai-chat-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert('데이터 내보내기가 완료되었습니다!');
    } catch (error) {
      console.error('Export error:', error);
      alert('데이터 내보내기 중 오류가 발생했습니다.');
    }
  };

  // 데이터 가져오기
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleImportData = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importData = JSON.parse(event.target?.result as string);

        // 데이터 검증 및 가져오기
        if (importData.chat_histories && Array.isArray(importData.chat_histories)) {
          localStorage.setItem('chat_histories', JSON.stringify(importData.chat_histories));
        }

        if (importData.chat_settings) {
          localStorage.setItem('chat_settings', JSON.stringify(importData.chat_settings));
        }

        if (importData.characters && Array.isArray(importData.characters)) {
          localStorage.setItem('characters', JSON.stringify(importData.characters));
        }

        if (importData.lorebooks && Array.isArray(importData.lorebooks)) {
          localStorage.setItem('lorebooks', JSON.stringify(importData.lorebooks));
        }

        alert('데이터 가져오기가 완료되었습니다! 페이지를 새로고침합니다.');
        window.location.reload();
      } catch (error) {
        console.error('Import error:', error);
        alert('데이터 가져오기 중 오류가 발생했습니다. 파일 형식을 확인해주세요.');
      }
    };
    reader.readAsText(file);

    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 사이드바 리사이즈
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = settingsWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = startX - e.clientX; // 왼쪽으로 드래그하면 증가
      const newWidth = Math.max(300, Math.min(800, startWidth + diff)); // 최소 300px, 최대 800px
      setSettingsWidth(newWidth);
      if (typeof window !== 'undefined') {
        localStorage.setItem('settings_sidebar_width', String(newWidth));
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [settingsWidth]);

  // 메모리 모달용 안전한 값 계산
  const currentHistoryId = currentHistory?.id ?? null;
  const fullHistoryForMemory = currentHistoryId
    ? loadChatHistoryById(currentHistoryId)
    : null;

  const memoryContextSummary =
    fullHistoryForMemory?.contextSummary ?? currentHistory?.contextSummary;

  const memoryLastSummaryAt =
    fullHistoryForMemory?.lastSummaryAt ?? currentHistory?.lastSummaryAt;

  const memoryTotalMessages =
    fullHistoryForMemory?.messages.length ??
    currentHistory?.messages.length ??
    0;

  if (!currentHistory) {
    return (
      <>
        <div className="h-screen flex items-center justify-center bg-[var(--bg-primary)]">
          <div className="text-[var(--text-secondary)]">로딩 중...</div>
        </div>
        {/* 메모리 모달 - currentHistory가 없어도 렌더링 */}
        <MemoryModal
          isOpen={showMemoryModal}
          onClose={() => setShowMemoryModal(false)}
          contextSummary={undefined}
          lastSummaryAt={undefined}
          totalMessages={0}
        />
      </>
    );
  }

  return (
    <>
      {/* Desktop Layout */}
      <div className="h-screen flex overflow-hidden hide-mobile">
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
          autoScroll={autoScroll}
          onTitleChange={handleTitleChange}
          onInputChange={setInput}
          onSend={handleSend}
          onEditMessage={handleEditMessage}
          onRerollMessage={handleRerollMessage}
          onLoadPreviousMessages={handleLoadPreviousMessages}
          hasMoreMessages={hasMoreMessages}
        />

        {/* 오른쪽 설정 사이드바 */}
        <SettingsSidebar
          characterName={currentHistory.characterName}
          characterPersonality={currentHistory.characterPersonality}
          model={currentHistory.model}
          outputSpeed={outputSpeed}
          maxOutputTokens={maxOutputTokens}
          thinkingBudget={thinkingBudget}
          maxActiveLorebooks={maxActiveLorebooks}
          autoScroll={autoScroll}
          uiStyle={uiStyle}
          contextSummary={currentHistory.contextSummary}
          lastSummaryAt={currentHistory.lastSummaryAt}
          totalMessages={(() => {
            const fullHistory = loadChatHistoryById(currentHistory.id);
            return fullHistory?.messages.length || currentHistory.messages.length;
          })()}
          userNote={currentHistory.userNote}
          isCollapsed={isSettingsCollapsed}
          width={settingsWidth}
          onCharacterNameChange={handleCharacterNameChange}
          onCharacterPersonalityChange={handleCharacterPersonalityChange}
          onModelChange={handleModelChange}
          onOutputSpeedChange={handleOutputSpeedChange}
          onMaxOutputTokensChange={handleMaxOutputTokensChange}
          onThinkingBudgetChange={handleThinkingBudgetChange}
          onMaxActiveLorebooksChange={handleMaxActiveLorebooksChange}
          onAutoScrollChange={setAutoScroll}
          onUserNoteChange={handleUserNoteChange}
          onContextSummaryChange={handleContextSummaryChange}
          onUIStyleChange={setUIStyle}
          onManualSummarize={handleManualSummarize}
          onOpenMemoryModal={() => setShowMemoryModal(true)}
          onToggle={handleToggleSettings}
          onResizeStart={handleResizeStart}
        />
      </div>

      {/* 메모리 모달 - 독립적인 중앙 팝업 (항상 렌더링) */}
      <MemoryModal
        isOpen={showMemoryModal}
        onClose={() => setShowMemoryModal(false)}
        contextSummary={memoryContextSummary}
        lastSummaryAt={memoryLastSummaryAt}
        totalMessages={memoryTotalMessages}
      />

      {/* Mobile Layout */}
      <div className="hide-desktop">
        {mobileTab === 'chat' && (
          <MobileChatArea
            title={currentHistory.title}
            messages={currentHistory.messages}
            input={input}
            isLoading={isLoading}
            characterName={currentHistory.characterName}
            outputSpeed={outputSpeed}
            autoScroll={autoScroll}
            onTitleChange={handleTitleChange}
            onInputChange={setInput}
            onSend={handleSend}
            onEditMessage={handleEditMessage}
            onRerollMessage={handleRerollMessage}
            onLoadPreviousMessages={handleLoadPreviousMessages}
            hasMoreMessages={hasMoreMessages}
            onMenuOpen={() => {
              // 메뉴 버튼 클릭 시 캐릭터 탭으로 이동하여 Drawer 열기
              setMobileTab('characters');
              setMobileDrawerOpen(true);
            }}
          />
        )}

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav
          activeTab={mobileTab}
          onTabChange={(tab) => {
            setMobileTab(tab);
            if (tab !== 'chat') {
              setMobileDrawerOpen(true);
            }
          }}
        />

        {/* Mobile Drawer for Characters/History/Settings */}
        <MobileDrawer
          isOpen={mobileDrawerOpen || mobileTab !== 'chat'}
          onClose={() => {
            setMobileDrawerOpen(false);
            setMobileTab('chat');
          }}
          title={
            mobileTab === 'characters' ? '캐릭터' :
            mobileTab === 'history' ? '대화 기록' :
            mobileTab === 'settings' ? '설정' : '메뉴'
          }
        >
          {mobileTab === 'characters' && (
            <div className="p-5 space-y-3">
              {characters.map((character) => (
                <button
                  key={character.id}
                  onClick={() => {
                    handleLoadCharacter(character);
                    setMobileDrawerOpen(false);
                    setMobileTab('chat');
                  }}
                  className={`w-full text-left px-5 py-4 rounded-xl text-sm font-medium transition-all duration-300 ${
                    character.id === currentCharacter?.id
                      ? 'bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white shadow-md'
                      : 'glass-card hover:border-[var(--border-hover)]'
                  }`}
                >
                  <div className="font-semibold mb-1">{character.name}</div>
                  <div className={`text-xs ${character.id === currentCharacter?.id ? 'opacity-90' : 'text-[var(--text-tertiary)]'}`}>
                    {character.personality.slice(0, 50)}...
                  </div>
                </button>
              ))}
            </div>
          )}

          {mobileTab === 'history' && (
            <div className="p-5 space-y-3">
              <button
                onClick={() => {
                  handleNewChat();
                  setMobileDrawerOpen(false);
                  setMobileTab('chat');
                }}
                className="w-full px-5 py-3 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white rounded-xl text-sm font-semibold shadow-md"
              >
                + 새 대화
              </button>
              {histories.map((history) => (
                <button
                  key={history.id}
                  onClick={() => {
                    handleSelectHistory(history.id);
                    setMobileDrawerOpen(false);
                    setMobileTab('chat');
                  }}
                  className={`w-full text-left px-5 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                    history.id === currentHistory.id
                      ? 'glass-card border-[var(--accent-primary)] bg-[var(--bg-glass-hover)]'
                      : 'glass-card hover:border-[var(--border-hover)]'
                    }`}
                >
                  {history.title}
                </button>
              ))}
            </div>
          )}

          {mobileTab === 'settings' && (
            <>
              <MobileSettings
                model={currentHistory.model}
                outputSpeed={outputSpeed}
                maxOutputTokens={maxOutputTokens}
                thinkingBudget={thinkingBudget}
                uiStyle={uiStyle}
                onModelChange={handleModelChange}
                onOutputSpeedChange={handleOutputSpeedChange}
                onMaxOutputTokensChange={handleMaxOutputTokensChange}
                onThinkingBudgetChange={handleThinkingBudgetChange}
                onUIStyleChange={setUIStyle}
                onExportData={handleExportData}
                onImportData={handleImportData}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </>
          )}
        </MobileDrawer>
      </div>
    </>
  );
}

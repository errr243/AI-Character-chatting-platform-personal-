'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bot, PenSquare, SlidersHorizontal, Zap, MessageSquare, Brain, BookOpen, ChevronRight, FileText, Download, Upload, Key, Plus, Trash2, Check, ChevronLeft, GripVertical, ArrowDown, Sparkles } from 'lucide-react';
import { loadSettings, saveSettings, updateSettings, type OutputSpeed, type MaxOutputTokens, type ThinkingBudget, type MaxActiveLorebooks, type UIStyle } from '@/lib/storage/settings';
import { MemoryModal } from './MemoryModal';
import { loadApiKeys, addApiKey, deleteApiKey, updateApiKey, getActiveApiKey, setSelectedApiKeyId, getSelectedApiKeyId, type ApiKeyInfo } from '@/lib/storage/apiKeys';
import { LorebookManager } from './LorebookManager';

interface SettingsSidebarProps {
  characterName: string;
  characterPersonality: string;
  model: 'gemini-flash' | 'gemini-pro';
  outputSpeed: OutputSpeed;
  maxOutputTokens: MaxOutputTokens;
  thinkingBudget: ThinkingBudget;
  maxActiveLorebooks: MaxActiveLorebooks;
  autoScroll: boolean;
  uiStyle: UIStyle;
  contextSummary?: string;
  lastSummaryAt?: number;
  totalMessages: number;
  userNote?: string;
  isCollapsed?: boolean;
  width?: number;
  onCharacterNameChange: (name: string) => void;
  onCharacterPersonalityChange: (personality: string) => void;
  onModelChange: (model: 'gemini-flash' | 'gemini-pro') => void;
  onOutputSpeedChange: (speed: OutputSpeed) => void;
  onMaxOutputTokensChange: (tokens: MaxOutputTokens) => void;
  onThinkingBudgetChange: (budget: ThinkingBudget) => void;
  onMaxActiveLorebooksChange: (max: MaxActiveLorebooks) => void;
  onAutoScrollChange: (enabled: boolean) => void;
  onUserNoteChange: (note: string) => void;
  onUIStyleChange: (style: UIStyle) => void;
  onToggle?: () => void;
  onResizeStart?: (e: React.MouseEvent) => void;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  characterName,
  characterPersonality,
  model,
  outputSpeed,
  maxOutputTokens,
  thinkingBudget,
  maxActiveLorebooks,
  autoScroll,
  uiStyle,
  contextSummary,
  lastSummaryAt,
  totalMessages,
  userNote,
  isCollapsed = false,
  width = 384,
  onCharacterNameChange,
  onCharacterPersonalityChange,
  onModelChange,
  onOutputSpeedChange,
  onMaxOutputTokensChange,
  onThinkingBudgetChange,
  onMaxActiveLorebooksChange,
  onAutoScrollChange,
  onUserNoteChange,
  onUIStyleChange,
  onToggle,
  onResizeStart,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
      // API 키 관리 상태
      const [apiKeys, setApiKeys] = useState<ApiKeyInfo[]>([]);
      const [showAddKey, setShowAddKey] = useState(false);
      const [newKeyName, setNewKeyName] = useState('');
      const [newKeyValue, setNewKeyValue] = useState('');
      const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);

      useEffect(() => {
        const settings = loadSettings();
        onOutputSpeedChange(settings.outputSpeed);
        onMaxOutputTokensChange(settings.maxOutputTokens);
        onThinkingBudgetChange(settings.thinkingBudget);
        onMaxActiveLorebooksChange(settings.maxActiveLorebooks);
        onAutoScrollChange(settings.autoScroll);
        
        // API 키 목록 로드
        const keys = loadApiKeys();
        setApiKeys(keys);
        
        // 선택된 키 ID 로드
        const selectedId = getSelectedApiKeyId();
        if (selectedId && keys.find(k => k.id === selectedId)) {
          setSelectedKeyId(selectedId);
        } else if (keys.length > 0) {
          // 선택된 키가 없거나 유효하지 않으면 첫 번째 활성 키 선택
          const firstActiveKey = keys.find(k => k.isActive);
          if (firstActiveKey) {
            setSelectedKeyId(firstActiveKey.id);
            setSelectedApiKeyId(firstActiveKey.id);
          }
        }
      }, []);

  const handleOutputSpeedChange = (speed: OutputSpeed) => {
    onOutputSpeedChange(speed);
    updateSettings({ outputSpeed: speed });
  };

  const handleMaxOutputTokensChange = (tokens: MaxOutputTokens) => {
    onMaxOutputTokensChange(tokens);
    updateSettings({ maxOutputTokens: tokens });
  };

  const handleThinkingBudgetChange = (budget: ThinkingBudget) => {
    onThinkingBudgetChange(budget);
    updateSettings({ thinkingBudget: budget });
  };

  const handleAutoScrollChange = (enabled: boolean) => {
    onAutoScrollChange(enabled);
    updateSettings({ autoScroll: enabled });
  };

  const handleUIStyleChangeInternal = (style: UIStyle) => {
    onUIStyleChange(style);
    updateSettings({ uiStyle: style });
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

  // API 키 추가
  const handleAddApiKey = () => {
    if (!newKeyName.trim() || !newKeyValue.trim()) {
      alert('이름과 API 키를 모두 입력해주세요.');
      return;
    }
    
    const newKey = addApiKey(newKeyValue.trim(), newKeyName.trim());
    const keys = loadApiKeys();
    setApiKeys(keys);
    
    // 새로 추가된 키를 자동으로 선택
    setSelectedKeyId(newKey.id);
    setSelectedApiKeyId(newKey.id);
    
    setNewKeyName('');
    setNewKeyValue('');
    setShowAddKey(false);
    alert('API 키가 추가되었고 선택되었습니다.');
  };

  // API 키 삭제
  const handleDeleteApiKey = (id: string) => {
    if (confirm('이 API 키를 삭제하시겠습니까?')) {
      const wasSelected = selectedKeyId === id;
      deleteApiKey(id);
      const keys = loadApiKeys();
      setApiKeys(keys);
      
      // 삭제된 키가 선택된 키였다면 다른 키 선택
      if (wasSelected) {
        const firstActiveKey = keys.find(k => k.isActive);
        if (firstActiveKey) {
          setSelectedKeyId(firstActiveKey.id);
          setSelectedApiKeyId(firstActiveKey.id);
        } else {
          setSelectedKeyId(null);
          setSelectedApiKeyId(null);
        }
      }
    }
  };

  // API 키 활성화/비활성화
  const handleToggleApiKey = (id: string, isActive: boolean) => {
    updateApiKey(id, { isActive: !isActive });
    setApiKeys(loadApiKeys());
  };

  // API 키 수동 선택
  const handleSelectApiKey = (keyId: string) => {
    setSelectedKeyId(keyId);
    setSelectedApiKeyId(keyId);
    alert('API 키가 변경되었습니다.');
  };

  return (
    <div
      className="backdrop-blur-xl bg-[var(--bg-glass)] border-l border-[var(--border-color)] flex flex-col h-full overflow-hidden relative"
      style={{ width: isCollapsed ? '56px' : `${width}px`, transition: isCollapsed ? 'width 0.2s' : 'none' }}
    >
      {/* Modern Resize Handle */}
      {!isCollapsed && onResizeStart && (
        <div
          onMouseDown={onResizeStart}
          className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[var(--accent-primary)] transition-colors z-10"
          style={{ cursor: 'col-resize' }}
        >
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 hover:opacity-100 transition-opacity">
            <GripVertical size={16} className="text-[var(--text-tertiary)]" />
          </div>
        </div>
      )}

      {/* Modern Toggle Button */}
      <div className="flex items-center justify-between p-5 border-b border-[var(--border-color)]">
        {!isCollapsed && <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight" style={{ letterSpacing: '-0.02em' }}>설정</h2>}
        {onToggle && (
          <button
            onClick={onToggle}
            className="p-2 hover:bg-[var(--bg-glass)] rounded-lg transition-all duration-300 hover:-translate-x-0.5"
            title={isCollapsed ? '펼치기' : '접기'}
          >
            {isCollapsed ? <ChevronLeft size={20} className="text-[var(--text-secondary)]" /> : <ChevronRight size={20} className="text-[var(--text-secondary)]" />}
          </button>
        )}
      </div>

      <div className={`flex-1 overflow-y-auto ${isCollapsed ? 'p-3' : 'p-5'}`}>
        {isCollapsed ? (
          <div className="space-y-3">
            {/* Modern Icon Buttons */}
            <button
              onClick={() => onModelChange(model === 'gemini-pro' ? 'gemini-flash' : 'gemini-pro')}
              className="w-full p-2.5 hover:bg-[var(--bg-glass)] rounded-xl transition-all duration-300 hover:scale-110"
              title={`모델: ${model === 'gemini-pro' ? 'Gemini 2.5 Pro' : 'Gemini 2.5 Flash'}`}
            >
              <Bot size={20} className="text-[var(--text-secondary)] mx-auto" />
            </button>
            <button
              onClick={() => setShowMemoryModal(true)}
              className="w-full p-2.5 hover:bg-[var(--bg-glass)] rounded-xl transition-all duration-300 hover:scale-110 relative"
              title="대화 메모리"
            >
              <BookOpen size={20} className="text-[var(--text-secondary)] mx-auto" />
              {contextSummary && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-pulse" style={{ boxShadow: '0 0 8px var(--accent-glow)' }} />
              )}
            </button>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full p-2.5 hover:bg-[var(--bg-glass)] rounded-xl transition-all duration-300 hover:scale-110"
              title="고급 설정"
            >
              <SlidersHorizontal size={20} className="text-[var(--text-secondary)] mx-auto" />
            </button>
          </div>
        ) : (
          <>
        {/* 모델 선택 */}
        <div>
          <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2 flex items-center gap-2">
            <Bot size={16} />
            모델
          </label>
          <select
            value={model}
            onChange={(e) => onModelChange(e.target.value as 'gemini-flash' | 'gemini-pro')}
            className="w-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent-blue)]"
          >
            <option value="gemini-pro">Gemini 2.5 Pro</option>
            <option value="gemini-flash">Gemini 2.5 Flash</option>
          </select>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            {model === 'gemini-pro' 
              ? 'Pro: 더 강력하고 정확한 응답 (추천)' 
              : 'Flash: 빠른 응답 속도'}
          </p>
        </div>

        {/* 출력 속도 */}
        <div>
          <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2 flex items-center gap-2">
            <Zap size={16} />
            출력 속도
          </label>
          <select
            value={outputSpeed}
            onChange={(e) => handleOutputSpeedChange(e.target.value as OutputSpeed)}
            className="w-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent-blue)]"
          >
            <option value="instant">즉시 표시</option>
            <option value="fast">빠름</option>
            <option value="medium">보통</option>
            <option value="slow">느림</option>
          </select>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            {outputSpeed === 'instant' && '응답을 즉시 표시합니다'}
            {outputSpeed === 'fast' && '타이핑 효과 (빠름)'}
            {outputSpeed === 'medium' && '타이핑 효과 (보통)'}
            {outputSpeed === 'slow' && '타이핑 효과 (느림)'}
          </p>
        </div>

        {/* UI 스타일 토글 (신규 / 구형) */}
        <div>
          <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2 flex items-center gap-2">
            <Sparkles size={16} />
            UI 스타일
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleUIStyleChangeInternal('modern')}
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all duration-200 ${
                uiStyle === 'modern'
                  ? 'bg-[var(--accent-primary)]/90 text-white border-transparent shadow-sm'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--border-hover)]'
              }`}
            >
              신규 UI
            </button>
            <button
              type="button"
              onClick={() => handleUIStyleChangeInternal('classic')}
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all duration-200 ${
                uiStyle === 'classic'
                  ? 'bg-[var(--accent-primary)]/90 text-white border-transparent shadow-sm'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--border-hover)]'
              }`}
            >
              구형 UI
            </button>
          </div>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            버튼 모양과 카드 스타일을 기존 디자인 / 신규 디자인으로 전환합니다.
          </p>
        </div>

        {/* 자동 스크롤 */}
        <div>
          <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2 flex items-center gap-2">
            <ArrowDown size={16} />
            자동 스크롤
          </label>
          <div className="flex items-center justify-between p-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md">
            <span className="text-sm text-[var(--text-primary)]">
              {autoScroll ? '활성화됨' : '비활성화됨'}
            </span>
            <button
              onClick={() => handleAutoScrollChange(!autoScroll)}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                autoScroll ? 'bg-[var(--accent-blue)]' : 'bg-[var(--bg-primary)] border border-[var(--border-color)]'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
                  autoScroll ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            {autoScroll ? '새 메시지가 추가될 때 자동으로 맨 아래로 스크롤합니다' : '자동 스크롤이 비활성화되어 있습니다'}
          </p>
        </div>

        {/* 최대 응답 길이 */}
        <div>
          <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2 flex items-center gap-2">
            <MessageSquare size={16} />
            최대 응답 길이
          </label>
          <select
            value={maxOutputTokens}
            onChange={(e) => handleMaxOutputTokensChange(Number(e.target.value) as MaxOutputTokens)}
            className="w-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent-blue)]"
          >
            <option value={256}>매우 짧음 (256 토큰) - 간결한 답변</option>
            <option value={512}>짧음 (512 토큰) - 간단한 답변</option>
            <option value={1024}>보통 (1024 토큰) - 일반적인 답변</option>
            <option value={2048}>길게 (2048 토큰) - 상세한 답변</option>
            <option value={4096}>매우 길게 (4096 토큰) - 아주 상세한 답변</option>
            <option value={6144}>극도로 길게 (6144 토큰) - 심층 분석</option>
            <option value={8192}>제한 없음 (8192 토큰)</option>
          </select>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            {maxOutputTokens === 256 && '1-2문장으로 매우 간결하게 답변합니다'}
            {maxOutputTokens === 512 && '짧은 단락으로 답변합니다'}
            {maxOutputTokens === 1024 && '일반적인 길이로 답변합니다'}
            {maxOutputTokens === 2048 && '상세하고 길게 답변합니다'}
            {maxOutputTokens === 4096 && '매우 상세하고 심층적으로 답변합니다'}
            {maxOutputTokens === 6144 && '극도로 상세하게, 예시와 설명을 충분히 포함하여 답변합니다'}
            {maxOutputTokens === 8192 && '응답 길이 제한이 없습니다'}
          </p>
        </div>

        {/* Thinking Budget (Pro 모델만) */}
        {model === 'gemini-pro' && (
          <div>
            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2 flex items-center gap-2">
              <Brain size={16} />
              Thinking Budget
            </label>
            <select
              value={thinkingBudget === undefined ? 'undefined' : thinkingBudget}
              onChange={(e) => {
                const value = e.target.value;
                if (value === 'undefined') {
                  handleThinkingBudgetChange(undefined);
                } else if (value === '-1') {
                  handleThinkingBudgetChange(-1 as ThinkingBudget);
                } else {
                  handleThinkingBudgetChange(Number(value) as ThinkingBudget);
                }
              }}
              className="w-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent-blue)]"
            >
              <option value={128}>최소 (128 토큰) - 빠른 응답</option>
              <option value={512}>낮음 (512 토큰) - 가볍게 생각</option>
              <option value={1024}>보통 (1024 토큰) - 균형잡힌 사고 (권장)</option>
              <option value={2048}>높음 (2048 토큰) - 깊은 사고</option>
              <option value={32768}>최대 (32768 토큰) - 복잡한 문제</option>
              <option value="-1">동적 (-1) - 자동 조절</option>
            </select>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              {thinkingBudget === 128 && '최소한의 사고로 빠르게 응답합니다'}
              {thinkingBudget === 512 && '가볍게 생각하며 적절한 속도로 응답합니다'}
              {thinkingBudget === 1024 && '사고 품질과 응답 속도의 균형을 맞춥니다 (권장)'}
              {thinkingBudget === 2048 && '깊이 생각하여 상세한 답변을 제공합니다'}
              {thinkingBudget === 32768 && '매우 복잡한 문제를 심층적으로 분석합니다 (느림)'}
              {thinkingBudget === -1 && '요청 복잡도에 따라 AI가 자동으로 사고 수준을 결정합니다'}
              {thinkingBudget === undefined && 'API 기본값을 사용합니다'}
            </p>
          </div>
        )}

        {/* 캐릭터 이름 */}
        <div>
          <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2 flex items-center gap-2">
            <PenSquare size={16} />
            캐릭터 이름
          </label>
          <input
            type="text"
            value={characterName}
            onChange={(e) => onCharacterNameChange(e.target.value)}
            placeholder="예: 루나, 아로나 등"
            className="w-full"
          />
        </div>

        {/* 시스템 프롬프트 */}
        <div>
          <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
            시스템 프롬프트 (캐릭터 설정)
          </label>
          <textarea
            value={characterPersonality}
            onChange={(e) => onCharacterPersonalityChange(e.target.value)}
            placeholder="캐릭터의 성격, 배경, 행동 패턴 등을 자세히 입력하세요.&#10;&#10;긴 컨텍스트를 입력할 수 있습니다. (최대 100만 토큰)"
            rows={15}
            className="w-full resize-y font-mono text-xs"
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-[var(--text-tertiary)]">
              긴 설정 지원 (100만 토큰)
            </p>
            <p className="text-xs text-[var(--text-tertiary)]">
              {characterPersonality.length.toLocaleString()}자
            </p>
          </div>
        </div>

        {/* 유저노트 */}
        <div className="border-t border-[var(--border-color)] pt-4">
          <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2 flex items-center gap-2">
            <FileText size={16} />
            유저노트
          </label>
          <textarea
            value={userNote || ''}
            onChange={(e) => onUserNoteChange(e.target.value)}
            placeholder="상황에 따라 자신만의 세계관 설정을 작성하세요.&#10;예: 현재 상황, 배경 설정, 특별한 규칙 등&#10;&#10;이 내용은 AI가 대화 시 참고합니다."
            rows={8}
            className="w-full resize-y font-mono text-xs bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-[var(--text-tertiary)]">
              사용자가 직접 작성하는 세계관/상황 설정
            </p>
            <p className="text-xs text-[var(--text-tertiary)]">
              {(userNote?.length || 0).toLocaleString()}자
            </p>
          </div>
        </div>

        {/* 대화 메모리 */}
        <div className="border-t border-[var(--border-color)] pt-4">
          <button
            onClick={() => setShowMemoryModal(true)}
            className="w-full flex items-center justify-between text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-2 rounded hover:bg-[var(--bg-tertiary)]"
          >
            <span className="flex items-center gap-2">
              <BookOpen size={16} />
              대화 메모리
              {contextSummary && (
                <span className="text-xs bg-[var(--accent-blue)] text-white px-1.5 py-0.5 rounded">
                  있음
                </span>
              )}
            </span>
            <ChevronRight size={16} />
          </button>
          {!contextSummary && (
            <p className="text-xs text-[var(--text-tertiary)] mt-2 px-2">
              10턴(20개 메시지)마다 자동 생성됩니다
            </p>
          )}
        </div>

        {/* 로어북 */}
        <div className="border-t border-[var(--border-color)] pt-4">
          <LorebookManager
            maxActive={maxActiveLorebooks}
            onMaxActiveChange={(max) => {
              onMaxActiveLorebooksChange(max);
              const settings = loadSettings();
              saveSettings({ ...settings, maxActiveLorebooks: max });
            }}
          />
        </div>

        {/* API 키 관리 */}
        <div className="border-t border-[var(--border-color)] pt-4">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-semibold text-[var(--text-secondary)]">
              API 키 관리
            </label>
            <button
              onClick={() => setShowAddKey(!showAddKey)}
              className="p-1 hover:bg-[var(--bg-hover)] rounded transition-colors"
              title="API 키 추가"
            >
              <Plus size={16} className="text-[var(--text-secondary)]" />
            </button>
          </div>
          
          {/* API 키 수동 선택 드롭다운 */}
          {apiKeys.length > 0 && (
            <div className="mb-3">
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                사용할 API 키 선택
              </label>
              <select
                value={selectedKeyId || ''}
                onChange={(e) => {
                  if (e.target.value) {
                    handleSelectApiKey(e.target.value);
                  }
                }}
                className="w-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent-blue)]"
              >
                {apiKeys
                  .filter(k => k.isActive)
                  .map((key) => (
                    <option key={key.id} value={key.id}>
                      {key.name}
                      {key.quotaExceeded ? ' (할당량 초과)' : ''}
                    </option>
                  ))}
              </select>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                현재 선택된 키가 모든 요청에 사용됩니다
              </p>
            </div>
          )}
          
          {/* API 키 추가 폼 */}
          {showAddKey && (
            <div className="mb-3 p-3 bg-[var(--bg-tertiary)] rounded-md space-y-2">
              <input
                type="text"
                placeholder="API 키 이름 (예: 키 1, 키 2)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-md text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
              />
              <input
                type="password"
                placeholder="Gemini API 키"
                value={newKeyValue}
                onChange={(e) => setNewKeyValue(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-md text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddApiKey}
                  className="flex-1 px-3 py-1.5 bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-hover)] text-white rounded-md text-sm transition-colors"
                >
                  추가
                </button>
                <button
                  onClick={() => {
                    setShowAddKey(false);
                    setNewKeyName('');
                    setNewKeyValue('');
                  }}
                  className="px-3 py-1.5 bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-md text-sm transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          )}
          
          {/* API 키 목록 */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {apiKeys.length === 0 ? (
              <p className="text-xs text-[var(--text-tertiary)] px-2 py-4 text-center">
                API 키가 없습니다. 추가해주세요.
              </p>
            ) : (
              apiKeys.map((key) => {
                const isSelected = selectedKeyId === key.id;
                const isActive = getActiveApiKey() === key.key;
                return (
                  <div
                    key={key.id}
                    className={`p-2 rounded-md border ${
                      isSelected
                        ? 'bg-[var(--bg-tertiary)] border-[var(--accent-blue)]'
                        : 'bg-[var(--bg-primary)] border-[var(--border-color)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <button
                          onClick={() => handleToggleApiKey(key.id, key.isActive)}
                          className={`p-1 rounded transition-colors ${
                            key.isActive
                              ? 'text-[var(--accent-blue)]'
                              : 'text-[var(--text-tertiary)]'
                          }`}
                          title={key.isActive ? '비활성화' : '활성화'}
                        >
                          <Check size={14} className={key.isActive ? '' : 'opacity-30'} />
                        </button>
                        <span className="text-sm text-[var(--text-primary)] truncate">
                          {key.name}
                        </span>
                        {isSelected && (
                          <span className="text-xs bg-[var(--accent-blue)] text-white px-1.5 py-0.5 rounded">
                            선택됨
                          </span>
                        )}
                        {key.quotaExceeded && (
                          <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">
                            할당량 초과
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteApiKey(key.id)}
                        className="p-1 text-[var(--text-tertiary)] hover:text-red-400 transition-colors"
                        title="삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {key.lastUsed && (
                      <p className="text-xs text-[var(--text-tertiary)] mt-1 px-6">
                        마지막 사용: {new Date(key.lastUsed).toLocaleString('ko-KR')}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
          
          <p className="text-xs text-[var(--text-tertiary)] mt-2 px-2">
            선택한 키가 우선 사용됩니다. 할당량 초과 시 자동으로 다른 활성 키로 전환됩니다
          </p>
        </div>

        {/* 데이터 백업/복원 */}
        <div className="border-t border-[var(--border-color)] pt-5">
          <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-3">
            데이터 관리
          </label>
          <div className="space-y-2.5">
            <button
              onClick={handleExportData}
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--bg-glass)] backdrop-blur-lg border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl text-sm font-semibold hover:bg-[var(--bg-glass-hover)] hover:border-[var(--border-hover)] hover:-translate-y-0.5 transition-all duration-300"
            >
              <Download size={16} />
              데이터 내보내기
            </button>
            <button
              onClick={handleImportData}
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--bg-glass)] backdrop-blur-lg border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl text-sm font-semibold hover:bg-[var(--bg-glass-hover)] hover:border-[var(--border-hover)] hover:-translate-y-0.5 transition-all duration-300"
            >
              <Upload size={16} />
              데이터 가져오기
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          <p className="text-xs text-[var(--text-tertiary)] mt-3 px-1 leading-relaxed">
            대화 기록(유저노트 포함), 설정, 캐릭터, 로어북을 백업하거나 복원할 수 있습니다
          </p>
        </div>

        {/* Modern Advanced Settings Toggle */}
        <div className="border-t border-[var(--border-color)] pt-5">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors py-2 px-1 rounded-lg hover:bg-[var(--bg-glass)]"
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal size={16} />
              고급 설정
            </span>
            <svg
              className={`w-4 h-4 transition-transform duration-300 ${showAdvanced ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showAdvanced && (
            <div className="mt-4 space-y-4 text-sm text-[var(--text-secondary)]">
              <div>
                <p className="mb-2">Temperature (향후 구현 예정)</p>
                <div className="h-2 bg-[var(--bg-tertiary)] rounded-full">
                  <div className="h-full w-1/2 bg-[var(--accent-blue)] rounded-full"></div>
                </div>
              </div>
              <div className="text-xs text-[var(--text-tertiary)]">
                <p>• Context Window: 1M tokens</p>
                <p>• 대화 히스토리는 자동으로 localStorage에 저장됩니다</p>
              </div>
            </div>
          )}
        </div>
        </>
        )}
      </div>

      {/* 메모리 모달 */}
      <MemoryModal
        isOpen={showMemoryModal}
        onClose={() => setShowMemoryModal(false)}
        contextSummary={contextSummary}
        lastSummaryAt={lastSummaryAt}
        totalMessages={totalMessages}
      />
    </div>
  );
};

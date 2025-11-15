'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bot, PenSquare, SlidersHorizontal, Zap, MessageSquare, Brain, BookOpen, ChevronRight, FileText, Download, Upload } from 'lucide-react';
import { loadSettings, saveSettings, type OutputSpeed, type MaxOutputTokens, type ThinkingBudget } from '@/lib/storage/settings';
import { MemoryModal } from './MemoryModal';

interface SettingsSidebarProps {
  characterName: string;
  characterPersonality: string;
  model: 'gemini-flash' | 'gemini-pro';
  outputSpeed: OutputSpeed;
  maxOutputTokens: MaxOutputTokens;
  thinkingBudget: ThinkingBudget;
  contextSummary?: string;
  lastSummaryAt?: number;
  totalMessages: number;
  userNote?: string;
  onCharacterNameChange: (name: string) => void;
  onCharacterPersonalityChange: (personality: string) => void;
  onModelChange: (model: 'gemini-flash' | 'gemini-pro') => void;
  onOutputSpeedChange: (speed: OutputSpeed) => void;
  onMaxOutputTokensChange: (tokens: MaxOutputTokens) => void;
  onThinkingBudgetChange: (budget: ThinkingBudget) => void;
  onUserNoteChange: (note: string) => void;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  characterName,
  characterPersonality,
  model,
  outputSpeed,
  maxOutputTokens,
  thinkingBudget,
  contextSummary,
  lastSummaryAt,
  totalMessages,
  userNote,
  onCharacterNameChange,
  onCharacterPersonalityChange,
  onModelChange,
  onOutputSpeedChange,
  onMaxOutputTokensChange,
  onThinkingBudgetChange,
  onUserNoteChange,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const settings = loadSettings();
    onOutputSpeedChange(settings.outputSpeed);
    onMaxOutputTokensChange(settings.maxOutputTokens);
    onThinkingBudgetChange(settings.thinkingBudget);
  }, []);

  const handleOutputSpeedChange = (speed: OutputSpeed) => {
    onOutputSpeedChange(speed);
    const settings = loadSettings();
    saveSettings({ ...settings, outputSpeed: speed });
  };

  const handleMaxOutputTokensChange = (tokens: MaxOutputTokens) => {
    onMaxOutputTokensChange(tokens);
    const settings = loadSettings();
    saveSettings({ ...settings, maxOutputTokens: tokens });
  };

  const handleThinkingBudgetChange = (budget: ThinkingBudget) => {
    onThinkingBudgetChange(budget);
    const settings = loadSettings();
    saveSettings({ ...settings, thinkingBudget: budget });
  };

  // 데이터 내보내기
  const handleExportData = () => {
    try {
      const chatHistories = localStorage.getItem('chat_histories');
      const chatSettings = localStorage.getItem('chat_settings');
      const characters = localStorage.getItem('characters');

      const exportData = {
        chat_histories: chatHistories ? JSON.parse(chatHistories) : [],
        chat_settings: chatSettings ? JSON.parse(chatSettings) : null,
        characters: characters ? JSON.parse(characters) : [],
        exportDate: new Date().toISOString(),
        version: '1.0',
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

  return (
    <div className="w-96 bg-[var(--bg-secondary)] border-l border-[var(--border-color)] flex flex-col h-full overflow-y-auto p-4">
      <div className="space-y-6">
        {/* 헤더 */}
        <h2 className="text-xl font-bold text-[var(--text-primary)]">설정</h2>

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

        {/* 데이터 백업/복원 */}
        <div className="border-t border-[var(--border-color)] pt-4">
          <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-3">
            데이터 관리
          </label>
          <div className="space-y-2">
            <button
              onClick={handleExportData}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-md text-sm font-medium transition-colors"
            >
              <Download size={16} />
              데이터 내보내기
            </button>
            <button
              onClick={handleImportData}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-md text-sm font-medium transition-colors"
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
          <p className="text-xs text-[var(--text-tertiary)] mt-2 px-2">
            대화 기록, 설정, 캐릭터를 백업하거나 복원할 수 있습니다
          </p>
        </div>

        {/* 고급 설정 (접을 수 있음) */}
        <div className="border-t border-[var(--border-color)] pt-4">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <span className="flex items-center gap-2">
              <SlidersHorizontal size={16} />
              고급 설정
            </span>
            <svg
              className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
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

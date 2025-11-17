'use client';

import React from 'react';
import { Bot, Zap, Brain, BookOpen, Download, Upload } from 'lucide-react';
import type { OutputSpeed, MaxOutputTokens, ThinkingBudget, UIStyle } from '@/lib/storage/settings';

interface MobileSettingsProps {
  model: 'gemini-flash' | 'gemini-pro';
  outputSpeed: OutputSpeed;
  maxOutputTokens: MaxOutputTokens;
  thinkingBudget: ThinkingBudget;
  uiStyle: UIStyle;
  onModelChange: (model: 'gemini-flash' | 'gemini-pro') => void;
  onOutputSpeedChange: (speed: OutputSpeed) => void;
  onMaxOutputTokensChange: (tokens: MaxOutputTokens) => void;
  onThinkingBudgetChange: (budget: ThinkingBudget) => void;
  onUIStyleChange: (style: UIStyle) => void;
  onExportData?: () => void;
  onImportData?: () => void;
}

export const MobileSettings: React.FC<MobileSettingsProps> = ({
  model,
  outputSpeed,
  maxOutputTokens,
  thinkingBudget,
  uiStyle,
  onModelChange,
  onOutputSpeedChange,
  onMaxOutputTokensChange,
  onThinkingBudgetChange,
  onUIStyleChange,
  onExportData,
  onImportData,
}) => {
  return (
    <div className="p-5 space-y-6">
      {/* UI Style */}
      <div>
        <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-3">
          UI 스타일
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onUIStyleChange('modern')}
            className={`p-3 rounded-xl text-center text-xs font-medium transition-all duration-300 ${
              uiStyle === 'modern'
                ? 'bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white shadow-md'
                : 'glass-card hover:border-[var(--border-hover)] text-[var(--text-secondary)]'
            }`}
          >
            신규 UI
          </button>
          <button
            onClick={() => onUIStyleChange('classic')}
            className={`p-3 rounded-xl text-center text-xs font-medium transition-all duration-300 ${
              uiStyle === 'classic'
                ? 'bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white shadow-md'
                : 'glass-card hover:border-[var(--border-hover)] text-[var(--text-secondary)]'
            }`}
          >
            구형 UI
          </button>
        </div>
      </div>
      {/* AI Model */}
      <div>
        <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-3 flex items-center gap-2">
          <Bot size={18} />
          AI 모델
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onModelChange('gemini-pro')}
            className={`p-4 rounded-xl text-left transition-all duration-300 ${
              model === 'gemini-pro'
                ? 'bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white shadow-md'
                : 'glass-card hover:border-[var(--border-hover)]'
            }`}
          >
            <div className="font-semibold text-sm mb-1">Pro</div>
            <div className={`text-xs ${model === 'gemini-pro' ? 'opacity-90' : 'text-[var(--text-tertiary)]'}`}>
              강력하고 정확
            </div>
          </button>
          <button
            onClick={() => onModelChange('gemini-flash')}
            className={`p-4 rounded-xl text-left transition-all duration-300 ${
              model === 'gemini-flash'
                ? 'bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white shadow-md'
                : 'glass-card hover:border-[var(--border-hover)]'
            }`}
          >
            <div className="font-semibold text-sm mb-1">Flash</div>
            <div className={`text-xs ${model === 'gemini-flash' ? 'opacity-90' : 'text-[var(--text-tertiary)]'}`}>
              빠른 응답
            </div>
          </button>
        </div>
      </div>

      {/* Output Speed */}
      <div>
        <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-3 flex items-center gap-2">
          <Zap size={18} />
          출력 속도
        </label>
        <select
          value={outputSpeed}
          onChange={(e) => onOutputSpeedChange(e.target.value as OutputSpeed)}
          className="w-full rounded-xl px-4 py-3 text-[15px] font-medium"
        >
          <option value="instant">즉시 표시</option>
          <option value="fast">빠름</option>
          <option value="medium">보통</option>
          <option value="slow">느림</option>
        </select>
      </div>

      {/* Max Output Tokens */}
      <div>
        <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-3 flex items-center gap-2">
          <Brain size={18} />
          최대 출력 토큰
        </label>
        <div className="glass-card p-4 rounded-xl">
          <input
            type="range"
            min="256"
            max="8192"
            step="256"
            value={maxOutputTokens}
            onChange={(e) => onMaxOutputTokensChange(Number(e.target.value) as MaxOutputTokens)}
            className="w-full accent-[var(--accent-primary)]"
          />
          <div className="flex justify-between mt-2 text-xs text-[var(--text-tertiary)]">
            <span>256</span>
            <span className="font-semibold text-[var(--accent-primary)]">{maxOutputTokens}</span>
            <span>8192</span>
          </div>
        </div>
      </div>

      {/* Thinking Budget (Pro only) */}
      {model === 'gemini-pro' && (
        <div>
          <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-3 flex items-center gap-2">
            <BookOpen size={18} />
            생각 예산 (Thinking Budget)
          </label>
          <select
            value={thinkingBudget || 'none'}
            onChange={(e) => {
              const value = e.target.value;
              onThinkingBudgetChange(value === 'none' ? undefined : (Number(value) as ThinkingBudget));
            }}
            className="w-full rounded-xl px-4 py-3 text-[15px] font-medium"
          >
            <option value="none">사용 안 함</option>
            <option value="128">128 토큰</option>
            <option value="256">256 토큰</option>
            <option value="512">512 토큰</option>
            <option value="1024">1024 토큰</option>
            <option value="2048">2048 토큰</option>
            <option value="4096">4096 토큰</option>
            <option value="8192">8192 토큰</option>
            <option value="16384">16384 토큰</option>
            <option value="32768">32768 토큰</option>
          </select>
          <p className="text-xs text-[var(--text-tertiary)] mt-2 px-1">
            Pro 모델이 답변하기 전에 사용할 수 있는 토큰 수
          </p>
        </div>
      )}

      {/* Data Management */}
      <div className="border-t border-[var(--border-color)] pt-6">
        <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-3">
          데이터 관리
        </label>
        <div className="space-y-3">
          {onExportData && (
            <button
              onClick={onExportData}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 glass-card hover:bg-[var(--bg-glass-hover)] hover:border-[var(--border-hover)] rounded-xl text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5"
            >
              <Download size={18} />
              데이터 내보내기
            </button>
          )}
          {onImportData && (
            <button
              onClick={onImportData}
              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 glass-card hover:bg-[var(--bg-glass-hover)] hover:border-[var(--border-hover)] rounded-xl text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5"
            >
              <Upload size={18} />
              데이터 가져오기
            </button>
          )}
        </div>
        <p className="text-xs text-[var(--text-tertiary)] mt-3 px-1 leading-relaxed">
          대화 기록, 설정, 캐릭터, 로어북을 백업하거나 복원할 수 있습니다
        </p>
      </div>
    </div>
  );
};

'use client';

import React from 'react';
import { Plus, Users, History, Settings } from 'lucide-react';
import Link from 'next/link';
import { ChatHistoryItem } from './ChatHistoryItem';
import type { ChatHistorySummary } from '@/lib/storage/chatHistory';
import type { Character } from '@/lib/gemini/types';

interface SidebarProps {
  histories: ChatHistorySummary[];
  characters: Character[];
  currentHistoryId: string | null;
  currentCharacterId: string | null;
  onSelectHistory: (id: string) => void;
  onNewChat: () => void;
  onDeleteHistory: (id: string) => void;
  onLoadCharacter: (character: Character) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  histories,
  characters,
  currentHistoryId,
  currentCharacterId,
  onSelectHistory,
  onNewChat,
  onDeleteHistory,
  onLoadCharacter,
}) => {
  return (
    <div className="w-72 backdrop-blur-xl bg-[var(--bg-glass)] border-r border-[var(--border-color)] flex flex-col h-full">
      {/* Modern Header */}
      <div className="p-5 border-b border-[var(--border-color)]">
        <h1 className="text-xl font-bold text-[var(--text-primary)] mb-4 tracking-tight" style={{ letterSpacing: '-0.02em' }}>
          AI 캐릭터 채팅
        </h1>
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white rounded-xl text-sm font-semibold shadow-[0_4px_16px_var(--accent-glow)] hover:shadow-[0_6px_24px_var(--accent-glow)] hover:-translate-y-0.5 transition-all duration-300"
        >
          <Plus size={18} strokeWidth={2.5} />
          새 대화
        </button>
      </div>

      {/* Modern Character Section */}
      <div className="p-4 border-b border-[var(--border-color)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wide">
            <Users size={14} />
            캐릭터
          </div>
          <Link href="/characters">
            <button className="text-xs text-[var(--accent-primary)] hover:text-[var(--accent-secondary)] transition-colors font-medium">
              관리
            </button>
          </Link>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {characters.length > 0 ? (
            characters.map((character) => (
              <button
                key={character.id}
                onClick={() => onLoadCharacter(character)}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                  character.id === currentCharacterId
                    ? 'bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white shadow-md'
                    : 'bg-[var(--bg-glass)] backdrop-blur-md border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-glass-hover)] hover:border-[var(--border-hover)] hover:-translate-y-0.5'
                }`}
              >
                {character.name}
              </button>
            ))
          ) : (
            <Link href="/characters">
              <button className="w-full px-4 py-2.5 text-xs text-[var(--accent-primary)] hover:bg-[var(--bg-glass)] rounded-lg transition-all duration-300 text-center font-medium border border-dashed border-[var(--border-color)]">
                + 캐릭터 만들기
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* Modern History List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="text-xs font-semibold text-[var(--text-tertiary)] mb-3 flex items-center gap-2 uppercase tracking-wide">
          <History size={14} />
          대화 기록
        </div>
        <div className="space-y-2">
          {histories.map((history) => (
            <ChatHistoryItem
              key={history.id}
              id={history.id}
              title={history.title}
              isActive={history.id === currentHistoryId}
              onClick={() => onSelectHistory(history.id)}
              onDelete={() => onDeleteHistory(history.id)}
            />
          ))}
          {histories.length === 0 && (
            <div className="text-sm text-[var(--text-tertiary)] px-4 py-8 text-center font-normal">
              저장된 대화가 없습니다
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

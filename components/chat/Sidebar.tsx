'use client';

import React from 'react';
import { Plus, Users, History, Settings } from 'lucide-react';
import Link from 'next/link';
import { ChatHistoryItem } from './ChatHistoryItem';
import type { ChatHistory } from '@/lib/storage/chatHistory';
import type { Character } from '@/lib/gemini/types';

interface SidebarProps {
  histories: ChatHistory[];
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
    <div className="w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-color)] flex flex-col h-full">
      {/* 헤더 */}
      <div className="p-4 border-b border-[var(--border-color)]">
        <h1 className="text-lg font-bold text-[var(--text-primary)] mb-3">AI 캐릭터 채팅</h1>
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-hover)] text-white rounded-md text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          새 대화
        </button>
      </div>

      {/* 캐릭터 섹션 - 항상 표시 */}
      <div className="p-3 border-b border-[var(--border-color)]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-tertiary)]">
            <Users size={14} />
            캐릭터
          </div>
          <Link href="/characters">
            <button className="text-xs text-[var(--accent-blue)] hover:text-[var(--accent-blue-hover)] transition-colors">
              관리
            </button>
          </Link>
        </div>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {characters.length > 0 ? (
            characters.map((character) => (
              <button
                key={character.id}
                onClick={() => onLoadCharacter(character)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  character.id === currentCharacterId
                    ? 'bg-[var(--accent-blue)] text-white'
                    : 'bg-[var(--bg-primary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                {character.name}
              </button>
            ))
          ) : (
            <Link href="/characters">
              <button className="w-full px-3 py-2 text-xs text-[var(--accent-blue)] hover:bg-[var(--bg-hover)] rounded-md transition-colors text-center">
                캐릭터 만들기
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* 히스토리 목록 */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="text-xs font-medium text-[var(--text-tertiary)] mb-2 flex items-center gap-2">
          <History size={14} />
          대화 기록
        </div>
        <div className="space-y-1">
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
            <div className="text-sm text-[var(--text-tertiary)] px-3 py-4 text-center">
              저장된 대화가 없습니다
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

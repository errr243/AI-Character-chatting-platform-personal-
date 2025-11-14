'use client';

import React from 'react';
import { X, BookOpen } from 'lucide-react';

interface MemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  contextSummary?: string;
  lastSummaryAt?: number;
  totalMessages: number;
}

export const MemoryModal: React.FC<MemoryModalProps> = ({
  isOpen,
  onClose,
  contextSummary,
  lastSummaryAt,
  totalMessages,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-[var(--bg-secondary)] rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col border border-[var(--border-color)] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={20} className="text-[var(--accent-blue)]" />
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              대화 메모리
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-1 hover:bg-[var(--bg-tertiary)] rounded"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* 내용 */}
        <div className="flex-1 overflow-y-auto p-6">
          {contextSummary ? (
            <>
              <div className="mb-4 p-3 bg-[var(--bg-tertiary)] rounded-lg text-sm text-[var(--text-secondary)]">
                <p className="mb-1">
                  <span className="font-semibold">마지막 요약 시점:</span> {lastSummaryAt || 0}번째 메시지
                </p>
                <p>
                  <span className="font-semibold">현재 메시지 수:</span> {totalMessages}개
                </p>
                {lastSummaryAt && (
                  <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                    (최근 {totalMessages - (lastSummaryAt || 0)}개 메시지는 요약에 포함되지 않았습니다)
                  </p>
                )}
              </div>
              <div className="prose prose-invert prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-[var(--text-primary)] leading-relaxed">
                  {contextSummary}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <BookOpen size={48} className="mx-auto mb-4 text-[var(--text-tertiary)] opacity-50" />
              <p className="text-[var(--text-secondary)] text-lg mb-2">
                아직 저장된 메모리가 없습니다
              </p>
              <p className="text-sm text-[var(--text-tertiary)]">
                10턴(20개 메시지)마다 자동으로 메모리가 생성됩니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


'use client';

import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';

interface ChatHistoryItemProps {
  id: string;
  title: string;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}

export const ChatHistoryItem: React.FC<ChatHistoryItemProps> = React.memo(({
  title,
  isActive,
  onClick,
  onDelete,
}) => {
  const [showDelete, setShowDelete] = useState(false);

  return (
    <div
      className="relative group rounded-lg"
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <button
        onClick={onClick}
        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
          isActive
            ? 'bg-[var(--bg-glass)] backdrop-blur-md border border-[var(--border-color)] text-[var(--text-primary)] shadow-sm'
            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-glass)] hover:text-[var(--text-primary)] hover:border hover:border-[var(--border-color)] hover:-translate-y-0.5'
        }`}
      >
        <div className="truncate pr-8">{title}</div>
      </button>
      {showDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] hover:bg-[var(--bg-glass)] rounded-lg transition-all duration-300"
          title="삭제"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
});


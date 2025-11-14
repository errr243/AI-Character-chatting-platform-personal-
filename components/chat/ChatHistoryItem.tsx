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

export const ChatHistoryItem: React.FC<ChatHistoryItemProps> = ({
  title,
  isActive,
  onClick,
  onDelete,
}) => {
  const [showDelete, setShowDelete] = useState(false);

  return (
    <div
      className="relative group rounded-md"
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <button
        onClick={onClick}
        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
          isActive
            ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
        }`}
      >
        <div className="truncate pr-6">{title}</div>
      </button>
      {showDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-white hover:bg-[var(--bg-tertiary)] rounded"
          title="삭제"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
};


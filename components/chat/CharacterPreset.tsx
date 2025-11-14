'use client';

import React from 'react';

interface CharacterPresetProps {
  name: string;
  personality: string;
  isActive?: boolean;
  onClick: () => void;
}

export const CharacterPreset: React.FC<CharacterPresetProps> = ({
  name,
  personality,
  isActive = false,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-md border transition-colors ${
        isActive
          ? 'bg-[var(--bg-tertiary)] border-[var(--accent-blue)]'
          : 'border-[var(--border-color)] hover:bg-[var(--bg-hover)]'
      }`}
    >
      <div className={`text-sm font-medium ${isActive ? 'text-[var(--accent-blue)]' : 'text-[var(--text-primary)]'}`}>
        {name}
        {isActive && <span className="ml-2 text-xs">✓</span>}
      </div>
      <div className="text-xs text-[var(--text-tertiary)] mt-1 truncate">
        {personality.slice(0, 50)}...
      </div>
    </button>
  );
};

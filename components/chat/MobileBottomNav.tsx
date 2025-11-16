'use client';

import React from 'react';
import { MessageSquare, Users, Clock, Settings } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: 'chat' | 'characters' | 'history' | 'settings';
  onTabChange: (tab: 'chat' | 'characters' | 'history' | 'settings') => void;
  hasNewMessage?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  hasNewMessage = false,
}) => {
  const tabs = [
    { id: 'chat' as const, icon: MessageSquare, label: '채팅', badge: hasNewMessage },
    { id: 'characters' as const, icon: Users, label: '캐릭터', badge: false },
    { id: 'history' as const, icon: Clock, label: '기록', badge: false },
    { id: 'settings' as const, icon: Settings, label: '설정', badge: false },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Backdrop blur effect */}
      <div className="absolute inset-0 backdrop-blur-2xl bg-[var(--bg-glass)] border-t border-[var(--border-color)]" />

      {/* Navigation items */}
      <div className="relative grid grid-cols-4 h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center gap-0.5 transition-all duration-300 relative ${
                isActive
                  ? 'text-[var(--accent-primary)]'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
              }`}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]" />
              )}

              {/* Icon with badge */}
              <div className="relative">
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={`transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}
                />
                {tab.badge && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-pulse"
                        style={{ boxShadow: '0 0 8px var(--accent-glow)' }} />
                )}
              </div>

              {/* Label */}
              <span className={`text-[10px] font-medium transition-all duration-300 ${
                isActive ? 'opacity-100 scale-100' : 'opacity-60 scale-95'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Gesture indicator */}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full bg-[var(--border-color)] opacity-30" />
    </nav>
  );
};

'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Send, Mic, Plus, ChevronDown } from 'lucide-react';
import type { ChatMessage } from '@/lib/gemini/types';
import { MessageBubble } from './MessageBubble';

interface MobileChatAreaProps {
  title: string;
  messages: ChatMessage[];
  input: string;
  isLoading: boolean;
  characterName: string;
  outputSpeed?: 'instant' | 'fast' | 'medium' | 'slow';
  onTitleChange: (title: string) => void;
  onInputChange: (input: string) => void;
  onSend: () => void;
  onEditMessage?: (index: number, newContent: string) => void;
  onLoadPreviousMessages?: () => void;
  hasMoreMessages?: boolean;
  onMenuOpen?: () => void;
}

export const MobileChatArea: React.FC<MobileChatAreaProps> = ({
  title,
  messages,
  input,
  isLoading,
  characterName,
  outputSpeed = 'instant',
  onTitleChange,
  onInputChange,
  onSend,
  onEditMessage,
  onLoadPreviousMessages,
  hasMoreMessages = false,
  onMenuOpen,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [streamingContent, setStreamingContent] = useState<{ [key: number]: string }>({});
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Show scroll to bottom button when scrolled up
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200;
      setShowScrollToBottom(!isNearBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Streaming effect
  useEffect(() => {
    if (outputSpeed === 'instant') {
      setStreamingContent({});
      return;
    }

    const newStreamingContent: { [key: number]: string } = {};

    messages.forEach((message, index) => {
      if (message.role === 'assistant' && !streamingContent[index]) {
        const fullContent = message.content;
        const speedMap = { fast: 10, medium: 30, slow: 50 };
        const delay = speedMap[outputSpeed as keyof typeof speedMap] || 10;

        let currentIndex = 0;
        const streamInterval = setInterval(() => {
          currentIndex += Math.max(1, Math.floor(Math.random() * 3) + 1);
          if (currentIndex >= fullContent.length) {
            currentIndex = fullContent.length;
            clearInterval(streamInterval);
          }
          newStreamingContent[index] = fullContent.slice(0, currentIndex);
          setStreamingContent({ ...newStreamingContent });
        }, delay);

        return () => clearInterval(streamInterval);
      }
    });
  }, [messages, outputSpeed]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSend();
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-screen">
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-[var(--bg-glass)] border-b border-[var(--border-color)] px-4 py-3 safe-top">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] truncate tracking-tight" style={{ letterSpacing: '-0.02em' }}>
              {title}
            </h2>
            <p className="text-xs text-[var(--text-tertiary)] truncate">{characterName}</p>
          </div>
          <button
            onClick={onMenuOpen}
            className="p-2 hover:bg-[var(--bg-glass)] rounded-xl transition-all duration-300"
          >
            <Plus size={24} className="text-[var(--text-secondary)]" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 pb-safe"
      >
        {/* Load Previous Messages Button */}
        {hasMoreMessages && onLoadPreviousMessages && (
          <div className="flex justify-center mb-4">
            <button
              onClick={onLoadPreviousMessages}
              className="glass-card px-5 py-2.5 text-sm font-medium hover:scale-105 active:scale-100 transition-transform duration-300"
            >
              ↑ 이전 대화 보기
            </button>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center px-4">
            <div className="text-center fade-in-up">
              <div className="text-6xl mb-4 animate-pulse" style={{ filter: 'drop-shadow(0 0 20px var(--accent-glow))' }}>
                💬
              </div>
              <p className="text-xl text-[var(--text-primary)] mb-2 font-semibold">
                안녕하세요!
              </p>
              <p className="text-sm text-[var(--text-secondary)]">
                {characterName}와 대화를 시작해보세요
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => {
              const displayContent =
                outputSpeed !== 'instant' &&
                message.role === 'assistant' &&
                streamingContent[index] !== undefined
                  ? streamingContent[index]
                  : message.content;

              return (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} stagger-item`}
                >
                  <div
                    className={`rounded-2xl px-4 py-3 max-w-[85%] transition-all duration-300 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white shadow-lg'
                        : 'glass-card'
                    }`}
                  >
                    <MessageBubble
                      content={displayContent}
                      isUser={message.role === 'user'}
                      characterName={characterName}
                      onEdit={onEditMessage ? (newContent) => onEditMessage(index, newContent) : undefined}
                      onEditingChange={(isEditing) => setEditingMessageIndex(isEditing ? index : null)}
                    />
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex justify-start stagger-item">
                <div className="glass-card px-4 py-3 rounded-2xl">
                  <div className="flex items-center space-x-2">
                    <div className="animate-pulse text-xl" style={{ filter: 'drop-shadow(0 0 8px var(--accent-glow))' }}>
                      💭
                    </div>
                    <span className="text-sm text-[var(--text-secondary)]">입력 중...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollToBottom && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-24 right-4 z-10 p-3 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white rounded-full shadow-[0_4px_16px_var(--accent-glow)] hover:shadow-[0_6px_24px_var(--accent-glow)] transition-all duration-300 animate-bounce md:hidden"
        >
          <ChevronDown size={20} strokeWidth={2.5} />
        </button>
      )}

      {/* Mobile Input Area */}
      <div className="sticky bottom-16 md:bottom-0 backdrop-blur-xl bg-[var(--bg-glass)] border-t border-[var(--border-color)] px-4 py-3 pb-safe">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              onInputChange(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="메시지 입력..."
            disabled={isLoading}
            rows={1}
            className="flex-1 min-h-[44px] max-h-[120px] resize-none rounded-2xl px-4 py-3 text-[15px] font-normal"
            style={{ height: 'auto' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="btn-accent flex items-center justify-center w-12 h-12 disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl shrink-0"
          >
            <Send size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
};

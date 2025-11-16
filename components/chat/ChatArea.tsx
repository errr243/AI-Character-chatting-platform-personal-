'use client';

import React, { useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import type { ChatMessage } from '@/lib/gemini/types';
import { MessageBubble } from './MessageBubble';

interface ChatAreaProps {
  title: string;
  messages: ChatMessage[];
  input: string;
  isLoading: boolean;
  characterName: string;
  tokenCount?: number;
  outputSpeed?: 'instant' | 'fast' | 'medium' | 'slow';
  onTitleChange: (title: string) => void;
  onInputChange: (input: string) => void;
  onSend: () => void;
  onEditMessage?: (index: number, newContent: string) => void;
  onLoadPreviousMessages?: () => void;
  hasMoreMessages?: boolean;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  title,
  messages,
  input,
  isLoading,
  characterName,
  tokenCount,
  outputSpeed = 'instant',
  onTitleChange,
  onInputChange,
  onSend,
  onEditMessage,
  onLoadPreviousMessages,
  hasMoreMessages = false,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [tempTitle, setTempTitle] = React.useState(title);
  const [streamingContent, setStreamingContent] = React.useState<{ [key: number]: string }>({});
  const [editingMessageIndex, setEditingMessageIndex] = React.useState<number | null>(null);
  const [showLoadPreviousButton, setShowLoadPreviousButton] = React.useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // 스크롤 감지 로직
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || !hasMoreMessages) {
      setShowLoadPreviousButton(false);
      return;
    }
    
    const handleScroll = () => {
      // 상단에서 100px 이내에 있으면 버튼 표시
      const isNearTop = container.scrollTop < 100;
      setShowLoadPreviousButton(isNearTop);
    };
    
    container.addEventListener('scroll', handleScroll);
    // 초기 체크
    handleScroll();
    
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMoreMessages]);

  useEffect(() => {
    setTempTitle(title);
  }, [title]);

  // 스트리밍 효과 적용
  useEffect(() => {
    if (outputSpeed === 'instant') {
      setStreamingContent({});
      return;
    }

    const newStreamingContent: { [key: number]: string } = {};
    
    messages.forEach((message, index) => {
      if (message.role === 'assistant' && !streamingContent[index]) {
        const fullContent = message.content;
        const speedMap = {
          fast: 10,
          medium: 30,
          slow: 50,
        };
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
      } else if (message.role === 'assistant' && streamingContent[index]) {
        newStreamingContent[index] = streamingContent[index];
      }
    });
  }, [messages, outputSpeed]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (tempTitle.trim()) {
      onTitleChange(tempTitle.trim());
    } else {
      setTempTitle(title);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden">
      {/* Modern Header with Glassmorphism */}
      <div className="px-8 py-5 border-b border-[var(--border-color)] flex items-center justify-between min-h-[72px] backdrop-blur-xl bg-[var(--bg-glass)] relative z-10">
        {isEditingTitle ? (
          <input
            type="text"
            value={tempTitle}
            onChange={(e) => setTempTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTitleBlur();
              if (e.key === 'Escape') {
                setTempTitle(title);
                setIsEditingTitle(false);
              }
            }}
            autoFocus
            className="text-xl font-semibold bg-transparent border-b-2 border-[var(--accent-primary)] outline-none px-2 py-1 w-full tracking-tight"
            style={{ fontWeight: 600, letterSpacing: '-0.02em' }}
          />
        ) : (
          <h2
            onClick={() => setIsEditingTitle(true)}
            className="text-xl font-semibold text-[var(--text-primary)] cursor-pointer hover:text-[var(--accent-primary)] transition-all duration-300"
            title="클릭하여 제목 편집"
            style={{ fontWeight: 600, letterSpacing: '-0.02em' }}
          >
            {title}
          </h2>
        )}
        {tokenCount !== undefined && (
          <div className="text-sm text-[var(--text-tertiary)] font-medium">
            {tokenCount.toLocaleString()} tokens
          </div>
        )}
      </div>

      {/* Modern Message Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-8 py-6"
      >
        {/* Modern Load Previous Button */}
        {showLoadPreviousButton && onLoadPreviousMessages && hasMoreMessages && (
          <div className="flex justify-center mb-6 sticky top-0 z-10">
            <button
              onClick={() => {
                const container = messagesContainerRef.current;
                const scrollHeight = container?.scrollHeight || 0;
                onLoadPreviousMessages();
                setTimeout(() => {
                  if (container) {
                    const newScrollHeight = container.scrollHeight;
                    const heightDiff = newScrollHeight - scrollHeight;
                    container.scrollTop = heightDiff;
                  }
                }, 0);
              }}
              className="glass-card px-6 py-3 text-[var(--text-primary)] text-sm font-medium hover:scale-105 active:scale-100"
            >
              <span className="mr-2">↑</span>
              이전 대화 보기 (10개)
            </button>
          </div>
        )}
        
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center fade-in-up">
              <div className="text-7xl mb-6 animate-pulse" style={{ filter: 'drop-shadow(0 0 20px var(--accent-glow))' }}>💬</div>
              <p className="text-2xl text-[var(--text-primary)] mb-3 font-semibold" style={{ letterSpacing: '-0.02em' }}>
                안녕하세요! {characterName}입니다.
              </p>
              <p className="text-base text-[var(--text-secondary)] font-normal">
                자유롭게 대화를 시작해보세요.
              </p>
            </div>
          </div>
        ) : (
          <div className={`${editingMessageIndex !== null ? 'max-w-full px-2' : 'max-w-5xl'} mx-auto space-y-6`}>
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
                    className={`group rounded-2xl px-5 py-4 transition-all duration-300 ${
                      editingMessageIndex === index
                        ? 'w-full max-w-full'
                        : 'max-w-[85%]'
                    } ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white shadow-lg hover:shadow-xl'
                        : 'glass-card'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <MessageBubble
                        content={message.content}
                        isUser={true}
                        characterName={characterName}
                        onEdit={onEditMessage ? (newContent) => onEditMessage(index, newContent) : undefined}
                        onEditingChange={(isEditing) => setEditingMessageIndex(isEditing ? index : null)}
                      />
                    ) : (
                      <MessageBubble
                        content={displayContent}
                        isUser={false}
                        characterName={characterName}
                        onEdit={onEditMessage ? (newContent) => onEditMessage(index, newContent) : undefined}
                        onEditingChange={(isEditing) => setEditingMessageIndex(isEditing ? index : null)}
                      />
                    )}
                    {outputSpeed !== 'instant' && 
                     message.role === 'assistant' && 
                     streamingContent[index] !== undefined &&
                     streamingContent[index].length < message.content.length && (
                      <span className="inline-block w-2 h-4 bg-[var(--accent-blue)] ml-1 animate-pulse" />
                    )}
                  </div>
                </div>
              );
            })}
            {isLoading && (
              <div className="flex justify-start stagger-item">
                <div className="glass-card px-5 py-4 rounded-2xl">
                  <div className="flex items-center space-x-3">
                    <div className="animate-pulse text-2xl" style={{ filter: 'drop-shadow(0 0 8px var(--accent-glow))' }}>💭</div>
                    <span className="text-sm text-[var(--text-secondary)] font-medium">입력 중...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Modern Input Area with Glassmorphism */}
      <div className="px-8 py-5 border-t border-[var(--border-color)] backdrop-blur-xl bg-[var(--bg-glass)] relative z-10">
        <div className="max-w-5xl mx-auto flex gap-4 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요... (Enter: 전송, Shift+Enter: 줄바꿈)"
            disabled={isLoading}
            rows={1}
            className="flex-1 min-h-[52px] max-h-48 resize-none rounded-2xl p-4 leading-relaxed text-[15px] font-normal"
            style={{
              height: 'auto',
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${Math.min(target.scrollHeight, 192)}px`;
            }}
          />
          <button
            onClick={onSend}
            disabled={!input.trim() || isLoading}
            className="btn-accent flex items-center justify-center w-14 h-14 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:transform-none rounded-2xl shrink-0"
            title="전송"
          >
            <Send size={22} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
};

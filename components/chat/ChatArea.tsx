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
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [tempTitle, setTempTitle] = React.useState(title);
  const [streamingContent, setStreamingContent] = React.useState<{ [key: number]: string }>({});
  const [editingMessageIndex, setEditingMessageIndex] = React.useState<number | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

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
    <div className="flex-1 flex flex-col bg-[var(--bg-primary)] h-full">
      {/* 헤더 */}
      <div className="px-6 py-3 border-b border-[var(--border-color)] flex items-center justify-between min-h-[57px]">
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
            className="text-lg font-medium bg-transparent border-b border-[var(--accent-blue)] outline-none px-1 py-0.5 w-full"
          />
        ) : (
          <h2
            onClick={() => setIsEditingTitle(true)}
            className="text-lg font-medium text-[var(--text-primary)] cursor-pointer hover:text-[var(--accent-blue)] transition-colors"
            title="클릭하여 제목 편집"
          >
            {title}
          </h2>
        )}
        {tokenCount !== undefined && (
          <div className="text-sm text-[var(--text-tertiary)]">
            {tokenCount.toLocaleString()} tokens
          </div>
        )}
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-lg text-[var(--text-primary)] mb-2">
                안녕하세요! {characterName}입니다.
              </p>
              <p className="text-sm text-[var(--text-secondary)]">
                자유롭게 대화를 시작해보세요.
              </p>
            </div>
          </div>
        ) : (
          <div className={`${editingMessageIndex !== null ? 'max-w-full px-2' : 'max-w-4xl'} mx-auto space-y-4`}>
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
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`group rounded-lg px-4 py-3 transition-all ${
                      editingMessageIndex === index 
                        ? 'w-full max-w-full' 
                        : 'max-w-[80%]'
                    } ${
                      message.role === 'user'
                        ? 'bg-[var(--accent-blue)] text-white'
                        : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)]'
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
              <div className="flex justify-start">
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <div className="animate-pulse">💭</div>
                    <span className="text-sm text-[var(--text-secondary)]">입력 중...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 입력 영역 */}
      <div className="px-6 py-3 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <div className="max-w-4xl mx-auto flex gap-3 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요... (Enter: 전송, Shift+Enter: 줄바꿈)"
            disabled={isLoading}
            rows={1}
            className="flex-1 min-h-[44px] max-h-48 resize-none bg-[var(--bg-tertiary)] rounded-lg p-3 leading-snug"
            style={{
              height: 'auto',
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
            }}
          />
          <button
            onClick={onSend}
            disabled={!input.trim() || isLoading}
            className="flex items-center justify-center w-11 h-11 bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full transition-colors shrink-0"
            title="전송"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

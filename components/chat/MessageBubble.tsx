'use client';

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Edit, Check, X, Copy, RotateCw } from 'lucide-react';

interface MessageBubbleProps {
  content: string;
  isUser: boolean;
  characterName: string;
  onEdit?: (newContent: string) => void;
  onEditingChange?: (isEditing: boolean) => void;
  onReroll?: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({
  content,
  isUser,
  characterName,
  onEdit,
  onEditingChange,
  onReroll,
}) => {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [copied, setCopied] = useState(false);

  // setTimeout cleanup for copied state
  useEffect(() => {
    if (copied) {
      const timeoutId = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [copied]);

  const handleImageError = (src: string) => {
    setImageErrors((prev) => new Set(prev).add(src));
  };

  const handleImageClick = (src: string) => {
    if (!imageErrors.has(src)) {
      setExpandedImage(src);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedContent(content);
    onEditingChange?.(true);
  };

  const handleSave = () => {
    if (onEdit && editedContent.trim()) {
      onEdit(editedContent.trim());
    }
    setIsEditing(false);
    onEditingChange?.(false);
  };

  const handleCancel = () => {
    setEditedContent(content);
    setIsEditing(false);
    onEditingChange?.(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      // useEffect에서 cleanup 처리됨
    } catch (error) {
      console.error('복사 실패:', error);
      // 폴백: 텍스트 영역에 복사
      try {
        const textArea = document.createElement('textarea');
        textArea.value = content;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        // useEffect에서 cleanup 처리됨
      } catch (fallbackError) {
        console.error('폴백 복사도 실패:', fallbackError);
      }
    }
  };

  return (
    <>
      {!isEditing && (
        <div className="flex items-center justify-between mb-1">
          <div className="text-xs font-medium opacity-70">
            {isUser ? '나' : characterName}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[var(--bg-tertiary)] rounded"
              title={copied ? '복사됨!' : '복사'}
            >
              {copied ? (
                <Check size={14} className="text-green-500" />
              ) : (
                <Copy size={14} />
              )}
            </button>
            {onReroll && !isUser && (
              <button
                onClick={onReroll}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[var(--bg-tertiary)] rounded"
                title="다시 생성"
              >
                <RotateCw size={14} />
              </button>
            )}
            {onEdit && (
              <button
                onClick={handleEdit}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[var(--bg-tertiary)] rounded"
                title="수정"
              >
                <Edit size={14} />
              </button>
            )}
          </div>
        </div>
      )}
      
      {isEditing ? (
        <div className="space-y-3 -mx-4 -my-3 p-4">
          <div className="text-xs font-medium opacity-70 mb-2">
            {isUser ? '나' : characterName}
          </div>
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full min-h-[600px] p-4 bg-[var(--bg-tertiary)] border border-[var(--accent-blue)] rounded-lg text-[var(--text-primary)] font-sans text-sm resize-y focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-1 px-4 py-2 bg-[var(--accent-blue)] hover:bg-blue-600 text-white rounded text-sm font-medium transition-colors"
            >
              <Check size={16} />
              완료
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 px-4 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded text-sm font-medium transition-colors"
            >
              <X size={16} />
              취소
            </button>
          </div>
        </div>
      ) : isUser ? (
        <div className="whitespace-pre-wrap break-words text-sm leading-relaxed" style={{ padding: '8px 12px' }}>
          {content}
        </div>
      ) : (
        <div className="prose prose-invert prose-sm max-w-none" style={{ padding: '8px 12px' }}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            // 단락을 div로 변환하여 블록 요소 허용
            p({ children, node, ...props }: any) {
              // 블록 레벨 요소 태그 목록
              const blockLevelTags = ['div', 'img', 'pre', 'table', 'blockquote', 'ul', 'ol', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
              
              // node에서 블록 요소가 포함되어 있는지 재귀적으로 확인
              const checkNodeForBlockElement = (node: any): boolean => {
                if (!node) return false;
                
                // 현재 노드가 블록 레벨 요소인지 확인
                if (node.type === 'element' && blockLevelTags.includes(node.tagName)) {
                  return true;
                }
                
                // 자식 노드들을 재귀적으로 확인
                if (node.children && Array.isArray(node.children)) {
                  return node.children.some((child: any) => checkNodeForBlockElement(child));
                }
                
                return false;
              };
              
              // React children에서 블록 요소 확인
              const checkReactChildrenForBlockElement = (children: any): boolean => {
                return React.Children.toArray(children).some((child: any) => {
                  if (React.isValidElement(child)) {
                    const type = child.type as any;
                    const childProps = child.props as any;
                    
                    // div 태그인 경우
                    if (type === 'div') {
                      return true;
                    }
                    
                    // img 태그인 경우
                    if (type === 'img') {
                      return true;
                    }
                    
                    // className에 my-2가 있으면 블록 요소로 간주 (img 컴포넌트가 반환하는 div)
                    if (childProps?.className && typeof childProps.className === 'string' && childProps.className.includes('my-2')) {
                      return true;
                    }
                    
                    // children을 재귀적으로 확인
                    if (childProps?.children) {
                      return checkReactChildrenForBlockElement(childProps.children);
                    }
                  }
                  
                  return false;
                });
              };
              
              // node와 React children 모두 확인
              const hasBlockElement = checkNodeForBlockElement(node) || checkReactChildrenForBlockElement(children);
              
              // 블록 요소가 있으면 div로, 없으면 p로 렌더링
              if (hasBlockElement) {
                return <div className="my-2" {...props}>{children}</div>;
              }
              
              return <p className="my-2" {...props}>{children}</p>;
            },
            // 코드 블록
            code({ node, inline, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || '');
              const language = match ? match[1] : '';
              
              return !inline && match ? (
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={language}
                  PreTag="div"
                  className="rounded-md"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className="bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded text-sm" {...props}>
                  {children}
                </code>
              );
            },
            // 이미지
            img({ src, alt, ...props }: any) {
              if (imageErrors.has(src || '')) {
                return (
                  <div className="text-xs text-[var(--text-tertiary)] italic">
                    이미지를 불러올 수 없습니다: {alt || src}
                  </div>
                );
              }

              return (
                <div className="my-2">
                  <img
                    src={src}
                    alt={alt}
                    className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    onError={() => src && handleImageError(src)}
                    onClick={() => src && handleImageClick(src)}
                    loading="lazy"
                    {...props}
                  />
                  {alt && (
                    <div className="text-xs text-[var(--text-tertiary)] mt-1 text-center">
                      {alt}
                    </div>
                  )}
                </div>
              );
            },
            // 링크
            a({ href, children, ...props }: any) {
              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--accent-blue)] hover:underline"
                  {...props}
                >
                  {children}
                </a>
              );
            },
            // 리스트
            ul({ children, ...props }: any) {
              return (
                <ul className="list-disc list-inside space-y-1 my-2" {...props}>
                  {children}
                </ul>
              );
            },
            ol({ children, ...props }: any) {
              return (
                <ol className="list-decimal list-inside space-y-1 my-2" {...props}>
                  {children}
                </ol>
              );
            },
            // 강조
            strong({ children, ...props }: any) {
              return (
                <strong className="font-bold" {...props}>
                  {children}
                </strong>
              );
            },
            em({ children, ...props }: any) {
              return (
                <em className="italic" {...props}>
                  {children}
                </em>
              );
            },
            // 제목
            h1({ children, ...props }: any) {
              return (
                <h1 className="text-xl font-bold mt-4 mb-2" {...props}>
                  {children}
                </h1>
              );
            },
            h2({ children, ...props }: any) {
              return (
                <h2 className="text-lg font-bold mt-3 mb-2" {...props}>
                  {children}
                </h2>
              );
            },
            h3({ children, ...props }: any) {
              return (
                <h3 className="text-base font-bold mt-2 mb-1" {...props}>
                  {children}
                </h3>
              );
            },
            // 인용구
            blockquote({ children, ...props }: any) {
              return (
                <blockquote
                  className="border-l-4 border-[var(--accent-blue)] pl-4 my-2 italic text-[var(--text-secondary)]"
                  {...props}
                >
                  {children}
                </blockquote>
              );
            },
            // 테이블
            table({ children, ...props }: any) {
              return (
                <div className="overflow-x-auto my-2">
                  <table className="min-w-full border-collapse border border-[var(--border-color)]" {...props}>
                    {children}
                  </table>
                </div>
              );
            },
            th({ children, ...props }: any) {
              return (
                <th className="border border-[var(--border-color)] px-3 py-2 bg-[var(--bg-tertiary)] font-semibold" {...props}>
                  {children}
                </th>
              );
            },
            td({ children, ...props }: any) {
              return (
                <td className="border border-[var(--border-color)] px-3 py-2" {...props}>
                  {children}
                </td>
              );
            },
            // 수평선
            hr({ ...props }: any) {
              return (
                <hr className="my-4 border-[var(--border-color)]" {...props} />
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
        </div>
      )}

      {/* 이미지 확대 모달 */}
      {expandedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setExpandedImage(null)}
        >
          <div className="max-w-5xl max-h-[90vh] relative">
            <button
              onClick={() => setExpandedImage(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 text-2xl font-bold"
            >
              ×
            </button>
            <img
              src={expandedImage}
              alt="확대된 이미지"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}, (prevProps, nextProps) => {
  // 내용/역할/캐릭터 이름이 바뀔 때만 실제로 다시 렌더링
  return (
    prevProps.content === nextProps.content &&
    prevProps.isUser === nextProps.isUser &&
    prevProps.characterName === nextProps.characterName &&
    prevProps.onReroll === nextProps.onReroll
  );
});

MessageBubble.displayName = 'MessageBubble';

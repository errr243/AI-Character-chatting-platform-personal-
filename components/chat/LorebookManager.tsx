'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, BookOpen, ToggleLeft, ToggleRight } from 'lucide-react';
import {
  loadLorebooks,
  addLorebook,
  updateLorebook,
  deleteLorebook,
  type LorebookEntry,
} from '@/lib/storage/lorebook';

interface LorebookManagerProps {
  maxActive: number;
  onMaxActiveChange: (max: 3 | 5 | 8 | 10) => void;
}

export const LorebookManager: React.FC<LorebookManagerProps> = ({
  maxActive,
  onMaxActiveChange,
}) => {
  const [lorebooks, setLorebooks] = useState<LorebookEntry[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ keywords: '', content: '' });

  useEffect(() => {
    loadLorebooksData();
  }, []);

  const loadLorebooksData = () => {
    const loaded = loadLorebooks();
    setLorebooks(loaded);
  };

  const enabledCount = lorebooks.filter(l => l.enabled).length;

  const handleAdd = () => {
    try {
      const keywords = formData.keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0)
        .slice(0, 5);

      if (keywords.length === 0) {
        alert('최소 1개의 키워드를 입력해주세요.');
        return;
      }

      if (formData.content.trim().length === 0) {
        alert('내용을 입력해주세요.');
        return;
      }

      addLorebook({
        keywords,
        content: formData.content.trim(),
        enabled: true,
      });

      setFormData({ keywords: '', content: '' });
      setShowAddForm(false);
      loadLorebooksData();
    } catch (error: any) {
      alert(error.message || '로어북 추가에 실패했습니다.');
    }
  };

  const handleEdit = (lorebook: LorebookEntry) => {
    setEditingId(lorebook.id);
    setFormData({
      keywords: lorebook.keywords.join(', '),
      content: lorebook.content,
    });
    setShowAddForm(true);
  };

  const handleUpdate = () => {
    if (!editingId) return;

    try {
      const keywords = formData.keywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0)
        .slice(0, 5);

      if (keywords.length === 0) {
        alert('최소 1개의 키워드를 입력해주세요.');
        return;
      }

      if (formData.content.trim().length === 0) {
        alert('내용을 입력해주세요.');
        return;
      }

      updateLorebook(editingId, {
        keywords,
        content: formData.content.trim(),
      });

      setEditingId(null);
      setFormData({ keywords: '', content: '' });
      setShowAddForm(false);
      loadLorebooksData();
    } catch (error: any) {
      alert(error.message || '로어북 수정에 실패했습니다.');
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('이 로어북을 삭제하시겠습니까?')) {
      deleteLorebook(id);
      loadLorebooksData();
    }
  };

  const handleToggleEnabled = (id: string, enabled: boolean) => {
    if (!enabled && enabledCount >= maxActive) {
      alert(`최대 활성 로어북 수(${maxActive}개)에 도달했습니다. 다른 로어북을 비활성화한 후 다시 시도해주세요.`);
      return;
    }

    updateLorebook(id, { enabled: !enabled });
    loadLorebooksData();
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ keywords: '', content: '' });
    setShowAddForm(false);
  };

  return (
    <div className="space-y-3">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-[var(--text-secondary)]" />
          <span className="text-sm font-semibold text-[var(--text-secondary)]">로어북</span>
          <span className="text-xs text-[var(--text-tertiary)]">
            (활성: {enabledCount}/{maxActive})
          </span>
        </div>
        {!showAddForm && (
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({ keywords: '', content: '' });
              setShowAddForm(true);
            }}
            className="p-1 hover:bg-[var(--bg-hover)] rounded transition-colors"
            title="로어북 추가"
          >
            <Plus size={16} className="text-[var(--text-secondary)]" />
          </button>
        )}
      </div>

      {/* 최대 활성 로어북 수 설정 */}
      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
          최대 활성 로어북 수
        </label>
        <select
          value={maxActive}
          onChange={(e) => onMaxActiveChange(Number(e.target.value) as 3 | 5 | 8 | 10)}
          className="w-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent-blue)]"
        >
          <option value={3}>3개</option>
          <option value={5}>5개</option>
          <option value={8}>8개</option>
          <option value={10}>10개</option>
        </select>
      </div>

      {/* 추가/수정 폼 */}
      {showAddForm && (
        <div className="p-3 bg-[var(--bg-tertiary)] rounded-md space-y-2 border border-[var(--border-color)]">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              키워드 (쉼표로 구분, 최대 5개)
            </label>
            <input
              type="text"
              placeholder="예: 마법, 마법사, 주문"
              value={formData.keywords}
              onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
              className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-md text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)]"
            />
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              {formData.keywords.split(',').filter(k => k.trim().length > 0).length}/5
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              내용 (최대 500자)
            </label>
            <textarea
              placeholder="로어북 내용을 입력하세요..."
              value={formData.content}
              onChange={(e) => {
                if (e.target.value.length <= 500) {
                  setFormData({ ...formData, content: e.target.value });
                }
              }}
              rows={4}
              className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-md text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-blue)] resize-y"
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-[var(--text-tertiary)]">
                {formData.content.length}/500자
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={editingId ? handleUpdate : handleAdd}
              className="flex-1 px-3 py-2 bg-[var(--accent-blue)] text-white rounded-md text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-1"
            >
              <Check size={14} />
              {editingId ? '수정' : '추가'}
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-2 bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-md text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-1"
            >
              <X size={14} />
              취소
            </button>
          </div>
        </div>
      )}

      {/* 로어북 목록 */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {lorebooks.length === 0 ? (
          <p className="text-xs text-[var(--text-tertiary)] text-center py-4">
            로어북이 없습니다. + 버튼을 눌러 추가하세요.
          </p>
        ) : (
          lorebooks.map((lorebook) => (
            <div
              key={lorebook.id}
              className={`p-3 rounded-md border ${
                lorebook.enabled
                  ? 'bg-[var(--bg-tertiary)] border-[var(--accent-blue)]'
                  : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <button
                      onClick={() => handleToggleEnabled(lorebook.id, lorebook.enabled)}
                      className="flex-shrink-0"
                      title={lorebook.enabled ? '비활성화' : '활성화'}
                    >
                      {lorebook.enabled ? (
                        <ToggleRight size={18} className="text-[var(--accent-blue)]" />
                      ) : (
                        <ToggleLeft size={18} className="text-[var(--text-tertiary)]" />
                      )}
                    </button>
                    <div className="flex flex-wrap gap-1">
                      {lorebook.keywords.map((keyword, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-1.5 py-0.5 bg-[var(--bg-primary)] text-[var(--text-secondary)] rounded border border-[var(--border-color)]"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-[var(--text-primary)] line-clamp-2 mt-1">
                    {lorebook.content}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(lorebook)}
                    className="p-1 hover:bg-[var(--bg-hover)] rounded transition-colors"
                    title="수정"
                  >
                    <Edit2 size={14} className="text-[var(--text-secondary)]" />
                  </button>
                  <button
                    onClick={() => handleDelete(lorebook.id)}
                    className="p-1 hover:bg-[var(--bg-hover)] rounded transition-colors"
                    title="삭제"
                  >
                    <Trash2 size={14} className="text-[var(--text-secondary)]" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};


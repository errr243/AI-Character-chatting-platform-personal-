'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import Link from 'next/link';
import type { Character } from '@/lib/gemini/types';
import {
  loadCharacters,
  saveCharacter,
  createCharacter,
  updateCharacter,
  deleteCharacter,
  initializeDefaultCharacters,
} from '@/lib/storage/characters';

export default function CharactersPage() {
  const [characters, setCharacters] = useState<Character[]>(() => {
    initializeDefaultCharacters();
    try {
      return loadCharacters();
    } catch (error) {
      console.error('Failed to load characters on init:', error);
      return [];
    }
  });
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<Character>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleCreate = () => {
    setIsCreating(true);
    setIsEditing(true);
    setFormData({
      name: '',
      personality: '',
      firstPerson: '나',
      secondPerson: '너',
      style: '친근한 반말',
      relationship: '친구',
      background: '',
      traits: [],
      safetyRules: '',
      avatar: '',
      isDefault: false,
    });
    setSelectedCharacter(null);
  };

  const handleEdit = (character: Character) => {
    setIsCreating(false);
    setIsEditing(true);
    setSelectedCharacter(character);
    setFormData(character);
  };

  const handleSave = () => {
    try {
      if (isCreating) {
        if (!formData.name || !formData.personality || !formData.firstPerson || !formData.secondPerson || !formData.style || !formData.relationship) {
          alert('필수 필드를 모두 입력해주세요.');
          return;
        }

        const character = createCharacter({
          name: formData.name!,
          personality: formData.personality!,
          firstPerson: formData.firstPerson!,
          secondPerson: formData.secondPerson!,
          style: formData.style!,
          relationship: formData.relationship!,
          background: formData.background || '',
          traits: formData.traits || [],
          safetyRules: formData.safetyRules || '',
          avatar: formData.avatar || '',
          isDefault: false,
        });

        saveCharacter(character);
      } else if (selectedCharacter) {
        if (!formData.name || !formData.personality || !formData.firstPerson || !formData.secondPerson || !formData.style || !formData.relationship) {
          alert('필수 필드를 모두 입력해주세요.');
          return;
        }

        updateCharacter(selectedCharacter.id, {
          name: formData.name!,
          personality: formData.personality!,
          firstPerson: formData.firstPerson!,
          secondPerson: formData.secondPerson!,
          style: formData.style!,
          relationship: formData.relationship!,
          background: formData.background || '',
          traits: formData.traits || [],
          safetyRules: formData.safetyRules || '',
          avatar: formData.avatar || '',
        });
      }

      setCharacters(loadCharacters());
      setIsEditing(false);
      setIsCreating(false);
      setSelectedCharacter(null);
    } catch (error) {
      console.error('Save error:', error);
      alert(error instanceof Error ? error.message : '저장에 실패했습니다.');
    }
  };

  const handleDelete = () => {
    if (!selectedCharacter) return;

    try {
      deleteCharacter(selectedCharacter.id);
      setCharacters(loadCharacters());
      setSelectedCharacter(null);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Delete error:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  return (
    <div className="h-screen flex bg-[var(--bg-primary)]">
      {/* 좌측: 캐릭터 목록 */}
      <div className="w-80 bg-[var(--bg-secondary)] border-r border-[var(--border-color)] p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-[var(--text-primary)]">캐릭터 관리</h1>
          <Link href="/chat" className="text-sm text-[var(--accent-blue)] hover:text-[var(--accent-blue-hover)]">
            ← 채팅으로
          </Link>
        </div>

        <button
          onClick={handleCreate}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-hover)] text-white rounded-lg font-medium transition-colors mb-4"
        >
          <Plus size={20} />
          새 캐릭터 만들기
        </button>

        <div className="space-y-2">
          {characters.map((character) => (
            <div
              key={character.id}
              onClick={() => {
                setSelectedCharacter(character);
                setIsEditing(false);
                setIsCreating(false);
              }}
              className={`p-4 rounded-lg cursor-pointer transition-colors border ${
                selectedCharacter?.id === character.id
                  ? 'bg-[var(--bg-tertiary)] border-[var(--accent-blue)]'
                  : 'bg-[var(--bg-primary)] border-[var(--border-color)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-[var(--text-primary)] mb-1">{character.name}</h3>
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{character.personality}</p>
                  {character.traits.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {character.traits.slice(0, 3).map((trait, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] rounded">
                          {trait}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {characters.length === 0 && (
            <div className="text-center py-8 text-[var(--text-tertiary)]">
              <p>캐릭터가 없습니다</p>
              <p className="text-sm mt-2">새 캐릭터를 만들어보세요</p>
            </div>
          )}
        </div>
      </div>

      {/* 우측: 캐릭터 상세/편집 */}
      <div className="flex-1 overflow-y-auto">
        {selectedCharacter || isCreating ? (
          <div className="max-w-3xl mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                {isCreating ? '새 캐릭터' : isEditing ? '캐릭터 편집' : '캐릭터 정보'}
              </h2>
              <div className="flex gap-2">
                {!isEditing && !isCreating && (
                  <>
                    <button
                      onClick={() => handleEdit(selectedCharacter!)}
                      className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
                    >
                      <Edit2 size={20} className="text-[var(--text-secondary)]" />
                    </button>
                    {!selectedCharacter?.isDefault && (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
                      >
                        <Trash2 size={20} className="text-red-500" />
                      </button>
                    )}
                  </>
                )}
                {(isEditing || isCreating) && (
                  <>
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-hover)] text-white rounded-lg transition-colors"
                    >
                      <Save size={16} />
                      저장
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setIsCreating(false);
                        if (isCreating) setSelectedCharacter(null);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] rounded-lg transition-colors"
                    >
                      <X size={16} />
                      취소
                    </button>
                  </>
                )}
              </div>
            </div>

            {isEditing || isCreating ? (
              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                    캐릭터 이름 *
                  </label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="예: 루나"
                    className="w-full"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                      1인칭 *
                    </label>
                    <input
                      type="text"
                      value={formData.firstPerson || ''}
                      onChange={(e) => setFormData({ ...formData, firstPerson: e.target.value })}
                      placeholder="예: 나, 저"
                      className="w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                      2인칭 *
                    </label>
                    <input
                      type="text"
                      value={formData.secondPerson || ''}
                      onChange={(e) => setFormData({ ...formData, secondPerson: e.target.value })}
                      placeholder="예: 너, 당신"
                      className="w-full"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                      말투 *
                    </label>
                    <input
                      type="text"
                      value={formData.style || ''}
                      onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                      placeholder="예: 친근한 반말"
                      className="w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                      관계 *
                    </label>
                    <input
                      type="text"
                      value={formData.relationship || ''}
                      onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                      placeholder="예: 친한 친구"
                      className="w-full"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                    성격/행동 *
                  </label>
                  <textarea
                    value={formData.personality || ''}
                    onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                    placeholder="캐릭터의 기본 성격과 행동 패턴을 설명해주세요"
                    rows={6}
                    className="w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                    배경 설정
                  </label>
                  <textarea
                    value={formData.background || ''}
                    onChange={(e) => setFormData({ ...formData, background: e.target.value })}
                    placeholder="캐릭터의 배경 이야기 (선택)"
                    rows={4}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                    특징 태그
                  </label>
                  <input
                    type="text"
                    value={(formData.traits || []).join(', ')}
                    onChange={(e) => setFormData({ ...formData, traits: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                    placeholder="쉼표로 구분 (예: 밝음, 활발함, 긍정적)"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                    안전 규칙
                  </label>
                  <textarea
                    value={formData.safetyRules || ''}
                    onChange={(e) => setFormData({ ...formData, safetyRules: e.target.value })}
                    placeholder="대화 시 지켜야 할 안전 규칙 (선택)"
                    rows={3}
                    className="w-full"
                  />
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-tertiary)] mb-2">기본 정보</h3>
                  <div className="bg-[var(--bg-secondary)] rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">이름:</span>
                      <span className="text-[var(--text-primary)]">{selectedCharacter?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">관계:</span>
                      <span className="text-[var(--text-primary)]">{selectedCharacter?.relationship}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-tertiary)] mb-2">말투/스타일</h3>
                  <div className="bg-[var(--bg-secondary)] rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">1인칭:</span>
                      <span className="text-[var(--text-primary)]">{selectedCharacter?.firstPerson}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">2인칭:</span>
                      <span className="text-[var(--text-primary)]">{selectedCharacter?.secondPerson}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-secondary)]">말투:</span>
                      <span className="text-[var(--text-primary)]">{selectedCharacter?.style}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-tertiary)] mb-2">성격/행동</h3>
                  <div className="bg-[var(--bg-secondary)] rounded-lg p-4">
                    <p className="text-[var(--text-primary)] whitespace-pre-wrap">{selectedCharacter?.personality}</p>
                  </div>
                </div>

                {selectedCharacter?.background && (
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-tertiary)] mb-2">배경</h3>
                    <div className="bg-[var(--bg-secondary)] rounded-lg p-4">
                      <p className="text-[var(--text-primary)] whitespace-pre-wrap">{selectedCharacter.background}</p>
                    </div>
                  </div>
                )}

                {selectedCharacter?.traits && selectedCharacter.traits.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-tertiary)] mb-2">특징</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedCharacter.traits.map((trait, i) => (
                        <span key={i} className="px-3 py-1 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-full text-sm">
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedCharacter?.safetyRules && (
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-tertiary)] mb-2">안전 규칙</h3>
                    <div className="bg-[var(--bg-secondary)] rounded-lg p-4">
                      <p className="text-[var(--text-primary)] whitespace-pre-wrap">{selectedCharacter.safetyRules}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-[var(--text-tertiary)]">
              <p className="text-lg mb-2">캐릭터를 선택하거나 새로 만들어보세요</p>
              <p className="text-sm">왼쪽에서 캐릭터를 클릭하세요</p>
            </div>
          </div>
        )}
      </div>

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-secondary)] rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">캐릭터 삭제</h3>
            <p className="text-[var(--text-secondary)] mb-6">
              정말로 &quot;<span className="text-[var(--text-primary)] font-medium">{selectedCharacter?.name}</span>&quot; 캐릭터를 삭제하시겠습니까?
              <br />
              이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

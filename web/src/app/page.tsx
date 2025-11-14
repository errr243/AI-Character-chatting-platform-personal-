'use client';

import { useEffect, useMemo, useState } from 'react';

type Character = {
  id: number;
  name: string;
  description: string;
  systemPrompt: string;
  createdAt: string;
  updatedAt: string;
};

type Conversation = {
  id: number;
  characterId: number;
  title: string;
  createdAt: string;
};

type Message = {
  id: number;
  conversationId: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
};

async function fetchJSON<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    const error = (payload as { error?: string }).error ?? '알 수 없는 오류가 발생했습니다.';
    throw new Error(error);
  }
  return res.json() as Promise<T>;
}

export default function Home() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState<number | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');

  const [formState, setFormState] = useState({
    name: '',
    description: '',
    systemPrompt: '',
  });

  const selectedCharacter = useMemo(
    () => characters.find((c) => c.id === selectedCharacterId) ?? null,
    [characters, selectedCharacterId]
  );

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedConversationId) ?? null,
    [conversations, selectedConversationId]
  );

  useEffect(() => {
    const loadCharacters = async () => {
      try {
        const data = await fetchJSON<{ characters: Character[] }>('/api/characters');
        setCharacters(data.characters);
        if (data.characters.length > 0) {
          setSelectedCharacterId(data.characters[0].id);
        }
      } catch (error) {
        console.error(error);
      }
    };

    loadCharacters();
  }, []);

  useEffect(() => {
    if (!selectedCharacterId) {
      setConversations([]);
      setSelectedConversationId(null);
      setMessages([]);
      return;
    }

    const loadConversations = async () => {
      try {
        const data = await fetchJSON<{ conversations: Conversation[] }>(
          `/api/conversations?characterId=${selectedCharacterId}`
        );
        setConversations(data.conversations);
        if (data.conversations.length > 0) {
          setSelectedConversationId(data.conversations[0].id);
        } else {
          setSelectedConversationId(null);
        }
      } catch (error) {
        console.error(error);
      }
    };

    loadConversations();
  }, [selectedCharacterId]);

  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      try {
        const data = await fetchJSON<{ messages: Message[] }>(
          `/api/messages?conversationId=${selectedConversationId}`
        );
        setMessages(data.messages);
      } catch (error) {
        console.error(error);
      }
    };

    loadMessages();
  }, [selectedConversationId]);

  useEffect(() => {
    if (selectedCharacter) {
      setFormState({
        name: selectedCharacter.name,
        description: selectedCharacter.description,
        systemPrompt: selectedCharacter.systemPrompt,
      });
    } else {
      setFormState({
        name: '',
        description: '',
        systemPrompt: '',
      });
    }
  }, [selectedCharacter]);

  const handleCharacterSubmit = async () => {
    if (!formState.name.trim()) {
      alert('캐릭터 이름을 입력하세요.');
      return;
    }

    try {
      if (selectedCharacter) {
        const data = await fetchJSON<{ character: Character }>(
          `/api/characters/${selectedCharacter.id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formState),
          }
        );
        setCharacters((prev) =>
          prev.map((character) => (character.id === data.character.id ? data.character : character))
        );
        alert('캐릭터가 저장되었습니다.');
      } else {
        const data = await fetchJSON<{ character: Character }>('/api/characters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formState),
        });
        setCharacters((prev) => [data.character, ...prev]);
        setSelectedCharacterId(data.character.id);
        alert('새 캐릭터가 추가되었습니다.');
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.');
    }
  };

  const handleCharacterDelete = async () => {
    if (!selectedCharacter) return;
    if (!confirm(`'${selectedCharacter.name}' 캐릭터를 삭제할까요?`)) return;

    try {
      await fetchJSON(`/api/characters/${selectedCharacter.id}`, {
        method: 'DELETE',
      });
      const filtered = characters.filter((character) => character.id !== selectedCharacter.id);
      setCharacters(filtered);
      setSelectedCharacterId(filtered[0]?.id ?? null);
      alert('삭제되었습니다.');
    } catch (error) {
      alert(error instanceof Error ? error.message : '삭제 중 오류가 발생했습니다.');
    }
  };

  const handleNewCharacter = () => {
    setSelectedCharacterId(null);
    setSelectedConversationId(null);
    setConversations([]);
    setMessages([]);
    setFormState({
      name: '',
      description: '',
      systemPrompt: '',
    });
  };

  const handleCreateConversation = async () => {
    if (!selectedCharacterId) return;
    const title = prompt('대화 제목을 입력하세요.', '새 대화');
    if (title === null) return;

    try {
      const data = await fetchJSON<{ conversation: Conversation }>('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId: selectedCharacterId, title: title || '새 대화' }),
      });
      const updated = [data.conversation, ...conversations];
      setConversations(updated);
      setSelectedConversationId(data.conversation.id);
    } catch (error) {
      alert(error instanceof Error ? error.message : '대화 생성 중 오류가 발생했습니다.');
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedConversationId) return;

    setIsLoading(true);
    const currentInput = chatInput;
    setChatInput('');

    try {
      const data = await fetchJSON<{ messages: Message[] }>('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: selectedConversationId, content: currentInput }),
      });
      setMessages((prev) => [...prev, ...data.messages]);
    } catch (error) {
      alert(error instanceof Error ? error.message : '메시지 전송 중 오류가 발생했습니다.');
      setChatInput(currentInput);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 text-slate-900">
      <aside className="flex w-full max-w-md flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h1 className="text-lg font-semibold">캐릭터</h1>
          <button
            onClick={handleNewCharacter}
            className="rounded-md border border-slate-200 px-2 py-1 text-sm text-slate-700 hover:bg-slate-100"
          >
            새 캐릭터
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto">
          <div className="border-b border-slate-200 px-6 py-4">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-600">이름</span>
              <input
                className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                value={formState.name}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="캐릭터 이름"
              />
            </label>

            <label className="mt-4 flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-600">설명</span>
              <textarea
                className="min-h-[60px] rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                value={formState.description}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, description: event.target.value }))
                }
                placeholder="간단한 캐릭터 설명"
              />
            </label>

            <label className="mt-4 flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-600">시스템 프롬프트</span>
              <textarea
                className="min-h-[120px] rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                value={formState.systemPrompt}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, systemPrompt: event.target.value }))
                }
                placeholder="모델에게 줄 지침을 입력하세요."
              />
            </label>

            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={handleCharacterSubmit}
                className="flex-1 rounded-md bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-50"
                disabled={!formState.name.trim()}
              >
                {selectedCharacter ? '캐릭터 수정' : '캐릭터 생성'}
              </button>
              {selectedCharacter && (
                <button
                  onClick={handleCharacterDelete}
                  className="rounded-md border border-rose-200 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                >
                  삭제
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-600">캐릭터 목록</h2>
            <div className="space-y-2">
              {characters.length === 0 && (
                <p className="text-sm text-slate-500">아직 캐릭터가 없습니다.</p>
              )}
              {characters.map((character) => (
                <button
                  key={character.id}
                  onClick={() => setSelectedCharacterId(character.id)}
                  className={`w-full rounded-md border px-3 py-2 text-left text-sm transition ${
                    selectedCharacterId === character.id
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-medium">{character.name}</div>
                  {character.description && (
                    <div className="mt-1 max-h-12 overflow-hidden text-xs opacity-80">
                      {character.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-200 px-6 py-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-600">대화</h2>
              <button
                onClick={handleCreateConversation}
                className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                disabled={!selectedCharacterId}
              >
                새 대화
              </button>
            </div>
            <div className="space-y-2">
              {conversations.length === 0 && (
                <p className="text-sm text-slate-500">아직 대화가 없습니다.</p>
              )}
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedConversationId(conversation.id)}
                  className={`w-full rounded-md border px-3 py-2 text-left text-sm transition ${
                    selectedConversationId === conversation.id
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="font-medium">{conversation.title}</div>
                  <div className="mt-1 text-xs opacity-70">
                    {new Date(conversation.createdAt).toLocaleString()}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      <main className="flex flex-1 flex-col">
        {selectedConversation ? (
          <>
            <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
              <div>
                <h2 className="text-lg font-semibold">{selectedConversation.title}</h2>
                {selectedCharacter && (
                  <p className="text-sm text-slate-500">
                    캐릭터: <span className="font-medium">{selectedCharacter.name}</span>
                  </p>
                )}
              </div>
              <div className="rounded-md border border-slate-200 px-3 py-1 text-xs text-slate-500">
                {new Date(selectedConversation.createdAt).toLocaleString()}
              </div>
            </header>

            <section className="flex-1 overflow-y-auto bg-slate-50 px-8 py-6">
              {messages.length === 0 && (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  아직 메시지가 없습니다. 아래 입력창에서 대화를 시작하세요.
                </div>
              )}
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xl rounded-lg px-4 py-3 text-sm shadow-sm ${
                        message.role === 'user' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'
                      }`}
                    >
                      <div className="text-xs font-semibold uppercase tracking-wide opacity-70">
                        {message.role === 'user' ? '나' : selectedCharacter?.name ?? 'AI'}
                      </div>
                      <p className="mt-2 whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      <div className="mt-2 text-[11px] opacity-60">
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <footer className="border-t border-slate-200 bg-white px-8 py-4">
              <div className="flex gap-3">
                <textarea
                  className="min-h-[70px] flex-1 resize-none rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                  placeholder="메시지를 입력하세요..."
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || !chatInput.trim()}
                  className="h-[70px] min-w-[120px] rounded-md bg-slate-900 text-sm text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? '전송 중...' : '전송'}
                </button>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-slate-500">
            <p className="text-lg font-medium">대화를 선택하거나 새 대화를 만들어 시작하세요.</p>
            <p className="text-sm">왼쪽에서 캐릭터를 선택하고 대화를 생성할 수 있습니다.</p>
          </div>
        )}
      </main>
    </div>
  );
}

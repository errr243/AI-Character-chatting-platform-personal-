import db from './db';

export interface Character {
  id: number;
  name: string;
  description: string;
  systemPrompt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: number;
  characterId: number;
  title: string;
  createdAt: string;
}

export interface Message {
  id: number;
  conversationId: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

type CharacterRow = {
  id: number;
  name: string;
  description: string | null;
  system_prompt: string | null;
  created_at: string;
  updated_at: string;
};

type ConversationRow = {
  id: number;
  character_id: number;
  title: string;
  created_at: string;
};

type MessageRow = {
  id: number;
  conversation_id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
};

const serializeCharacter = (row: CharacterRow): Character => ({
  id: row.id,
  name: row.name,
  description: row.description ?? '',
  systemPrompt: row.system_prompt ?? '',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const serializeConversation = (row: ConversationRow): Conversation => ({
  id: row.id,
  characterId: row.character_id,
  title: row.title,
  createdAt: row.created_at,
});

const serializeMessage = (row: MessageRow): Message => ({
  id: row.id,
  conversationId: row.conversation_id,
  role: row.role,
  content: row.content,
  createdAt: row.created_at,
});

export const listCharacters = (): Character[] => {
  const stmt = db.prepare(`SELECT * FROM characters ORDER BY created_at DESC`);
  return (stmt.all() as CharacterRow[]).map(serializeCharacter);
};

export const getCharacter = (id: number): Character | undefined => {
  const stmt = db.prepare(`SELECT * FROM characters WHERE id = ?`);
  const row = stmt.get(id) as CharacterRow | undefined;
  return row ? serializeCharacter(row) : undefined;
};

export const createCharacter = (data: {
  name: string;
  description?: string;
  systemPrompt?: string;
}): Character => {
  const stmt = db.prepare(
    `INSERT INTO characters (name, description, system_prompt) VALUES (@name, @description, @system_prompt)`
  );
  const info = stmt.run({
    name: data.name,
    description: data.description ?? '',
    system_prompt: data.systemPrompt ?? '',
  });
  return getCharacter(Number(info.lastInsertRowid))!;
};

export const updateCharacter = (
  id: number,
  data: { name?: string; description?: string; systemPrompt?: string }
): Character | undefined => {
  const existing = getCharacter(id);
  if (!existing) return undefined;

  const stmt = db.prepare(`
    UPDATE characters
    SET
      name = COALESCE(@name, name),
      description = COALESCE(@description, description),
      system_prompt = COALESCE(@system_prompt, system_prompt),
      updated_at = datetime('now')
    WHERE id = @id
  `);

  stmt.run({
    id,
    name: data.name,
    description: data.description,
    system_prompt: data.systemPrompt,
  });

  return getCharacter(id);
};

export const deleteCharacter = (id: number): void => {
  const stmt = db.prepare(`DELETE FROM characters WHERE id = ?`);
  stmt.run(id);
};

export const listConversations = (characterId: number): Conversation[] => {
  const stmt = db.prepare(
    `SELECT * FROM conversations WHERE character_id = ? ORDER BY created_at DESC`
  );
  return (stmt.all(characterId) as ConversationRow[]).map(serializeConversation);
};

export const getConversation = (id: number): Conversation | undefined => {
  const stmt = db.prepare(`SELECT * FROM conversations WHERE id = ?`);
  const row = stmt.get(id) as ConversationRow | undefined;
  return row ? serializeConversation(row) : undefined;
};

export const createConversation = (data: {
  characterId: number;
  title?: string;
}): Conversation => {
  const stmt = db.prepare(
    `INSERT INTO conversations (character_id, title) VALUES (@character_id, @title)`
  );
  const info = stmt.run({
    character_id: data.characterId,
    title: data.title ?? '새 대화',
  });
  return getConversation(Number(info.lastInsertRowid))!;
};

export const createMessage = (data: {
  conversationId: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
}): Message => {
  const stmt = db.prepare(
    `INSERT INTO messages (conversation_id, role, content) VALUES (@conversation_id, @role, @content)`
  );
  const info = stmt.run({
    conversation_id: data.conversationId,
    role: data.role,
    content: data.content,
  });
  return getMessage(Number(info.lastInsertRowid))!;
};

export const listMessages = (conversationId: number): Message[] => {
  const stmt = db.prepare(
    `SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC`
  );
  return (stmt.all(conversationId) as MessageRow[]).map(serializeMessage);
};

export const getMessage = (id: number): Message | undefined => {
  const stmt = db.prepare(`SELECT * FROM messages WHERE id = ?`);
  const row = stmt.get(id) as MessageRow | undefined;
  return row ? serializeMessage(row) : undefined;
};


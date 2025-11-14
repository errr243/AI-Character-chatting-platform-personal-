import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createMessage,
  getCharacter,
  getConversation,
  listMessages,
} from '@/lib/repository';
import { generateAssistantMessage } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

const createSchema = z.object({
  conversationId: z.coerce.number().int().positive(),
  content: z.string().min(1, '메시지 내용이 필요합니다.'),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const conversationIdParam = searchParams.get('conversationId');
  const conversationId = conversationIdParam ? Number(conversationIdParam) : null;

  if (!conversationId || !Number.isInteger(conversationId) || conversationId < 1) {
    return NextResponse.json(
      { error: 'conversationId 쿼리가 필요합니다.' },
      { status: 400 }
    );
  }

  const messages = listMessages(conversationId);
  return NextResponse.json({ messages });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: '요청 본문이 잘못되었습니다.', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { conversationId, content } = parsed.data;
  const conversation = getConversation(conversationId);

  if (!conversation) {
    return NextResponse.json({ error: '대화를 찾을 수 없습니다.' }, { status: 404 });
  }

  const character = getCharacter(conversation.characterId);
  if (!character) {
    return NextResponse.json({ error: '캐릭터를 찾을 수 없습니다.' }, { status: 404 });
  }

  const historyBefore = listMessages(conversationId);
  const userMessage = createMessage({
    conversationId,
    role: 'user',
    content,
  });

  try {
    const assistantText = await generateAssistantMessage({
      character,
      history: [...historyBefore, userMessage],
      userMessage: content,
    });

    const assistantMessage = createMessage({
      conversationId,
      role: 'assistant',
      content: assistantText,
    });

    return NextResponse.json({ messages: [userMessage, assistantMessage] }, { status: 201 });
  } catch (error) {
    console.error('Gemini 호출 실패:', error);
    return NextResponse.json(
      {
        error: 'Gemini 호출 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

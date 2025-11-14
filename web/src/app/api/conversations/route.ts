import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createConversation,
  getCharacter,
  listConversations,
} from '@/lib/repository';

export const dynamic = 'force-dynamic';

const createSchema = z.object({
  characterId: z.coerce.number().int().positive(),
  title: z.string().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const characterIdParam = searchParams.get('characterId');
  const characterId = characterIdParam ? Number(characterIdParam) : null;

  if (!characterId || !Number.isInteger(characterId) || characterId < 1) {
    return NextResponse.json({ error: 'characterId 쿼리가 필요합니다.' }, { status: 400 });
  }

  const conversations = listConversations(characterId);
  return NextResponse.json({ conversations });
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

  const character = getCharacter(parsed.data.characterId);
  if (!character) {
    return NextResponse.json({ error: '캐릭터를 찾을 수 없습니다.' }, { status: 404 });
  }

  const conversation = createConversation(parsed.data);
  return NextResponse.json({ conversation }, { status: 201 });
}

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createCharacter, listCharacters } from '@/lib/repository';

export const dynamic = 'force-dynamic';

const createSchema = z.object({
  name: z.string().min(1, '이름은 필수입니다.'),
  description: z.string().optional(),
  systemPrompt: z.string().optional(),
});

export async function GET() {
  const characters = listCharacters();
  return NextResponse.json({ characters });
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

  const character = createCharacter(parsed.data);
  return NextResponse.json({ character }, { status: 201 });
}

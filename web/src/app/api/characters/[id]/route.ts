import { NextResponse } from 'next/server';
import { z } from 'zod';
import { deleteCharacter, getCharacter, updateCharacter } from '@/lib/repository';

export const dynamic = 'force-dynamic';

const updateSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  systemPrompt: z.string().optional(),
});

const parseId = (idParam: string) => {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const id = parseId(params.id);
  if (!id) {
    return NextResponse.json({ error: '잘못된 ID입니다.' }, { status: 400 });
  }

  const character = getCharacter(id);
  if (!character) {
    return NextResponse.json({ error: '캐릭터를 찾을 수 없습니다.' }, { status: 404 });
  }

  return NextResponse.json({ character });
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const id = parseId(params.id);
  if (!id) {
    return NextResponse.json({ error: '잘못된 ID입니다.' }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: '요청 본문이 잘못되었습니다.', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const character = updateCharacter(id, parsed.data);
  if (!character) {
    return NextResponse.json({ error: '캐릭터를 찾을 수 없습니다.' }, { status: 404 });
  }

  return NextResponse.json({ character });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const id = parseId(params.id);
  if (!id) {
    return NextResponse.json({ error: '잘못된 ID입니다.' }, { status: 400 });
  }

  const existing = getCharacter(id);
  if (!existing) {
    return NextResponse.json({ error: '캐릭터를 찾을 수 없습니다.' }, { status: 404 });
  }

  deleteCharacter(id);
  return NextResponse.json({ success: true });
}

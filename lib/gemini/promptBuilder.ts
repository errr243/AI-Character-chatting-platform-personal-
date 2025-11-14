import type { Character } from './types';

export function buildCharacterPrompt(character: Character): string {
  const sections = [];

  // 캐릭터 정보
  sections.push(`[캐릭터 정보]`);
  sections.push(`- 이름: ${character.name}`);
  sections.push(`- 관계: ${character.relationship}`);
  
  if (character.background) {
    sections.push(`- 배경: ${character.background}`);
  }

  // 말투/스타일
  sections.push(`\n[말투/스타일]`);
  sections.push(`- 1인칭: ${character.firstPerson}`);
  sections.push(`- 2인칭: ${character.secondPerson}`);
  sections.push(`- 말투: ${character.style}`);

  // 성격/행동
  sections.push(`\n[성격/행동]`);
  sections.push(character.personality);
  
  if (character.traits && character.traits.length > 0) {
    sections.push(`\n주요 특징: ${character.traits.join(', ')}`);
  }

  // 안전 규칙
  if (character.safetyRules) {
    sections.push(`\n[안전 규칙]`);
    sections.push(character.safetyRules);
  } else {
    sections.push(`\n[안전 규칙]`);
    sections.push(`- 존중하고 배려하는 대화를 합니다.`);
    sections.push(`- 현실 개인정보에 대해 추측하지 않습니다.`);
    sections.push(`- 과도한 폭력적/성적 표현은 완곡하게 표현합니다.`);
  }

  sections.push(`\n위 설정에 따라 자연스럽게 역할을 수행하세요.`);

  return sections.join('\n');
}


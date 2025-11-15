import { NextRequest, NextResponse } from 'next/server';

// API 키 상태 확인 엔드포인트 (개발/디버깅용)
export async function GET(request: NextRequest) {
  try {
    // 환경 변수에서 모든 API 키 확인
    const envKeys = [
      { name: 'GOOGLE_GEMINI_API_KEY', value: process.env.GOOGLE_GEMINI_API_KEY },
      { name: 'GOOGLE_GEMINI_API_KEY_2', value: process.env.GOOGLE_GEMINI_API_KEY_2 },
      { name: 'GOOGLE_GEMINI_API_KEY_3', value: process.env.GOOGLE_GEMINI_API_KEY_3 },
      { name: 'GOOGLE_GEMINI_API_KEY_4', value: process.env.GOOGLE_GEMINI_API_KEY_4 },
      { name: 'GOOGLE_GEMINI_API_KEY_5', value: process.env.GOOGLE_GEMINI_API_KEY_5 },
    ];

    const availableKeys = envKeys
      .filter(key => key.value)
      .map(key => ({
        name: key.name,
        // 보안: 키의 일부만 표시 (처음 10자 + ... + 마지막 4자)
        preview: key.value 
          ? `${key.value.substring(0, 10)}...${key.value.substring(key.value.length - 4)}`
          : '없음',
        length: key.value?.length || 0,
      }));

    return NextResponse.json({
      success: true,
      totalKeys: availableKeys.length,
      availableKeys,
      message: availableKeys.length > 0 
        ? `${availableKeys.length}개의 API 키가 설정되어 있습니다.`
        : '설정된 API 키가 없습니다.',
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'API 키 확인 중 오류 발생',
      },
      { status: 500 }
    );
  }
}


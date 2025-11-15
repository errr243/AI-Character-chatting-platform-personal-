// API 키 초기화 스크립트
// 브라우저 콘솔에서 실행하거나, 개발 환경에서 한 번 실행

const API_KEYS = [
  {
    name: '키 1',
    key: 'AIzaSyDtulVtqCr1NaxxSRYJlVo6vqDx8ViMpRk',
  },
  {
    name: '키 2',
    key: 'AIzaSyCgPHtj3tNeQbaOfHUR8uF-_YZFX6NfBnc',
  },
];

function initApiKeys() {
  if (typeof window === 'undefined') {
    console.log('이 스크립트는 브라우저 환경에서만 실행할 수 있습니다.');
    return;
  }

  try {
    const STORAGE_KEY = 'gemini_api_keys';
    const existingKeys = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    
    // 이미 존재하는 키인지 확인
    const existingKeyValues = existingKeys.map((k) => k.key);
    
    let addedCount = 0;
    API_KEYS.forEach((apiKey) => {
      if (!existingKeyValues.includes(apiKey.key)) {
        const newKey = {
          id: `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          key: apiKey.key,
          name: apiKey.name,
          isActive: true,
          createdAt: Date.now(),
        };
        existingKeys.push(newKey);
        addedCount++;
        console.log(`✅ API 키 추가됨: ${apiKey.name}`);
      } else {
        console.log(`⏭️  이미 존재하는 키: ${apiKey.name}`);
      }
    });
    
    if (addedCount > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existingKeys));
      console.log(`\n🎉 총 ${addedCount}개의 API 키가 추가되었습니다!`);
      console.log('페이지를 새로고침하면 설정에서 확인할 수 있습니다.');
    } else {
      console.log('\n✅ 모든 API 키가 이미 추가되어 있습니다.');
    }
  } catch (error) {
    console.error('❌ API 키 초기화 실패:', error);
  }
}

// 브라우저에서 직접 실행 가능하도록
if (typeof window !== 'undefined') {
  window.initApiKeys = initApiKeys;
  console.log('💡 initApiKeys() 함수를 실행하여 API 키를 추가할 수 있습니다.');
}

// Node.js 환경에서도 실행 가능하도록
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initApiKeys, API_KEYS };
}


/**
 * Rise of the Half Moon (떠오르는 반달)
 * 달의 위상 데이터 및 SVG 렌더러
 */

const MOON_PHASES = [
  {
    id: 0,
    name: '신월 (삭)',
    english: 'New Moon',
    illumination: 0.0,
    desc: '달이 태양과 지구 사이에 있어 어둡게 보이는 상태',
    color: '#3949ab',
    complementId: 4
  },
  {
    id: 1,
    name: '초승달',
    english: 'Waxing Crescent',
    illumination: 0.25,
    desc: '오른쪽 가장자리가 눈썹 모양으로 얇게 차오르는 달',
    color: '#4fc3f7',
    complementId: 5
  },
  {
    id: 2,
    name: '상현달',
    english: 'First Quarter',
    illumination: 0.5,
    desc: '오른쪽 절반이 환하게 빛나는 반달',
    color: '#81d4fa',
    complementId: 6
  },
  {
    id: 3,
    name: '차오르는 달',
    english: 'Waxing Gibbous',
    illumination: 0.75,
    desc: '상현달을 지나 보름달로 점차 부풀어 오르는 달',
    color: '#fff59d',
    complementId: 7
  },
  {
    id: 4,
    name: '보름달 (망)',
    english: 'Full Moon',
    illumination: 1.0,
    desc: '태양빛을 온전히 받아 둥글고 환하게 빛나는 달',
    color: '#fff9c4',
    complementId: 0
  },
  {
    id: 5,
    name: '이지러지는 달',
    english: 'Waning Gibbous',
    illumination: 0.75,
    desc: '보름달을 지나 왼쪽을 향해 서서히 줄어드는 달',
    color: '#ffe082',
    complementId: 1
  },
  {
    id: 6,
    name: '하현달',
    english: 'Last Quarter',
    illumination: 0.5,
    desc: '왼쪽 절반이 밝게 빛나는 반달',
    color: '#ffb74d',
    complementId: 2
  },
  {
    id: 7,
    name: '그믐달',
    english: 'Waning Crescent',
    illumination: 0.25,
    desc: '왼쪽 가장자리에 눈썹처럼 얇게 남은 달',
    color: '#ff8a65',
    complementId: 3
  }
];

/**
 * 달의 위상 SVG 그래픽 생성 함수
 */
function renderMoonSVG(phaseId, size = 64) {
  const phase = MOON_PHASES[phaseId];
  if (!phase) return '';

  const id = phase.id;
  const gradientId = `moonLightGrad_${id}`;
  const craterId = `craterPattern_${id}`;

  let illuminatedPath = '';
  if (id === 0) {
    // 신월(삭): 어두운 달에 은은한 푸른빛 코로나
    illuminatedPath = '';
  } else if (id === 1) {
    // 초승달 (오른쪽 얇은 슬라이스)
    illuminatedPath = `<path d="M 50 12 A 38 38 0 0 1 50 88 A 20 38 0 0 0 50 12 Z" fill="url(#${gradientId})" />`;
  } else if (id === 2) {
    // 상현달 (오른쪽 절반)
    illuminatedPath = `<path d="M 50 12 A 38 38 0 0 1 50 88 L 50 12 Z" fill="url(#${gradientId})" />`;
  } else if (id === 3) {
    // 차오르는 달 (오른쪽 전체 + 왼쪽으로 볼록)
    illuminatedPath = `<path d="M 50 12 A 38 38 0 0 1 50 88 A 20 38 0 0 1 50 12 Z" fill="url(#${gradientId})" />`;
  } else if (id === 4) {
    // 보름달 (완전한 원)
    illuminatedPath = `<circle cx="50" cy="50" r="38" fill="url(#${gradientId})" />`;
  } else if (id === 5) {
    // 이지러지는 달 (왼쪽 전체 + 오른쪽으로 볼록)
    illuminatedPath = `<path d="M 50 12 A 38 38 0 0 0 50 88 A 20 38 0 0 0 50 12 Z" fill="url(#${gradientId})" />`;
  } else if (id === 6) {
    // 하현달 (왼쪽 절반)
    illuminatedPath = `<path d="M 50 12 A 38 38 0 0 0 50 88 L 50 12 Z" fill="url(#${gradientId})" />`;
  } else if (id === 7) {
    // 그믐달 (왼쪽 얇은 슬라이스)
    illuminatedPath = `<path d="M 50 12 A 38 38 0 0 0 50 88 A 20 38 0 0 1 50 12 Z" fill="url(#${gradientId})" />`;
  }

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 100 100" class="moon-svg phase-${id}">
      <defs>
        <!-- 달 표면 빛 그라디언트 -->
        <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="60%" stop-color="#fff9c4" />
          <stop offset="100%" stop-color="#ffe082" />
        </linearGradient>
        <!-- 달의 음영/바다 패턴 -->
        <radialGradient id="${craterId}" cx="45%" cy="40%" r="50%">
          <stop offset="0%" stop-color="#2a2e4a" />
          <stop offset="70%" stop-color="#161828" />
          <stop offset="100%" stop-color="#0e101c" />
        </radialGradient>
      </defs>

      <!-- 어두운 달 베이스 -->
      <circle cx="50" cy="50" r="38" fill="url(#${craterId})" stroke="rgba(255,255,255,0.18)" stroke-width="1.5" />

      <!-- 어두운 면 크레이터 자국 -->
      <circle cx="42" cy="38" r="7" fill="rgba(255,255,255,0.04)" />
      <circle cx="58" cy="58" r="9" fill="rgba(255,255,255,0.03)" />
      <circle cx="36" cy="62" r="5" fill="rgba(255,255,255,0.035)" />
      <circle cx="60" cy="36" r="4.5" fill="rgba(255,255,255,0.04)" />

      <!-- 밝게 비추는 위상 영역 -->
      ${illuminatedPath}

      <!-- 신월 특수 후광 (신월일 때 은은한 림 라이트) -->
      ${id === 0 ? `
        <circle cx="50" cy="50" r="38" fill="none" stroke="#7986cb" stroke-width="2" opacity="0.45" stroke-dasharray="2,3" />
        <circle cx="50" cy="50" r="3" fill="#9fa8da" opacity="0.6" />
      ` : ''}

      <!-- 보름달 표면 바다(크레이터) 음영 -->
      ${id === 4 ? `
        <ellipse cx="44" cy="36" rx="8" ry="6" fill="rgba(180, 160, 120, 0.22)" />
        <ellipse cx="58" cy="48" rx="10" ry="7" fill="rgba(180, 160, 120, 0.25)" />
        <ellipse cx="40" cy="62" rx="7" ry="5" fill="rgba(180, 160, 120, 0.2)" />
        <circle cx="58" cy="66" r="4" fill="rgba(180, 160, 120, 0.18)" />
      ` : ''}

      <!-- 외곽 테두리 하이라이트 -->
      <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1" />
    </svg>
  `;
}

/**
 * 두 카드가 동일 위상 쌍(Phase Pair)인지 확인 (1점)
 */
function isPhasePair(cardA, cardB) {
  if (!cardA || !cardB) return false;
  return cardA.id === cardB.id;
}

/**
 * 두 카드가 보름달 쌍(Full Moon Pair)인지 확인 (2점)
 * 서로 합치면 보름달이 되는 조합: |phaseA - phaseB| === 4
 */
function isFullMoonPair(cardA, cardB) {
  if (!cardA || !cardB) return false;
  return Math.abs(cardA.id - cardB.id) === 4;
}

/**
 * 세 장 이상의 카드가 달의 주기(Lunar Cycle)를 이루는지 판별
 * 예: 0->1->2, 7->0->1, 6->5->4 (연속 순방향 또는 역방향)
 */
function isLunarCycle(cards) {
  if (!cards || cards.length < 3) return false;
  return checkConsecutiveSequence(cards);
}

function checkConsecutiveSequence(cards) {
  const ids = cards.map(c => c.id);
  const n = ids.length;

  // 순방향 검사: (ids[i] + 1) % 8 === ids[i+1]
  let forwardValid = true;
  for (let i = 0; i < n - 1; i++) {
    if ((ids[i] + 1) % 8 !== ids[i + 1]) {
      forwardValid = false;
      break;
    }
  }
  if (forwardValid) return true;

  // 역방향 검사: (ids[i] - 1 + 8) % 8 === ids[i+1]
  let backwardValid = true;
  for (let i = 0; i < n - 1; i++) {
    if ((ids[i] - 1 + 8) % 8 !== ids[i + 1]) {
      backwardValid = false;
      break;
    }
  }
  return backwardValid;
}

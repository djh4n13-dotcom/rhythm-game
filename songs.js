/* =====================================================
   songs.js — 곡 목록
   새 곡 추가하려면 아래 배열에 항목 하나 추가하면 돼요.
   ===================================================== */

window.SONGS = [
  {
    id:          'fFQHzKDq7C0',
    title:       '蜜月アン・ドゥ・トロワ',
    artist:      'DATEKEN (Nyanko Cover)',
    bpm:         190,
    beatsPerBar: 3,
    offset:      7600,
    difficulty:  'EASY',
    color:       '#a78bfa',
    // 이 곡 전용 채보 (없으면 기본 chart.js 사용)
    chart:       null,
  },
  {
    id:          'dQw4w9WgXcQ',
    title:       'Never Gonna Give You Up',
    artist:      'Rick Astley',
    bpm:         113,
    beatsPerBar: 4,
    offset:      1500,
    difficulty:  'EASY',
    color:       '#f472b6',
    chart:       null,
  },
  {
    id:          'ktvTqknDobU',
    title:       'Ievan Polkka',
    artist:      'Hatsune Miku',
    bpm:         163,
    beatsPerBar: 4,
    offset:      1200,
    difficulty:  'NORMAL',
    color:       '#5b9cf6',
    chart:       null,
  },
  {
    id:          '6FNHe3kf8_s',
    title:       'Nekozilla',
    artist:      'Different Heaven',
    bpm:         174,
    beatsPerBar: 4,
    offset:      1400,
    difficulty:  'NORMAL',
    color:       '#fb923c',
    chart:       null,
  },
  {
    id:          'CUSTOM',
    title:       '+ 직접 입력',
    artist:      'YouTube URL로 추가',
    bpm:         120,
    beatsPerBar: 4,
    offset:      1000,
    difficulty:  '',
    color:       '#475569',
    chart:       null,
    isCustom:    true,
  },
];

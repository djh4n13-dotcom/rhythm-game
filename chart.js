/* =====================================================
   chart.js  –  蜜月アン・ドゥ・トロワ (Honeymoon Un Deux Trois)
   Composed by DATEKEN  |  3/4 Jazz Waltz
   BPM: 190  (1박 = ~315ms)
   박자: 3/4  → 1마디 = 3박
   YouTube: fFQHzKDq7C0  (Nyanko 커버 인스트루멘탈)

   ★ 박자 안 맞으면 startOffset 조정:
      노트 빨리 나옴 → startOffset 늘림
      노트 늦게 나옴 → startOffset 줄임
   ===================================================== */

window.CHART_CONFIG = {
  BPM:           190,   // ← BPM 여기서 바꾸세요
  BEATS_PER_BAR: 3,     // 3/4박자 왈츠
  startOffset:   7600,  // ← 첫 비트 시작 위치 (ms). 노트가 늦으면 줄이고, 빠르면 늘리세요
};

window.buildChart = function () {
  const { BPM, BEATS_PER_BAR, startOffset } = window.CHART_CONFIG;
  const BEAT = 60000 / BPM;           // 1박 길이 (ms) ≈ 315ms
  const BAR  = BEAT * BEATS_PER_BAR;  // 1마디 길이 ≈ 947ms

  // t(마디, 박)  마디/박 모두 1부터 시작
  // sub: 8분음표 단위 오프셋 (0=정박, 1=뒤박)
  function t(bar, beat, sub = 0) {
    return startOffset
      + (bar - 1) * BAR
      + (beat - 1) * BEAT
      + sub * (BEAT / 2);
  }

  /* ──────────────────────────────────────────────────
     채보 설계 원칙 (쉬움)
     · 왈츠 강박(1박)에 무거운 노트 배치
     · 2·3박에 가벼운 단타
     · DF / JK는 코러스 강박에만 사용
     · 노트 간격 최소 BEAT 이상 유지
  ────────────────────────────────────────────────── */
  const chart = [

    // ══ INTRO — 피아노 전주 (1~4마디) ════════════════
    { time: t(1,1), type: 'd' },
    { time: t(1,2), type: 'j' },
    { time: t(1,3), type: 'f' },

    { time: t(2,1), type: 'k' },
    { time: t(2,2), type: 'd' },
    { time: t(2,3), type: 'j' },

    { time: t(3,1), type: 'f' },
    { time: t(3,2), type: 'k' },
    { time: t(3,3), type: 'd' },

    { time: t(4,1), type: 'j' },
    { time: t(4,3), type: 'f' },

    // ══ INTRO B (5~8마디) ════════════════════════════
    { time: t(5,1), type: 'd' },
    { time: t(5,2), type: 'f' },
    { time: t(5,3), type: 'j' },

    { time: t(6,1), type: 'k' },
    { time: t(6,2), type: 'j' },
    { time: t(6,3), type: 'd' },

    { time: t(7,1), type: 'f' },
    { time: t(7,2), type: 'k' },
    { time: t(7,3), type: 'j' },

    { time: t(8,1), type: 'd' },
    { time: t(8,3), type: 'k' },

    // ══ VERSE 1 (9~20마디) ═══════════════════════════
    // "誰もいなくなった"
    { time: t(9,1),  type: 'd' },
    { time: t(9,2),  type: 'j' },
    { time: t(9,3),  type: 'f' },

    { time: t(10,1), type: 'k' },
    { time: t(10,3), type: 'd' },

    { time: t(11,1), type: 'j' },
    { time: t(11,2), type: 'f' },
    { time: t(11,3), type: 'k' },

    { time: t(12,1), type: 'd' },
    { time: t(12,3), type: 'j' },

    { time: t(13,1), type: 'f' },
    { time: t(13,2), type: 'k' },
    { time: t(13,3), type: 'd' },

    { time: t(14,1), type: 'j' },
    { time: t(14,3), type: 'f' },

    { time: t(15,1), type: 'k' },
    { time: t(15,2), type: 'd' },
    { time: t(15,3), type: 'j' },

    { time: t(16,1), type: 'f' },
    { time: t(16,3), type: 'k' },

    // "機械仕掛けの時計が"
    { time: t(17,1), type: 'd' },
    { time: t(17,2), type: 'j' },
    { time: t(17,3), type: 'f' },

    { time: t(18,1), type: 'k' },
    { time: t(18,2), type: 'd' },
    { time: t(18,3), type: 'j' },

    { time: t(19,1), type: 'f' },
    { time: t(19,3), type: 'k' },

    { time: t(20,1), type: 'd' },
    { time: t(20,2), type: 'j' },
    { time: t(20,3), type: 'f' },

    // ══ PRE-CHORUS (21~28마디) ════════════════════════
    // "夕焼けが空を染めた"
    { time: t(21,1), type: 'k' },
    { time: t(21,2), type: 'd' },
    { time: t(21,3), type: 'j' },

    { time: t(22,1), type: 'f' },
    { time: t(22,2), type: 'k' },
    { time: t(22,3), type: 'd' },

    { time: t(23,1), type: 'j' },
    { time: t(23,2), type: 'f' },
    { time: t(23,3), type: 'k' },

    { time: t(24,1), type: 'd' },
    { time: t(24,3), type: 'j' },

    { time: t(25,1), type: 'f' },
    { time: t(25,2), type: 'k' },
    { time: t(25,3), type: 'd' },

    { time: t(26,1), type: 'j' },
    { time: t(26,2), type: 'f' },
    { time: t(26,3), type: 'k' },

    { time: t(27,1), type: 'd' },
    { time: t(27,2), type: 'j' },
    { time: t(27,3), type: 'f' },

    { time: t(28,1), type: 'k' },
    { time: t(28,3), type: 'd' },

    // ══ CHORUS 1 (29~40마디) — "Chasse 'n' Whisk" ═══
    { time: t(29,1), type: 'df' },
    { time: t(29,2), type: 'j' },
    { time: t(29,3), type: 'k' },

    { time: t(30,1), type: 'd' },
    { time: t(30,2), type: 'f' },
    { time: t(30,3), type: 'j' },

    { time: t(31,1), type: 'jk' },
    { time: t(31,2), type: 'd' },
    { time: t(31,3), type: 'f' },

    { time: t(32,1), type: 'k' },
    { time: t(32,2), type: 'j' },
    { time: t(32,3), type: 'd' },

    { time: t(33,1), type: 'df' },
    { time: t(33,2), type: 'k' },
    { time: t(33,3), type: 'j' },

    { time: t(34,1), type: 'f' },
    { time: t(34,2), type: 'd' },
    { time: t(34,3), type: 'k' },

    { time: t(35,1), type: 'jk' },
    { time: t(35,2), type: 'f' },
    { time: t(35,3), type: 'd' },

    { time: t(36,1), type: 'j' },
    { time: t(36,2), type: 'k' },
    { time: t(36,3), type: 'f' },

    // "Honeymoon Un Deux Trois" — 코러스 클라이맥스
    { time: t(37,1), type: 'df' },
    { time: t(37,2), type: 'j' },
    { time: t(37,3), type: 'k' },

    { time: t(38,1), type: 'jk' },
    { time: t(38,2), type: 'd' },
    { time: t(38,3), type: 'f' },

    { time: t(39,1), type: 'df' },
    { time: t(39,3), type: 'jk' },

    { time: t(40,1), type: 'd' },
    { time: t(40,2), type: 'j' },
    { time: t(40,3), type: 'k' },

    // ══ CHORUS 1 후반 (41~48마디) — "Singin' Swingin'" ═
    { time: t(41,1), type: 'f' },
    { time: t(41,2), type: 'd' },
    { time: t(41,3), type: 'j' },

    { time: t(42,1), type: 'k' },
    { time: t(42,2), type: 'f' },
    { time: t(42,3), type: 'd' },

    { time: t(43,1), type: 'df' },
    { time: t(43,2), type: 'j' },
    { time: t(43,3), type: 'k' },

    { time: t(44,1), type: 'jk' },
    { time: t(44,3), type: 'd' },

    { time: t(45,1), type: 'f' },
    { time: t(45,2), type: 'k' },
    { time: t(45,3), type: 'j' },

    { time: t(46,1), type: 'd' },
    { time: t(46,2), type: 'f' },
    { time: t(46,3), type: 'k' },

    { time: t(47,1), type: 'j' },
    { time: t(47,2), type: 'd' },
    { time: t(47,3), type: 'f' },

    { time: t(48,1), type: 'df' },
    { time: t(48,2), type: 'jk' },
    { time: t(48,3), type: 'd' },

    // ══ VERSE 2 (49~60마디) ══════════════════════════
    { time: t(49,1), type: 'j' },
    { time: t(49,2), type: 'k' },
    { time: t(49,3), type: 'f' },

    { time: t(50,1), type: 'd' },
    { time: t(50,3), type: 'j' },

    { time: t(51,1), type: 'k' },
    { time: t(51,2), type: 'f' },
    { time: t(51,3), type: 'd' },

    { time: t(52,1), type: 'j' },
    { time: t(52,3), type: 'k' },

    { time: t(53,1), type: 'f' },
    { time: t(53,2), type: 'd' },
    { time: t(53,3), type: 'j' },

    { time: t(54,1), type: 'k' },
    { time: t(54,3), type: 'f' },

    { time: t(55,1), type: 'd' },
    { time: t(55,2), type: 'j' },
    { time: t(55,3), type: 'k' },

    { time: t(56,1), type: 'f' },
    { time: t(56,3), type: 'd' },

    { time: t(57,1), type: 'j' },
    { time: t(57,2), type: 'k' },
    { time: t(57,3), type: 'f' },

    { time: t(58,1), type: 'd' },
    { time: t(58,2), type: 'j' },
    { time: t(58,3), type: 'k' },

    { time: t(59,1), type: 'f' },
    { time: t(59,3), type: 'd' },

    { time: t(60,1), type: 'j' },
    { time: t(60,2), type: 'k' },
    { time: t(60,3), type: 'f' },

    // ══ PRE-CHORUS 2 (61~68마디) ═════════════════════
    { time: t(61,1), type: 'd' },
    { time: t(61,2), type: 'f' },
    { time: t(61,3), type: 'j' },

    { time: t(62,1), type: 'k' },
    { time: t(62,2), type: 'd' },
    { time: t(62,3), type: 'f' },

    { time: t(63,1), type: 'j' },
    { time: t(63,2), type: 'k' },
    { time: t(63,3), type: 'd' },

    { time: t(64,1), type: 'f' },
    { time: t(64,3), type: 'j' },

    { time: t(65,1), type: 'k' },
    { time: t(65,2), type: 'f' },
    { time: t(65,3), type: 'd' },

    { time: t(66,1), type: 'j' },
    { time: t(66,2), type: 'k' },
    { time: t(66,3), type: 'f' },

    { time: t(67,1), type: 'd' },
    { time: t(67,2), type: 'j' },
    { time: t(67,3), type: 'k' },

    { time: t(68,1), type: 'f' },
    { time: t(68,3), type: 'd' },

    // ══ CHORUS 2 (69~84마디) — 이전 코러스와 동일 패턴 ═
    { time: t(69,1), type: 'df' },
    { time: t(69,2), type: 'j' },
    { time: t(69,3), type: 'k' },

    { time: t(70,1), type: 'd' },
    { time: t(70,2), type: 'f' },
    { time: t(70,3), type: 'j' },

    { time: t(71,1), type: 'jk' },
    { time: t(71,2), type: 'd' },
    { time: t(71,3), type: 'f' },

    { time: t(72,1), type: 'k' },
    { time: t(72,2), type: 'j' },
    { time: t(72,3), type: 'd' },

    { time: t(73,1), type: 'df' },
    { time: t(73,2), type: 'k' },
    { time: t(73,3), type: 'j' },

    { time: t(74,1), type: 'f' },
    { time: t(74,2), type: 'd' },
    { time: t(74,3), type: 'k' },

    { time: t(75,1), type: 'jk' },
    { time: t(75,2), type: 'f' },
    { time: t(75,3), type: 'd' },

    { time: t(76,1), type: 'j' },
    { time: t(76,2), type: 'k' },
    { time: t(76,3), type: 'f' },

    { time: t(77,1), type: 'df' },
    { time: t(77,2), type: 'j' },
    { time: t(77,3), type: 'k' },

    { time: t(78,1), type: 'jk' },
    { time: t(78,2), type: 'd' },
    { time: t(78,3), type: 'f' },

    { time: t(79,1), type: 'df' },
    { time: t(79,3), type: 'jk' },

    { time: t(80,1), type: 'd' },
    { time: t(80,2), type: 'j' },
    { time: t(80,3), type: 'k' },

    { time: t(81,1), type: 'f' },
    { time: t(81,2), type: 'd' },
    { time: t(81,3), type: 'j' },

    { time: t(82,1), type: 'k' },
    { time: t(82,2), type: 'f' },
    { time: t(82,3), type: 'd' },

    { time: t(83,1), type: 'df' },
    { time: t(83,2), type: 'j' },
    { time: t(83,3), type: 'k' },

    { time: t(84,1), type: 'jk' },
    { time: t(84,2), type: 'd' },
    { time: t(84,3), type: 'f' },

    // ══ OUTRO (85~92마디) ════════════════════════════
    { time: t(85,1), type: 'd' },
    { time: t(85,2), type: 'j' },
    { time: t(85,3), type: 'f' },

    { time: t(86,1), type: 'k' },
    { time: t(86,3), type: 'd' },

    { time: t(87,1), type: 'j' },
    { time: t(87,2), type: 'f' },
    { time: t(87,3), type: 'k' },

    { time: t(88,1), type: 'd' },
    { time: t(88,3), type: 'j' },

    { time: t(89,1), type: 'f' },
    { time: t(89,2), type: 'k' },
    { time: t(89,3), type: 'd' },

    { time: t(90,1), type: 'j' },
    { time: t(90,3), type: 'f' },

    { time: t(91,1), type: 'df' },
    { time: t(91,3), type: 'jk' },

    { time: t(92,1), type: 'd' },
    { time: t(92,2), type: 'j' },
    { time: t(92,3), type: 'k' },
  ];

  chart.sort((a, b) => a.time - b.time);
  window.CHART = chart;
  return chart;
};

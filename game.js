/* =====================================================
   RHYTHM GAME  game.js
   흐름: 시작화면 → START → 곡선택 → 곡클릭 → 게임
   ===================================================== */

const LANE_X = { d:4, f:104, j:204, k:304, df:4, jk:204 };
const NOTE_H = 52;

// ── 설정 ─────────────────────────────────────────────
const CFG = {
  bpm:         190,
  beatsPerBar: 3,
  offset:      7600,
  speed:       320,
  judgmentY:   490,
  perfectMs:   60,
};
let FALL_MS = 0, GOOD_MS = 0, BAD_MS = 0;

function recalc() {
  FALL_MS = ((CFG.judgmentY + NOTE_H / 2) / CFG.speed) * 1000;
  GOOD_MS = CFG.perfectMs * 2.0;
  BAD_MS  = CFG.perfectMs * 3.2;
  document.documentElement.style.setProperty('--judgment-y', CFG.judgmentY + 'px');
}

// ── 상태 ─────────────────────────────────────────────
let ytPlayer  = null, ytReady = false;
let gameState = 'idle';
let currentSongId = 'fFQHzKDq7C0';

let score = 0, combo = 0, maxCombo = 0, judgedNotes = 0;
let counts = { perfect:0, good:0, bad:0, miss:0 };
let activeNotes = [], animId = null, chartIdx = 0;
const held = { d:false, f:false, j:false, k:false };

// ── 시간 ─────────────────────────────────────────────
let syncYt = 0, syncWall = 0, lastSync = 0, timerRunning = false;

function startTimer() {
  syncYt = ytPlayer.getCurrentTime() * 1000;
  syncWall = lastSync = performance.now();
  timerRunning = true;
}

function getTime() {
  if (!timerRunning) return 0;
  const now = performance.now();
  if (now - lastSync > 1000) {
    syncYt = ytPlayer.getCurrentTime() * 1000;
    syncWall = lastSync = now;
  }
  return syncYt + (now - syncWall);
}

// ── DOM ──────────────────────────────────────────────
const $ = id => document.getElementById(id);
const screens = ['screen-start','screen-select','screen-game','screen-result'];

function showScreen(id) {
  screens.forEach(s => $(s).classList.remove('active'));
  $(id).classList.add('active');
}

// ── 시작 화면 설정 패널 ───────────────────────────────
function bindSetting(sliderId, numId, key, extra) {
  const s = $(sliderId), n = $(numId);
  function update(v) {
    CFG[key] = parseFloat(v);
    s.value = n.value = v;
    if (extra) extra();
    updatePreview();
  }
  s.addEventListener('input',  () => update(s.value));
  n.addEventListener('change', () => update(n.value));
}
bindSetting('cfg-bpm',      'cfg-bpm-num',      'bpm');
bindSetting('cfg-offset',   'cfg-offset-num',   'offset');
bindSetting('cfg-speed',    'cfg-speed-num',    'speed',     recalc);
bindSetting('cfg-judgment', 'cfg-judgment-num', 'judgmentY', recalc);
bindSetting('cfg-perfect',  'cfg-perfect-num',  'perfectMs', recalc);

function updatePreview() {
  const el = $('preview-text');
  if (el) el.textContent =
    `BPM ${CFG.bpm} · OFFSET ${CFG.offset}ms · SPEED ${CFG.speed} · JY ${CFG.judgmentY}px · PERFECT ±${CFG.perfectMs}ms`;
}

// ── 인게임 패널 ───────────────────────────────────────
function bindIngame(sliderId, valId, key, extra) {
  const s = $(sliderId), v = $(valId);
  s.addEventListener('input', () => {
    CFG[key] = parseFloat(s.value);
    v.textContent = s.value;
    if (extra) extra();
    updatePreview();
  });
}
bindIngame('ig-offset',  'ig-offset-val',  'offset');
bindIngame('ig-bpm',     'ig-bpm-val',     'bpm');
bindIngame('ig-speed',   'ig-speed-val',   'speed',     recalc);
bindIngame('ig-jy',      'ig-jy-val',      'judgmentY', recalc);
bindIngame('ig-perfect', 'ig-perfect-val', 'perfectMs', recalc);

document.querySelectorAll('.ig-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const sl = $(btn.dataset.target);
    sl.value = parseFloat(sl.value) + parseFloat(btn.dataset.delta);
    sl.dispatchEvent(new Event('input'));
  });
});

function syncIngamePanel() {
  [['ig-offset','ig-offset-val','offset'],
   ['ig-bpm','ig-bpm-val','bpm'],
   ['ig-speed','ig-speed-val','speed'],
   ['ig-jy','ig-jy-val','judgmentY'],
   ['ig-perfect','ig-perfect-val','perfectMs']
  ].forEach(([sl, vl, key]) => {
    $(sl).value = CFG[key];
    $(vl).textContent = CFG[key];
  });
}

$('btn-apply-restart').addEventListener('click', startGame);
$('btn-pause-ingame').addEventListener('click', () => {
  if (gameState === 'playing') pauseGame();
  else if (gameState === 'paused') resumeGame();
});

// ── YouTube API ───────────────────────────────────────
window.onYouTubeIframeAPIReady = function () {
  ytPlayer = new YT.Player('yt-player', {
    videoId: currentSongId,
    playerVars: { autoplay:0, controls:0, disablekb:1, iv_load_policy:3, rel:0 },
    events: { onReady: onYtReady, onStateChange: onYtState },
  });
};

function onYtReady() {
  ytReady = true;
  $('btn-start').disabled = false;
  $('btn-start').textContent = '▶  START';
}

function onYtState(e) {
  if (e.data === YT.PlayerState.PLAYING && gameState === 'playing' && !timerRunning) {
    startTimer();
  }
  if (e.data === YT.PlayerState.ENDED && gameState === 'playing') endGame();
}

// ── 곡 선택 화면 ─────────────────────────────────────
function showSongSelect() {
  showScreen('screen-select');
  renderSongList();
}

function renderSongList(filter = '') {
  const list = $('song-list');
  if (!list) return;
  list.innerHTML = '';
  const songs = (window.SONGS || []).filter(s =>
    !filter ||
    s.title.toLowerCase().includes(filter.toLowerCase()) ||
    s.artist.toLowerCase().includes(filter.toLowerCase())
  );

  songs.forEach(song => {
    const card = document.createElement('div');
    card.className = 'song-card';
    card.style.setProperty('--accent-color', song.color);

    if (song.isCustom) {
      card.innerHTML = `
        <div class="song-card-accent" style="background:${song.color}"></div>
        <div class="song-card-custom">＋</div>
        <div class="song-info-wrap">
          <div class="song-card-title">${song.title}</div>
          <div class="song-card-artist">${song.artist}</div>
        </div>`;
      card.addEventListener('click', () => {
        $('custom-input-wrap').classList.toggle('hidden');
      });
    } else {
      const thumb = `https://i.ytimg.com/vi/${song.id}/mqdefault.jpg`;
      const diffColor = song.difficulty === 'EASY' ? '#86efac'
        : song.difficulty === 'NORMAL' ? '#fde68a' : '#fca5a5';
      card.innerHTML = `
        <div class="song-card-accent" style="background:${song.color}"></div>
        <img class="song-thumb" src="${thumb}" alt="" loading="lazy" />
        <div class="song-info-wrap">
          <div class="song-card-title">${song.title}</div>
          <div class="song-card-artist">${song.artist}</div>
          <div class="song-card-meta">
            <span class="song-meta-badge">BPM ${song.bpm}</span>
            <span class="song-meta-badge">${song.beatsPerBar}/4박자</span>
            ${song.difficulty ? `<span class="song-meta-badge" style="color:${diffColor}">${song.difficulty}</span>` : ''}
          </div>
        </div>`;
      // 클릭 → 바로 게임 시작
      card.addEventListener('click', () => playSong(song));
    }
    list.appendChild(card);
  });
}

// 검색
const searchEl = $('song-search');
if (searchEl) searchEl.addEventListener('input', () => renderSongList(searchEl.value));

// 커스텀 URL 추가
const btnCustomAdd = $('btn-custom-add');
if (btnCustomAdd) {
  btnCustomAdd.addEventListener('click', () => {
    let url = $('custom-url').value.trim();
    const m1 = url.match(/youtu\.be\/([^?&]+)/);
    const m2 = url.match(/[?&]v=([^&]+)/);
    let videoId = m1 ? m1[1] : m2 ? m2[1] : url.split('?')[0];
    videoId = videoId.trim();
    if (videoId.length < 5) { alert('올바른 YouTube URL 또는 Video ID를 입력해주세요'); return; }

    const song = {
      id:          videoId,
      title:       '커스텀 곡',
      artist:      videoId,
      bpm:         parseFloat($('custom-bpm').value) || 120,
      beatsPerBar: parseInt($('custom-beats').value) || 4,
      offset:      parseFloat($('custom-offset').value) || 1000,
      difficulty:  'CUSTOM',
      color:       '#a78bfa',
      chart:       null,
    };
    window.SONGS.unshift(song);
    $('custom-url').value = '';
    $('custom-input-wrap').classList.add('hidden');
    playSong(song);
  });
}

// 곡 선택 → 바로 시작
function playSong(song) {
  currentSongId   = song.id;
  CFG.bpm         = song.bpm;
  CFG.beatsPerBar = song.beatsPerBar;
  CFG.offset      = song.offset;
  recalc();
  startGame();
}

// ── 게임 시작 ─────────────────────────────────────────
function startGame() {
  if (!ytReady) return;

  recalc();
  syncIngamePanel();
  updatePreview();

  // 채보 로드
  const savedNotes = localStorage.getItem('rhythm_chart_notes');
  const savedCfg   = localStorage.getItem('rhythm_chart_config');
  if (savedNotes) {
    try {
      const parsed = JSON.parse(savedNotes);
      if (savedCfg) {
        const c = JSON.parse(savedCfg);
        if (c.bpm)    CFG.bpm         = c.bpm;
        if (c.offset) CFG.offset      = c.offset;
        if (c.beats)  CFG.beatsPerBar = c.beats;
        recalc(); syncIngamePanel();
      }
      window.CHART = parsed.sort((a, b) => a.time - b.time);
    } catch(e) { window.CHART = window.buildChart(); }
  } else {
    window.CHART = window.buildChart();
  }

  score = 0; combo = 0; maxCombo = 0; judgedNotes = 0;
  counts = { perfect:0, good:0, bad:0, miss:0 };
  activeNotes = []; chartIdx = 0;

  updateHUD();
  $('note-field').querySelectorAll('.note').forEach(e => e.remove());
  showScreen('screen-game');
  $('pause-overlay').classList.add('hidden');
  gameState = 'playing';

  ytPlayer.loadVideoById(currentSongId);
  timerRunning = false;
  animId = requestAnimationFrame(loop);
}

// ── 게임 루프 ─────────────────────────────────────────
function loop() {
  if (gameState !== 'playing') return;
  const now = getTime();
  spawnNotes(now);
  moveNotes(now);
  animId = requestAnimationFrame(loop);
}

function spawnNotes(now) {
  const ch = window.CHART;
  if (!ch) return;
  while (chartIdx < ch.length && now >= ch[chartIdx].time - FALL_MS) {
    const d = ch[chartIdx++];
    const el = document.createElement('div');
    el.classList.add('note', (d.type==='df'||d.type==='jk') ? 'wide' : 'single', 'lane-'+d.type);
    el.style.left = LANE_X[d.type] + 'px';
    el.style.top  = -NOTE_H + 'px';
    el.textContent = d.type.toUpperCase();
    $('note-field').appendChild(el);
    activeNotes.push({ type:d.type, target:d.time, el, done:false });
  }
}

function moveNotes(now) {
  const jy = CFG.judgmentY;
  for (let i = activeNotes.length - 1; i >= 0; i--) {
    const n = activeNotes[i];
    if (n.done) { activeNotes.splice(i,1); continue; }
    const elapsed  = now - (n.target - FALL_MS);
    const progress = elapsed / FALL_MS;
    const cy = -NOTE_H/2 + progress * (jy + NOTE_H/2);
    n.el.style.top = Math.round(cy - NOTE_H/2) + 'px';
    if (now - n.target > BAD_MS) {
      judge('miss', n); n.el.remove(); activeNotes.splice(i,1);
    }
  }
}

// ── 키 입력 ──────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.repeat) return;
  const k = e.key.toLowerCase();
  if (k === 'escape') {
    if (gameState === 'playing') pauseGame();
    else if (gameState === 'paused') resumeGame();
    return;
  }
  // Q키 → 메뉴(시작 화면)로 돌아가기
  if (k === 'q') {
    if (gameState === 'playing' || gameState === 'paused') goToMenu();
    return;
  }
  if (gameState !== 'playing') return;
  if (!['d','f','j','k'].includes(k)) return;
  held[k] = true;
  pressKey(k);
});

document.addEventListener('keyup', e => {
  const k = e.key.toLowerCase();
  if (['d','f','j','k'].includes(k)) {
    held[k] = false;
    $('keybtn-'+k)?.classList.remove('pressed');
  }
});

function pressKey(k) {
  $('keybtn-'+k)?.classList.add('pressed');
  const now = getTime();
  if (k==='d'&&held['f']) { tryHit('df',now); return; }
  if (k==='f'&&held['d']) { tryHit('df',now); return; }
  if (k==='j'&&held['k']) { tryHit('jk',now); return; }
  if (k==='k'&&held['j']) { tryHit('jk',now); return; }
  tryHit(k, now);
}

function tryHit(type, now) {
  let best = null, bestD = Infinity;
  for (const n of activeNotes) {
    if (n.done || n.type !== type) continue;
    const d = Math.abs(now - n.target);
    if (d < bestD) { bestD = d; best = n; }
  }
  if (!best) return;
  const d = Math.abs(now - best.target);
  let jdg = d <= CFG.perfectMs ? 'perfect' : d <= GOOD_MS ? 'good' : d <= BAD_MS ? 'bad' : null;
  if (!jdg) return;
  judge(jdg, best);
  best.el.classList.add('hit');
  setTimeout(() => best.el.remove(), 120);
}

function judge(jdg, note) {
  note.done = true;
  counts[jdg]++;
  judgedNotes++;
  if (jdg === 'miss') {
    combo = 0;
  } else {
    combo++;
    if (combo > maxCombo) maxCombo = combo;
    score += (jdg==='perfect'?300:jdg==='good'?150:50) + Math.floor(combo/10)*10;
  }
  showJdg(jdg);
  updateHUD();
}

// ── HUD ──────────────────────────────────────────────
function updateHUD() {
  $('score-value').textContent    = score.toLocaleString();
  $('combo-value').textContent    = combo;
  $('accuracy-value').textContent = calcAcc() + '%';
  $('combo-value').classList.remove('pop');
  void $('combo-value').offsetWidth;
  if (combo > 0) $('combo-value').classList.add('pop');
}

function calcAcc() {
  if (!judgedNotes) return '100.00';
  return (((counts.perfect*100+counts.good*60+counts.bad*20)/(judgedNotes*100))*100).toFixed(2);
}

let jdgTimer = null;
function showJdg(j) {
  const t = $('judgment-text');
  t.textContent = { perfect:'PERFECT', good:'GOOD', bad:'BAD', miss:'MISS' }[j];
  t.className = 'show ' + j;
  clearTimeout(jdgTimer);
  jdgTimer = setTimeout(() => t.classList.remove('show'), 400);
}

// ── 메뉴로 돌아가기 ──────────────────────────────────
function goToMenu() {
  cancelAnimationFrame(animId);
  if (ytPlayer) ytPlayer.stopVideo();
  gameState = 'idle';
  $('pause-overlay').classList.add('hidden');
  showScreen('screen-start');
}

// ── 퍼즈 ──────────────────────────────────────────────
function pauseGame() {
  if (gameState !== 'playing') return;
  gameState = 'paused';
  ytPlayer.pauseVideo();
  cancelAnimationFrame(animId);
  $('pause-overlay').classList.remove('hidden');
}

function resumeGame() {
  if (gameState !== 'paused') return;
  recalc();
  gameState = 'playing';
  timerRunning = false;
  ytPlayer.playVideo();
  $('pause-overlay').classList.add('hidden');
  animId = requestAnimationFrame(loop);
}

// ── 종료 ──────────────────────────────────────────────
function endGame() {
  gameState = 'result';
  cancelAnimationFrame(animId);
  ytPlayer.stopVideo();
  const a = parseFloat(calcAcc());
  let g = 'D';
  if (a>=98&&!counts.miss) g='S+';
  else if (a>=95) g='S';
  else if (a>=90) g='A';
  else if (a>=80) g='B';
  else if (a>=70) g='C';
  $('result-grade').textContent  = g;
  $('res-score').textContent     = score.toLocaleString();
  $('res-perfect').textContent   = counts.perfect;
  $('res-good').textContent      = counts.good;
  $('res-bad').textContent       = counts.bad;
  $('res-miss').textContent      = counts.miss;
  $('res-combo').textContent     = maxCombo;
  $('res-accuracy').textContent  = a + '%';
  showScreen('screen-result');
}

// ── 버튼 ──────────────────────────────────────────────
// START → 곡 선택 화면
$('btn-start').addEventListener('click', showSongSelect);

// 곡 선택 화면의 뒤로가기
const btnSelectBack = $('btn-select-back');
if (btnSelectBack) btnSelectBack.addEventListener('click', () => showScreen('screen-start'));

$('btn-resume').addEventListener('click', resumeGame);
$('btn-restart').addEventListener('click', () => { $('pause-overlay').classList.add('hidden'); startGame(); });
$('btn-retry').addEventListener('click', () => showSongSelect());
$('btn-to-start').addEventListener('click', () => showScreen('screen-start'));

// HUD 버튼
$('hud-btn-pause').addEventListener('click', () => {
  if (gameState === 'playing') pauseGame();
  else if (gameState === 'paused') resumeGame();
});
$('hud-btn-menu').addEventListener('click', goToMenu);

// 퍼즈 오버레이 메뉴 버튼
const btnToMenu = $('btn-to-menu');
if (btnToMenu) btnToMenu.addEventListener('click', goToMenu);

// 초기화
recalc();
updatePreview();

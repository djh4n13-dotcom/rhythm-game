/* =====================================================
   editor.js — 채보 에디터
   - 음악 재생하면서 D/F/J/K 키 누르면 타이밍 기록
   - 타임라인에 노트 시각화
   - 저장하면 chart.js에 반영 → 게임에서 바로 플레이
   ===================================================== */

const YOUTUBE_VIDEO_ID = 'fFQHzKDq7C0';

const NOTE_COLORS = {
  d:  '#5b9cf6', f: '#a78bfa',
  j:  '#f472b6', k: '#fb923c',
  df: '#7dd3fc', jk: '#f9a8d4',
};

const LANE_ORDER = ['d', 'f', 'j', 'k', 'df', 'jk'];

// ── 상태 ─────────────────────────────────────────────
let ytPlayer   = null;
let ytReady    = false;
let isPlaying  = false;
let isRecording = false;

let notes      = [];   // { time: ms, type: string }
let undoStack  = [];   // 되돌리기용 스냅샷

// 동시 키 감지
const held = { d: false, f: false, j: false, k: false };

// 정밀 시간
let syncYt = 0, syncWall = 0, lastSync = 0;

function getTime() {
  if (!ytPlayer) return 0;
  const now = performance.now();
  if (now - lastSync > 800) {
    syncYt   = ytPlayer.getCurrentTime() * 1000;
    syncWall = now;
    lastSync = now;
  }
  return syncYt + (now - syncWall);
}

// ── DOM ──────────────────────────────────────────────
const $ = id => document.getElementById(id);

const canvas    = $('timeline-canvas');
const ctx       = canvas.getContext('2d');
const noteList  = $('note-list');
const listCount = $('list-count');
const noteCount = $('note-count');
const timeDisp  = $('time-display');
const recIndicator = $('rec-indicator');

// ── YouTube ───────────────────────────────────────────
window.onYouTubeIframeAPIReady = function () {

  // 곡 선택 드롭다운 채우기
  const sel = document.getElementById('ed-song-select');
  if (sel && window.SONGS) {
    window.SONGS.filter(s => !s.isCustom).forEach(song => {
      const opt = document.createElement('option');
      opt.value = song.id;
      opt.textContent = `${song.title} — ${song.artist}`;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', () => {
      if (ytPlayer && sel.value) {
        ytPlayer.loadVideoById(sel.value);
        ytPlayer.stopVideo();
        // BPM/offset 자동 적용
        const song = window.SONGS.find(s => s.id === sel.value);
        if (song) {
          document.getElementById('ed-bpm').value    = song.bpm;
          document.getElementById('ed-offset').value = song.offset;
          document.getElementById('ed-beats').value  = song.beatsPerBar;
          drawTimeline();
        }
      }
    });
  }

  ytPlayer = new YT.Player('yt-player', {
    videoId: YOUTUBE_VIDEO_ID,
    playerVars: { autoplay: 0, controls: 0, disablekb: 1, iv_load_policy: 3, rel: 0 },
    events: { onReady: onYtReady, onStateChange: onYtState },
  });
};

function onYtReady() {
  ytReady = true;
  $('btn-play-pause').disabled = false;
  $('btn-rec').disabled = false;
  // 기존 채보 로드
  loadExistingChart();
}

function onYtState(e) {
  if (e.data === YT.PlayerState.PLAYING) {
    isPlaying = true;
    $('btn-play-pause').textContent = '⏸ 일시정지';
    syncYt = ytPlayer.getCurrentTime() * 1000;
    syncWall = lastSync = performance.now();
  }
  if (e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.ENDED) {
    isPlaying = false;
    $('btn-play-pause').textContent = '▶ 재생';
    if (isRecording) stopRecording();
  }
}

// ── 기존 채보 로드 ────────────────────────────────────
function loadExistingChart() {
  try {
    // chart.js의 CHART_CONFIG 읽기
    if (window.CHART_CONFIG) {
      $('ed-bpm').value    = window.CHART_CONFIG.BPM || 190;
      $('ed-offset').value = window.CHART_CONFIG.startOffset || 7600;
      $('ed-beats').value  = window.CHART_CONFIG.BEATS_PER_BAR || 3;
    }
    // 기존 채보 노트 로드
    if (window.buildChart) {
      const existing = window.buildChart();
      if (existing && existing.length > 0) {
        notes = existing.map(n => ({ time: n.time, type: n.type }));
        renderNoteList();
        drawTimeline();
      }
    }
  } catch(e) {}
}

// ── 재생 / 정지 ───────────────────────────────────────
$('btn-play-pause').addEventListener('click', () => {
  if (!ytReady) return;
  if (isPlaying) {
    ytPlayer.pauseVideo();
  } else {
    ytPlayer.playVideo();
  }
});

$('btn-stop').addEventListener('click', () => {
  if (!ytReady) return;
  ytPlayer.stopVideo();
  isPlaying = false;
  if (isRecording) stopRecording();
  $('btn-play-pause').textContent = '▶ 재생';
});

// ── 녹화 ─────────────────────────────────────────────
$('btn-rec').addEventListener('click', () => {
  if (!isRecording) startRecording();
  else stopRecording();
});

function startRecording() {
  if (!ytReady) return;
  isRecording = true;
  recIndicator.classList.add('on');
  $('btn-rec').textContent = '⏹ 녹화 중지';
  $('btn-rec').style.background = '#7f1d1d';
  if (!isPlaying) ytPlayer.playVideo();
}

function stopRecording() {
  isRecording = false;
  recIndicator.classList.remove('on');
  $('btn-rec').textContent = '⏺ 녹화 시작';
  $('btn-rec').style.background = '';
}

// ── 되돌리기 ─────────────────────────────────────────
function saveUndo() {
  undoStack.push(JSON.stringify(notes));
  if (undoStack.length > 50) undoStack.shift();
  $('btn-undo').disabled = false;
}

$('btn-undo').addEventListener('click', () => {
  if (undoStack.length === 0) return;
  notes = JSON.parse(undoStack.pop());
  if (undoStack.length === 0) $('btn-undo').disabled = true;
  renderNoteList();
  drawTimeline();
});

$('btn-clear').addEventListener('click', () => {
  if (notes.length === 0) return;
  if (!confirm('전체 노트를 삭제할까요?')) return;
  saveUndo();
  notes = [];
  renderNoteList();
  drawTimeline();
});

// ── 키 입력 ───────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.repeat) return;
  const k = e.key.toLowerCase();

  if (k === ' ') { e.preventDefault(); $('btn-play-pause').click(); return; }
  if (k === 'r') { $('btn-rec').click(); return; }
  if (k === 'z' && (e.metaKey || e.ctrlKey)) { $('btn-undo').click(); return; }

  if (!['d','f','j','k'].includes(k)) return;
  held[k] = true;
  $('ekey-' + k)?.classList.add('pressed');

  if (isRecording && isPlaying) recordNote(k);
});

document.addEventListener('keyup', e => {
  const k = e.key.toLowerCase();
  if (['d','f','j','k'].includes(k)) {
    held[k] = false;
    $('ekey-' + k)?.classList.remove('pressed');
  }
});

// 클릭으로도 입력 가능
document.querySelectorAll('.ekey').forEach(el => {
  el.addEventListener('mousedown', () => {
    const k = el.dataset.key;
    held[k] = true;
    el.classList.add('pressed');
    if (isRecording && isPlaying) recordNote(k);
  });
  el.addEventListener('mouseup', () => {
    const k = el.dataset.key;
    held[k] = false;
    el.classList.remove('pressed');
  });
});

function recordNote(key) {
  const now = getTime();

  // 동시 키 감지
  let type = key;
  if ((key === 'd' && held['f']) || (key === 'f' && held['d'])) type = 'df';
  if ((key === 'j' && held['k']) || (key === 'k' && held['j'])) type = 'jk';

  // DF/JK 동시노트면 이미 기록된 단타 제거
  if (type === 'df') {
    notes = notes.filter(n => !(n.type === 'd' && Math.abs(n.time - now) < 80));
    notes = notes.filter(n => !(n.type === 'f' && Math.abs(n.time - now) < 80));
  }
  if (type === 'jk') {
    notes = notes.filter(n => !(n.type === 'j' && Math.abs(n.time - now) < 80));
    notes = notes.filter(n => !(n.type === 'k' && Math.abs(n.time - now) < 80));
  }

  saveUndo();
  notes.push({ time: Math.round(now), type });
  notes.sort((a, b) => a.time - b.time);
  renderNoteList();
  drawTimeline();
}

// ── 타임라인 렌더 ────────────────────────────────────
function resizeCanvas() {
  const area = $('timeline-area');
  canvas.width  = area.clientWidth;
  canvas.height = area.clientHeight;
}

window.addEventListener('resize', () => { resizeCanvas(); drawTimeline(); });
resizeCanvas();

const LANE_H = 28;   // 레인 하나 높이
const LANE_PAD = 4;  // 레인 간격
const LEFT_PAD = 60; // 왼쪽 시간 라벨 영역
const PX_PER_SEC = 120; // 초당 픽셀

function drawTimeline() {
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const currentMs = isPlaying ? getTime() : (ytPlayer ? ytPlayer.getCurrentTime() * 1000 : 0);
  const viewStart = currentMs - (W - LEFT_PAD) * 0.3 / PX_PER_SEC * 1000;

  // 배경
  ctx.fillStyle = '#0a0a14';
  ctx.fillRect(0, 0, W, H);

  // 레인 배경
  LANE_ORDER.forEach((lane, i) => {
    const y = i * (LANE_H + LANE_PAD) + 10;
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    ctx.fillRect(LEFT_PAD, y, W - LEFT_PAD, LANE_H);

    // 레인 이름
    ctx.fillStyle = NOTE_COLORS[lane] + '99';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(lane.toUpperCase(), LEFT_PAD - 6, y + LANE_H / 2 + 4);
  });

  // BPM 그리드
  const bpm     = parseFloat($('ed-bpm').value) || 190;
  const beats   = parseInt($('ed-beats').value) || 3;
  const offset  = parseFloat($('ed-offset').value) || 7600;
  const beatMs  = 60000 / bpm;
  const barMs   = beatMs * beats;

  const gridStart = Math.floor((viewStart - offset) / beatMs) * beatMs + offset;

  for (let t = gridStart; t < viewStart + (W / PX_PER_SEC * 1000); t += beatMs) {
    const x = LEFT_PAD + (t - viewStart) / 1000 * PX_PER_SEC;
    if (x < LEFT_PAD || x > W) continue;

    const isBar = Math.abs(((t - offset) % barMs)) < beatMs * 0.05;
    ctx.strokeStyle = isBar ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)';
    ctx.lineWidth   = isBar ? 1.5 : 1;
    ctx.beginPath();
    ctx.moveTo(x, 10);
    ctx.lineTo(x, LANE_ORDER.length * (LANE_H + LANE_PAD) + 10);
    ctx.stroke();
  }

  // 노트 그리기
  notes.forEach(note => {
    const x = LEFT_PAD + (note.time - viewStart) / 1000 * PX_PER_SEC;
    if (x < LEFT_PAD - 20 || x > W + 20) return;

    const i = LANE_ORDER.indexOf(note.type);
    if (i < 0) return;
    const y = i * (LANE_H + LANE_PAD) + 10;
    const w = note.type === 'df' || note.type === 'jk' ? 32 : 20;

    ctx.fillStyle = NOTE_COLORS[note.type];
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y + 2, w, LANE_H - 4, 4);
    ctx.fill();

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(note.type.toUpperCase(), x, y + LANE_H / 2 + 3);
  });

  // 현재 재생 위치선 (빨간 세로선)
  const playX = LEFT_PAD + (currentMs - viewStart) / 1000 * PX_PER_SEC;
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(playX, 0);
  ctx.lineTo(playX, H);
  ctx.stroke();

  // 시간 라벨
  for (let t = Math.floor(viewStart / 1000) * 1000; t < viewStart + W / PX_PER_SEC * 1000; t += 1000) {
    const x = LEFT_PAD + (t - viewStart) / 1000 * PX_PER_SEC;
    if (x < LEFT_PAD) continue;
    const sec = Math.floor(t / 1000);
    const ms  = Math.floor((t % 1000) / 100);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`, x, H - 6);
  }
}

// ── 시간 표시 & 루프 ─────────────────────────────────
function tick() {
  if (ytPlayer && isPlaying) {
    const ms  = getTime();
    const sec = Math.floor(ms / 1000);
    const msR = Math.floor(ms % 1000);
    timeDisp.textContent =
      `${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}.${String(msR).padStart(3,'0')}`;
    drawTimeline();
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// ── 노트 목록 렌더 ────────────────────────────────────
function renderNoteList() {
  noteList.innerHTML = '';
  listCount.textContent = notes.length;
  noteCount.textContent = `노트 ${notes.length}개`;

  notes.forEach((note, idx) => {
    const li = document.createElement('li');
    li.className = 'note-item';
    li.dataset.idx = idx;

    const sec  = Math.floor(note.time / 1000);
    const ms   = note.time % 1000;
    const tStr = `${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}.${String(ms).padStart(3,'0')}`;

    li.innerHTML = `
      <div class="note-dot" style="background:${NOTE_COLORS[note.type]}"></div>
      <span class="note-time">${tStr}</span>
      <span class="note-type" style="color:${NOTE_COLORS[note.type]}">${note.type.toUpperCase()}</span>
      <button class="note-del" data-idx="${idx}">✕</button>
    `;

    // 클릭 → 해당 위치로 이동
    li.addEventListener('click', e => {
      if (e.target.classList.contains('note-del')) return;
      if (ytPlayer) ytPlayer.seekTo(note.time / 1000, true);
    });

    noteList.appendChild(li);
  });

  // 삭제 버튼
  noteList.querySelectorAll('.note-del').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const i = parseInt(btn.dataset.idx);
      saveUndo();
      notes.splice(i, 1);
      renderNoteList();
      drawTimeline();
    });
  });

  // 목록 맨 아래로 스크롤
  $('note-list-wrap').scrollTop = $('note-list-wrap').scrollHeight;
}

// ── 저장 ─────────────────────────────────────────────
$('btn-save').addEventListener('click', () => {
  if (notes.length === 0) {
    alert('노트가 없어요. 녹화 먼저 해주세요!');
    return;
  }

  const bpm    = parseFloat($('ed-bpm').value) || 190;
  const offset = parseFloat($('ed-offset').value) || 7600;
  const beats  = parseInt($('ed-beats').value) || 3;

  // 코드 생성
  const noteLines = notes.map(n =>
    `  { time: ${n.time}, type: '${n.type}' },`
  ).join('\n');

  const code = `window.CHART_CONFIG = {
  BPM:           ${bpm},
  BEATS_PER_BAR: ${beats},
  startOffset:   ${offset},
};

window.buildChart = function () {
  const chart = [
${noteLines}
  ];
  chart.sort((a, b) => a.time - b.time);
  window.CHART = chart;
  return chart;
};`;

  $('modal-code').textContent = code;
  $('modal-overlay').classList.add('show');

  // 저장 확인 버튼
  $('modal-confirm').onclick = () => {
    // LocalStorage에 저장
    localStorage.setItem('rhythm_chart', code);
    localStorage.setItem('rhythm_chart_notes', JSON.stringify(notes));
    localStorage.setItem('rhythm_chart_config', JSON.stringify({ bpm, offset, beats }));
    alert('저장 완료! 게임 화면에서 바로 적용돼요.');
    $('modal-overlay').classList.remove('show');
    window.location.href = 'index.html';
  };
});

$('modal-cancel').addEventListener('click', () => {
  $('modal-overlay').classList.remove('show');
});

// ── 돌아가기 ─────────────────────────────────────────
$('btn-back').addEventListener('click', () => {
  if (notes.length > 0 && !confirm('저장하지 않고 나갈까요?')) return;
  window.location.href = 'index.html';
});

// ── BPM/Offset 바뀌면 타임라인 갱신 ──────────────────
['ed-bpm','ed-offset','ed-beats'].forEach(id => {
  $(id).addEventListener('input', () => drawTimeline());
});

// ── chart.js 로드 ────────────────────────────────────
// LocalStorage에 저장된 채보가 있으면 우선 로드
(function loadFromStorage() {
  const saved = localStorage.getItem('rhythm_chart_notes');
  const cfg   = localStorage.getItem('rhythm_chart_config');
  if (saved) {
    try {
      notes = JSON.parse(saved);
      renderNoteList();
      drawTimeline();
    } catch(e) {}
  }
  if (cfg) {
    try {
      const c = JSON.parse(cfg);
      $('ed-bpm').value    = c.bpm    || 190;
      $('ed-offset').value = c.offset || 7600;
      $('ed-beats').value  = c.beats  || 3;
    } catch(e) {}
  }
})();

const STORAGE_KEY = 'muscleMasterStateV1';

const exercises = [
  { id: 'squat', kind: '脚・お尻', name: 'スクワット', target: '10〜15回 × 3セット', sets: 3, stats: { strength: 3, endurance: 1 } },
  { id: 'pushup', kind: '胸・腕・肩', name: 'プッシュアップ', target: '10〜20回 × 3セット', sets: 3, stats: { strength: 3, endurance: 1 } },
  { id: 'bridge', kind: 'お尻・もも裏', name: 'グルートブリッジ', target: '10〜15回 × 3セット', sets: 3, stats: { strength: 2, core: 1 } },
  { id: 'crunch', kind: '腹筋', name: 'クランチ', target: '15〜20回 × 3セット', sets: 3, stats: { core: 3 } },
  { id: 'plank', kind: '体幹', name: 'プランク', target: '20〜60秒 × 3セット', sets: 3, stats: { core: 3, endurance: 1 } },
  { id: 'mobility', kind: '柔軟・可動域', name: 'クネクネ＆ストレッチ', target: '約3〜5分', sets: 1, stats: { mobility: 4 } },
  { id: 'neck', kind: '首・僧帽筋', name: 'ネックアイソメトリック', target: '各方向 5〜10秒 × 2セット', sets: 2, stats: { strength: 1, core: 1 } }
];

const defaultState = {
  userName: '',
  trainerName: '',
  days: {},
  totalSets: 0,
  stats: { strength: 0, core: 0, mobility: 0, endurance: 0 }
};

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function loadState() {
  try {
    return { ...structuredClone(defaultState), ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
  } catch {
    return structuredClone(defaultState);
  }
}

let state = loadState();
state.stats = { ...defaultState.stats, ...(state.stats || {}) };
state.days ||= {};

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function ensureToday() {
  const key = todayKey();
  state.days[key] ||= {};
  for (const exercise of exercises) {
    state.days[key][exercise.id] ||= Array(exercise.sets).fill(false);
    if (state.days[key][exercise.id].length !== exercise.sets) {
      state.days[key][exercise.id] = Array(exercise.sets).fill(false);
    }
  }
  return state.days[key];
}

function completedSetsForDay(day) {
  return Object.values(day || {}).reduce((sum, sets) => sum + sets.filter(Boolean).length, 0);
}

function requiredSets() {
  return exercises.reduce((sum, e) => sum + e.sets, 0);
}

function getStreak() {
  let streak = 0;
  const cursor = new Date();
  for (;;) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, '0');
    const d = String(cursor.getDate()).padStart(2, '0');
    const key = `${y}-${m}-${d}`;
    const done = completedSetsForDay(state.days[key]);
    if (done === 0) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function trainerMessage(progress) {
  const user = state.userName || 'あなた';
  if (progress === 0) return `${user}、今日は1セットから始めましょう。積み上げが最強よ。`;
  if (progress < 35) return `いいスタート、${user}。身体が起きてきたわ。`;
  if (progress < 70) return `${user}、半分が見えてきた！ フォーム優先でいきましょう。`;
  if (progress < 100) return `あと少し！ 追い込みすぎず、きれいに仕上げましょう。`;
  return `全クエスト完了！ ${user}、本日の育成は大成功よ 💪`;
}

function addStats(exercise, direction) {
  for (const [key, amount] of Object.entries(exercise.stats)) {
    state.stats[key] = Math.max(0, Math.min(100, (state.stats[key] || 0) + amount * direction));
  }
}

function render() {
  const day = ensureToday();
  const done = completedSetsForDay(day);
  const total = requiredSets();
  const progress = Math.round((done / total) * 100);

  document.querySelector('#progressText').textContent = `${progress}%`;
  document.querySelector('#streakText').textContent = getStreak();
  document.querySelector('#totalSetsText').textContent = state.totalSets;
  document.querySelector('#trainerName').textContent = state.trainerName || 'トレーナー';
  document.querySelector('#trainerMessage').textContent = trainerMessage(progress);
  document.querySelector('#userHeading').textContent = state.userName ? `${state.userName}の今日のトレーニング` : '今日のトレーニング';

  document.querySelector('#strengthStat').value = state.stats.strength;
  document.querySelector('#coreStat').value = state.stats.core;
  document.querySelector('#mobilityStat').value = state.stats.mobility;
  document.querySelector('#enduranceStat').value = state.stats.endurance;

  const list = document.querySelector('#exerciseList');
  list.innerHTML = '';
  const template = document.querySelector('#exerciseTemplate');

  exercises.forEach(exercise => {
    const node = template.content.cloneNode(true);
    node.querySelector('.exercise-kind').textContent = exercise.kind;
    node.querySelector('.exercise-name').textContent = exercise.name;
    node.querySelector('.exercise-target').textContent = exercise.target;
    const setButtons = node.querySelector('.set-buttons');

    day[exercise.id].forEach((isDone, index) => {
      const button = document.createElement('button');
      button.className = `set-button${isDone ? ' done' : ''}`;
      button.textContent = isDone ? '✓' : String(index + 1);
      button.setAttribute('aria-label', `${exercise.name} ${index + 1}セット目`);
      button.addEventListener('click', () => {
        const wasDone = day[exercise.id][index];
        day[exercise.id][index] = !wasDone;
        state.totalSets = Math.max(0, state.totalSets + (wasDone ? -1 : 1));
        addStats(exercise, wasDone ? -1 : 1);
        saveState();
        render();
      });
      setButtons.appendChild(button);
    });

    list.appendChild(node);
  });

  saveState();
}

const settingsDialog = document.querySelector('#settingsDialog');
document.querySelector('#settingsButton').addEventListener('click', () => {
  document.querySelector('#userNameInput').value = state.userName || '';
  document.querySelector('#trainerNameInput').value = state.trainerName || '';
  settingsDialog.showModal();
});

document.querySelector('#settingsForm').addEventListener('submit', event => {
  event.preventDefault();
  state.userName = document.querySelector('#userNameInput').value.trim();
  state.trainerName = document.querySelector('#trainerNameInput').value.trim();
  saveState();
  settingsDialog.close();
  render();
});

document.querySelector('#resetTodayButton').addEventListener('click', () => {
  if (!confirm('今日のチェックをすべてリセットしますか？')) return;
  const day = ensureToday();
  for (const exercise of exercises) {
    day[exercise.id].forEach((done, i) => {
      if (done) {
        state.totalSets = Math.max(0, state.totalSets - 1);
        addStats(exercise, -1);
      }
      day[exercise.id][i] = false;
    });
  }
  saveState();
  render();
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

render();

if (!state.userName && !state.trainerName) {
  setTimeout(() => settingsDialog.showModal(), 250);
}

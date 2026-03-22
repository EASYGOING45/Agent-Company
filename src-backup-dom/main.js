import { company, rooms, members, roomState, feed, summaries } from './data.js';

const ROOM_STORAGE_KEY = 'agent-company-current-room';
const ROOM_TRANSITION_MS = 420;
const TOAST_MS = 2600;

const roomDecorMap = {
  lobby: [
    { className: 'pixel-sign office-el', label: 'WAVE HUB' },
    { className: 'pixel-window office-el', label: '' },
    { className: 'pixel-board office-el', label: '' },
    { className: 'pixel-desk office-el', label: '' },
    { className: 'pixel-monitor office-el', label: '' },
    { className: 'pixel-sofa office-el', label: '' },
    { className: 'pixel-plant office-el', label: '' },
    { className: 'pixel-terminal office-el', label: '' },
    { className: 'pixel-halo-gate office-el', label: '' },
    { className: 'pixel-prism office-el', label: '' },
    { className: 'pixel-banner office-el', label: '' },
  ],
  meeting: [
    { className: 'pixel-screen office-el', label: '' },
    { className: 'pixel-whiteboard office-el', label: '' },
    { className: 'pixel-table office-el', label: '' },
    { className: 'pixel-desk office-el', label: '' },
    { className: 'pixel-plant office-el', label: '' },
    { className: 'pixel-signal-post office-el', label: '' },
    { className: 'pixel-prism-dais office-el', label: '' },
    { className: 'pixel-column office-el pixel-column-left', label: '' },
    { className: 'pixel-column office-el pixel-column-right', label: '' },
    { className: 'pixel-terminal office-el pixel-analysis-terminal', label: '' },
  ],
  lounge: [
    { className: 'pixel-window office-el', label: '' },
    { className: 'pixel-sofa office-el', label: '' },
    { className: 'pixel-coffee office-el', label: '' },
    { className: 'pixel-sign office-el', label: 'REST ARC' },
    { className: 'pixel-plant office-el', label: '' },
    { className: 'pixel-lamp office-el', label: '' },
    { className: 'pixel-altar office-el', label: '' },
    { className: 'pixel-vinyl office-el', label: '' },
    { className: 'pixel-cushion office-el', label: '' },
  ],
  game: [
    { className: 'pixel-sign office-el', label: 'PLAY LAB' },
    { className: 'pixel-console office-el', label: '' },
    { className: 'pixel-cabinet office-el', label: '' },
    { className: 'pixel-speaker office-el', label: '' },
    { className: 'pixel-beanbag office-el', label: '' },
    { className: 'pixel-prize office-el', label: '' },
    { className: 'pixel-prism-crane office-el', label: '' },
    { className: 'pixel-laser-grid office-el', label: '' },
    { className: 'pixel-mini-cabinet office-el', label: '' },
  ],
};

const roomCopy = {
  lobby: '主厅被菲比调成了隐海修会前庭的样子，前台棱镜、halo 门廊与潮蓝色脉冲一起承担来访接待与总览巡检。',
  meeting: '会议室像一个被压低亮度的共振校准舱，议程圣像、长桌和分析终端会把讨论导向更明确的决策。',
  lounge: '休息室把“恢复”做成了一间可停留的房，暖色壁龛、留声角和低频光噪会让灵感慢慢重新浮起来。',
  game: '游戏室不只是娱乐角，而是高频实验场，跃迁机台、霓虹吊臂和跳频灯带让释放压力也带着创造感。',
};

const roomPulseCopy = {
  lobby: '前台脉冲稳定 · halo 与棱镜同步',
  meeting: '议程脉冲收束 · 白板与长桌对齐',
  lounge: '低频回响缓慢铺开 · 暖灯处于舒缓档位',
  game: '高频信号跃迁中 · 机台与音箱进入热机状态',
};

const slots = ['a', 'b', 'c', 'd'];

const state = {
  currentRoomId: loadCurrentRoomId(),
  selectedMemberId: members[0]?.id ?? null,
  toast: null,
  transitionTick: 0,
};

let roomTimer = null;
let toastTimer = null;

function renderMemberAvatar(member, className = 'member-avatar') {
  const fallbackSrc = member.avatarFallback ? ` data-fallback-src="${member.avatarFallback}"` : '';
  return `
    <span class="avatar-shell ${className}-shell avatar-shell-${member.accent}">
      <img class="${className}" src="${member.avatar}" alt="${member.name} 头像" loading="lazy" decoding="async"${fallbackSrc}>
    </span>
  `;
}

function loadCurrentRoomId() {
  try {
    const saved = localStorage.getItem(ROOM_STORAGE_KEY);
    if (rooms.some((room) => room.id === saved)) {
      return saved;
    }
  } catch (error) {
    console.warn('Unable to read room state from storage.', error);
  }

  return roomState.currentRoomId || company.defaultRoomId;
}

function persistCurrentRoomId() {
  try {
    localStorage.setItem(ROOM_STORAGE_KEY, state.currentRoomId);
  } catch (error) {
    console.warn('Unable to persist room state.', error);
  }
}

function getCurrentRoom() {
  return rooms.find((room) => room.id === state.currentRoomId) || rooms[0];
}

function getMembersInRoom(roomId) {
  return members.filter((member) => member.roomId === roomId);
}

function getSelectedMember() {
  return members.find((member) => member.id === state.selectedMemberId) || getMembersInRoom(state.currentRoomId)[0] || members[0];
}

function roomBadge(roomId) {
  const room = rooms.find((item) => item.id === roomId);
  return room ? room.name : '未分配';
}

function ensureSelectedMember() {
  const visibleMembers = getMembersInRoom(state.currentRoomId);
  if (!visibleMembers.some((member) => member.id === state.selectedMemberId)) {
    state.selectedMemberId = visibleMembers[0]?.id || members[0]?.id || null;
  }
}

function getStatusSummary() {
  const online = members.filter((member) => member.presence === 'online' || member.presence === 'busy').length;
  const busy = members.filter((member) => member.presence === 'busy').length;
  const idle = members.filter((member) => member.presence === 'idle').length;

  return `${online} 位在线 · ${busy} 位高频推进 · ${idle} 位低频整理`;
}

function formatDashboardTime() {
  const now = new Date();
  const weekday = new Intl.DateTimeFormat('zh-CN', { weekday: 'long' }).format(now);
  const time = new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now);

  return `${weekday} · ${time}`;
}

function showToast(kind, title, body) {
  const toastId = Date.now();
  state.toast = { id: toastId, kind, title, body };
  renderApp();

  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    if (state.toast?.id === toastId) {
      state.toast = null;
      renderApp();
    }
  }, TOAST_MS);
}

function getPresenceMeta(member) {
  const map = {
    online: { label: member.presenceLabel || 'online', className: 'status-online' },
    busy: { label: member.presenceLabel || 'busy', className: 'status-busy' },
    idle: { label: member.presenceLabel || 'idle', className: 'status-idle' },
    offline: { label: member.presenceLabel || 'offline', className: 'status-offline' },
  };

  return map[member.presence] || map.online;
}

function renderPresenceBadge(member) {
  const meta = getPresenceMeta(member);
  return `
    <span class="presence-pill ${meta.className}">
      <span class="presence-light"></span>
      ${meta.label}
    </span>
  `;
}

function renderToast() {
  if (!state.toast) {
    return '';
  }

  return `
    <aside class="toast-stack" aria-live="polite" aria-atomic="true">
      <article class="toast-card toast-${state.toast.kind}">
        <div class="toast-ping"></div>
        <div class="toast-copy">
          <p class="toast-kicker">signal update</p>
          <p class="toast-title">${state.toast.title}</p>
          <p class="toast-body">${state.toast.body}</p>
        </div>
      </article>
    </aside>
  `;
}

function renderRoomTabs() {
  const currentRoom = getCurrentRoom();
  return `
    <section class="room-tabs">
      <ul class="room-tab-list">
        ${rooms.map((room) => `
          <li>
            <button class="room-tab ${room.id === state.currentRoomId ? 'active' : ''}" type="button" data-room-id="${room.id}">
              <strong>${room.name}</strong>
              <span>${room.tagline}</span>
            </button>
          </li>
        `).join('')}
      </ul>
      <div class="room-tabs-copy">
        <p>当前房间信号</p>
        <strong>${currentRoom.ambience}</strong>
        <p>${currentRoom.description}</p>
      </div>
    </section>
  `;
}

function renderMembersPanel() {
  const visibleMembers = getMembersInRoom(state.currentRoomId);
  return `
    <aside class="member-rail">
      <h2>▸ ROOM MEMBERS</h2>
      <div class="member-list">
        ${visibleMembers.map((member) => `
          <article class="member-card ${member.id === state.selectedMemberId ? 'selected' : ''}" data-member-id="${member.id}">
            <div class="member-card-head">
              ${renderMemberAvatar(member)}
              <div class="member-card-copy">
                <strong>${member.name}</strong>
                <div class="member-card-badges">
                  <span class="badge ${member.accent}">${member.role}</span>
                  <span class="badge ${member.accent === 'member' ? 'member' : member.accent}">${member.status}</span>
                  ${renderPresenceBadge(member)}
                </div>
              </div>
            </div>
            <p>${member.note}</p>
            <p>所在房间：${roomBadge(member.roomId)}</p>
            <p>行为：${member.behavior}</p>
            <p>工作区：${member.workspace}</p>
            <p>持续时间：${member.duration}</p>
          </article>
        `).join('')}
      </div>
    </aside>
  `;
}

function renderOwnerCard(currentRoom) {
  const owner = members.find((member) => member.id === 'phoebe') || members[0];
  return `
    <div class="owner-card">
      <div class="room-chip">OWNER CASE</div>
      ${renderMemberAvatar(owner, 'member-avatar owner-avatar')}
      <h3>菲比</h3>
      <p>${company.ownerTitle}</p>
      <p>当前巡检：${currentRoom.name}</p>
      <p>${currentRoom.tagline}</p>
      ${renderPresenceBadge(owner)}
    </div>
  `;
}

function renderFocusPanel(selectedMember, currentRoom) {
  return `
    <section class="focus-panel">
      <div class="focus-header">
        <div class="focus-identity">
          ${renderMemberAvatar(selectedMember, 'member-avatar focus-avatar')}
          <div>
            <p class="section-kicker">当前焦点成员</p>
            <h3>${selectedMember.name}</h3>
          </div>
        </div>
        <div class="focus-badges">
          <span class="badge ${selectedMember.accent}">${selectedMember.role}</span>
          <span class="badge ${selectedMember.accent === 'member' ? 'member' : selectedMember.accent}">${selectedMember.status}</span>
          ${renderPresenceBadge(selectedMember)}
        </div>
      </div>
      <p class="focus-note">${selectedMember.note}</p>
      <div class="focus-grid">
        <article class="info-card">
          <span>所在房间</span>
          <strong>${roomBadge(selectedMember.roomId)}</strong>
        </article>
        <article class="info-card">
          <span>当前行为</span>
          <strong>${selectedMember.behavior}</strong>
        </article>
        <article class="info-card">
          <span>工作区</span>
          <strong>${selectedMember.workspace}</strong>
        </article>
        <article class="info-card">
          <span>状态时长</span>
          <strong>${selectedMember.duration}</strong>
        </article>
      </div>
      <div class="history-card">
        <p class="section-kicker">最近回响</p>
        <ul>
          ${selectedMember.history.map((item) => `<li>${item}</li>`).join('')}
        </ul>
      </div>
      <div class="room-summary-strip">
        <article class="info-card accent">
          <span>当前房间</span>
          <strong>${currentRoom.name}</strong>
        </article>
        <article class="info-card">
          <span>成员数量</span>
          <strong>${getMembersInRoom(currentRoom.id).length} 位</strong>
        </article>
        <article class="info-card">
          <span>房间母题</span>
          <strong>${currentRoom.motif}</strong>
        </article>
        <article class="info-card">
          <span>房间信号</span>
          <strong>${currentRoom.signal}</strong>
        </article>
      </div>
    </section>
  `;
}

function renderSignalStrip(currentRoom, roomMembers) {
  const busyCount = roomMembers.filter((member) => member.presence === 'busy').length;
  return `
    <section class="signal-strip">
      <article class="signal-card">
        <span>房间信号</span>
        <strong>${currentRoom.signal}</strong>
      </article>
      <article class="signal-card">
        <span>环境频率</span>
        <strong>${currentRoom.ambience}</strong>
      </article>
      <article class="signal-card">
        <span>高频成员</span>
        <strong>${busyCount} / ${roomMembers.length}</strong>
      </article>
      <article class="signal-card">
        <span>当前焦点</span>
        <strong>${getSelectedMember().name}</strong>
      </article>
    </section>
  `;
}

function renderRoomVisual(currentRoom, roomMembers, decorations) {
  return `
    <aside class="room-visual-shell">
      <div class="room-visual-copy">
        <p class="section-kicker">像素房间场景</p>
        <h3>${currentRoom.name}</h3>
        <p>${roomCopy[currentRoom.id]}</p>
      </div>
      <div class="room-decor-tags">
        ${currentRoom.decor.map((item) => `<span>${item}</span>`).join('')}
      </div>
      <div class="room-pulse-panel">
        <span class="section-kicker">pulse log</span>
        <strong>${currentRoom.motif}</strong>
        <p>${roomPulseCopy[currentRoom.id]}</p>
      </div>
      <div class="office-map" data-room-id="${currentRoom.id}" aria-label="${currentRoom.name} 场景">
        <div class="office-noise office-noise-a"></div>
        <div class="office-noise office-noise-b"></div>
        <div class="office-ambience office-ambience-a"></div>
        <div class="office-ambience office-ambience-b"></div>
        <div class="office-stars"></div>
        ${decorations.map((item) => `<div class="${item.className}">${item.label}</div>`).join('')}
        ${roomMembers.map((member, index) => `
          <button
            class="agent-dot agent-dot-${member.accent}"
            type="button"
            data-member-id="${member.id}"
            data-slot="${slots[index % slots.length]}"
            title="${member.name}"
            aria-label="聚焦 ${member.name}"
          >
            ${renderMemberAvatar(member, 'member-avatar agent-dot-avatar')}
            <span class="agent-dot-ring"></span>
          </button>
        `).join('')}
      </div>
    </aside>
  `;
}

function renderScene() {
  const currentRoom = getCurrentRoom();
  const roomMembers = getMembersInRoom(currentRoom.id);
  const selectedMember = getSelectedMember();
  const decorations = roomDecorMap[currentRoom.id] || [];

  return `
    <section class="stage room-stage" data-room-theme="${currentRoom.theme}">
      <div class="stage-inner">
        <div class="stage-header">
          <div class="room-header-meta">
            <div class="room-chip">${currentRoom.name}</div>
            <div class="room-chip">${roomMembers.length} 位成员</div>
            <div class="room-chip">${currentRoom.motif}</div>
          </div>
          <h2>▸ ${company.ownerName} 的共鸣事务所</h2>
          <p>${roomCopy[currentRoom.id]}</p>
        </div>

        ${renderSignalStrip(currentRoom, roomMembers)}

        <div class="stage-content">
          <div class="stage-main">
            <div class="owner-zone">
              ${renderOwnerCard(currentRoom)}
              ${renderFocusPanel(selectedMember, currentRoom)}
            </div>
          </div>
          ${renderRoomVisual(currentRoom, roomMembers, decorations)}
        </div>

        <div class="stage-footer">
          <p>当前焦点：${selectedMember.name} 正在 ${selectedMember.behavior}，工作区为 ${selectedMember.workspace}，房间母题为 ${currentRoom.motif}。</p>
        </div>
      </div>
    </section>
  `;
}

function renderPresencePanel() {
  const currentRoom = getCurrentRoom();
  const roomMembers = getMembersInRoom(currentRoom.id);
  return `
    <aside class="room-presence">
      <h2>▸ ROOM STATUS</h2>
      <p>${currentRoom.description}</p>
      <div class="presence-list">
        ${roomMembers.map((member) => `
          <article class="presence-card">
            <div class="presence-head">
              ${renderMemberAvatar(member, 'member-avatar presence-avatar')}
              <div>
                <strong>${member.name}</strong>
                <p>${member.note}</p>
              </div>
            </div>
            <div class="presence-meta">
              ${renderPresenceBadge(member)}
              <span class="badge ${member.accent === 'member' ? 'member' : member.accent}">${member.status}</span>
            </div>
            <p>所在房间：${roomBadge(member.roomId)}</p>
            <p>当前行为：${member.behavior}</p>
            <p>状态时长：${member.duration}</p>
          </article>
        `).join('')}
      </div>
    </aside>
  `;
}

function renderFeed() {
  const currentRoom = getCurrentRoom();
  return `
    <aside class="feed">
      <h2>▸ ROOM FEED</h2>
      <ul>
        ${feed.map((item) => `<li>${item}</li>`).join('')}
        <li>${currentRoom.name} 当前进入 ${currentRoom.ambience}，房间母题为 ${currentRoom.motif}，主信号是 ${currentRoom.signal}。</li>
      </ul>
    </aside>
  `;
}

function renderSummary() {
  return `
    <section class="summary">
      ${summaries.map((item) => `
        <section class="summary-card">
          <h3>${item.title}</h3>
          <p>${item.body}</p>
        </section>
      `).join('')}
    </section>
  `;
}

function renderApp() {
  ensureSelectedMember();
  const currentRoom = getCurrentRoom();

  document.querySelector('#app').innerHTML = `
    <div class="app" data-room-theme="${currentRoom.theme}" data-transition-tick="${state.transitionTick}">
      <header class="topbar">
        <div class="brand">
          <p class="brand-kicker">鸣潮像素事务所</p>
          <h1>${company.name}</h1>
          <p>${company.description}</p>
        </div>
        <div class="meta">
          <p>${formatDashboardTime()}</p>
          <p>${getStatusSummary()}</p>
          <p>${currentRoom.name} · ${currentRoom.tagline}</p>
        </div>
        <nav class="nav">
          <span class="navlink active">Rooms</span>
          <span class="navlink">Signals</span>
          <span class="navlink">Reports</span>
        </nav>
      </header>

      ${renderRoomTabs()}

      <main class="layout">
        ${renderMembersPanel()}
        ${renderScene(currentRoom)}
        <div class="side-column">
          ${renderPresencePanel()}
          ${renderFeed()}
        </div>
      </main>

      ${renderSummary()}
      ${renderToast()}
    </div>
  `;

  attachEvents();
}

function attachEvents() {
  document.querySelectorAll('.room-tab[data-room-id]').forEach((button) => {
    button.addEventListener('click', () => switchRoom(button.dataset.roomId));
  });

  document.querySelectorAll('[data-member-id]').forEach((element) => {
    element.addEventListener('click', () => {
      state.selectedMemberId = element.dataset.memberId;
      const member = getSelectedMember();
      showToast('member', `焦点切换到 ${member.name}`, `${member.behavior} · ${member.workspace}`);
    });
  });

  hydrateAvatarFallbacks();
}

function hydrateAvatarFallbacks() {
  document.querySelectorAll('img[data-fallback-src]').forEach((img) => {
    img.addEventListener('error', handleAvatarError, { once: true });
  });
}

function handleAvatarError(event) {
  const img = event.currentTarget;
  const fallbackSrc = img.dataset.fallbackSrc;

  if (!fallbackSrc || img.dataset.fallbackApplied === 'true') {
    return;
  }

  img.dataset.fallbackApplied = 'true';
  img.src = fallbackSrc;
}

function switchRoom(roomId) {
  if (!rooms.some((room) => room.id === roomId) || roomId === state.currentRoomId) {
    return;
  }

  const stage = document.querySelector('.stage');
  if (stage) {
    stage.classList.add('is-transitioning');
  }

  window.clearTimeout(roomTimer);
  roomState.previousRoomId = state.currentRoomId;
  state.currentRoomId = roomId;
  state.transitionTick += 1;
  roomState.currentRoomId = roomId;
  persistCurrentRoomId();

  const nextRoom = rooms.find((room) => room.id === roomId);

  roomTimer = window.setTimeout(() => {
    renderApp();
    showToast('room', `已切换到 ${nextRoom.name}`, `${nextRoom.tagline} · ${nextRoom.signal}`);
    const newStage = document.querySelector('.stage');
    if (newStage) {
      newStage.classList.add('is-transitioning');
      window.setTimeout(() => newStage.classList.remove('is-transitioning'), ROOM_TRANSITION_MS);
    }
  }, 140);
}

renderApp();

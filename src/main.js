import { company, rooms, members, roomState, feed, summaries } from './data.js';

const ROOM_STORAGE_KEY = 'agent-company-current-room';
const ROOM_TRANSITION_MS = 280;
const TOAST_MS = 2200;

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
  ],
  meeting: [
    { className: 'pixel-screen office-el', label: '' },
    { className: 'pixel-whiteboard office-el', label: '' },
    { className: 'pixel-table office-el', label: '' },
    { className: 'pixel-desk office-el', label: '' },
    { className: 'pixel-plant office-el', label: '' },
    { className: 'pixel-signal-post office-el', label: '' },
  ],
  lounge: [
    { className: 'pixel-window office-el', label: '' },
    { className: 'pixel-sofa office-el', label: '' },
    { className: 'pixel-coffee office-el', label: '' },
    { className: 'pixel-sign office-el', label: 'REST ARC' },
    { className: 'pixel-plant office-el', label: '' },
    { className: 'pixel-lamp office-el', label: '' },
  ],
  game: [
    { className: 'pixel-sign office-el', label: 'PLAY LAB' },
    { className: 'pixel-console office-el', label: '' },
    { className: 'pixel-cabinet office-el', label: '' },
    { className: 'pixel-speaker office-el', label: '' },
    { className: 'pixel-beanbag office-el', label: '' },
    { className: 'pixel-prize office-el', label: '' },
  ],
};

const roomCopy = {
  lobby: '主厅像一块持续亮着的接待屏，把主人巡检、访客进出与公司整体营业状态压进同一片潮蓝色光带。',
  meeting: '会议室收束光线与注意力，桌面、白板和屏幕一起承担讨论的节拍，适合让想法快速落地。',
  lounge: '休息室让节奏往下沉半拍，落日窗景、暖灯和软装把“恢复”变成这间事务所的一部分。',
  game: '游戏室负责把高频能量释放出来，彩色机台与音箱让实验、娱乐和团队活性共存。',
};

const slots = ['a', 'b', 'c', 'd'];

const state = {
  currentRoomId: loadCurrentRoomId(),
  selectedMemberId: members[0]?.id ?? null,
  toast: null,
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
  const working = members.filter((member) => member.status === '工作中' || member.status === '编码中').length;
  const researching = members.filter((member) => member.status === '调研中').length;

  return `${members.length} 位在线 · ${working} 位推进中 · ${researching} 位整理灵感`;
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

function renderToast() {
  if (!state.toast) {
    return '';
  }

  return `
    <aside class="toast-stack" aria-live="polite" aria-atomic="true">
      <article class="toast-card toast-${state.toast.kind}">
        <div class="toast-ping"></div>
        <div>
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
          <span>场景标签</span>
          <strong>${currentRoom.tagline}</strong>
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
        <span>在线成员</span>
        <strong>${roomMembers.length} / ${members.length}</strong>
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
      <div class="office-map" data-room-id="${currentRoom.id}" aria-label="${currentRoom.name} 场景">
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
          >
            ${renderMemberAvatar(member, 'member-avatar agent-dot-avatar')}
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
            <div class="room-chip">主色 ${currentRoom.theme}</div>
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
          <p>当前焦点：${selectedMember.name} 正在 ${selectedMember.behavior}，工作区为 ${selectedMember.workspace}。</p>
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
            <p>所在房间：${roomBadge(member.roomId)}</p>
            <p>当前状态：${member.status}</p>
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
        <li>${currentRoom.name} 已接入 ${currentRoom.signal}，当前环境为 ${currentRoom.ambience}。</li>
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
    <div class="app" data-room-theme="${currentRoom.theme}">
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
  }, 120);
}

renderApp();

import { company, rooms, members, roomState, feed, summaries } from './data.js';

const ROOM_STORAGE_KEY = 'agent-company-current-room';

const roomDecorMap = {
  lobby: [
    { className: 'pixel-sign office-el', label: 'WELCOME' },
    { className: 'pixel-window office-el', label: '' },
    { className: 'pixel-board office-el', label: '' },
    { className: 'pixel-desk office-el', label: '' },
    { className: 'pixel-monitor office-el', label: '' },
    { className: 'pixel-sofa office-el', label: '' },
    { className: 'pixel-plant office-el', label: '' },
  ],
  meeting: [
    { className: 'pixel-screen office-el', label: '' },
    { className: 'pixel-whiteboard office-el', label: '' },
    { className: 'pixel-table office-el', label: '' },
    { className: 'pixel-desk office-el', label: '' },
    { className: 'pixel-plant office-el', label: '' },
  ],
  lounge: [
    { className: 'pixel-window office-el', label: '' },
    { className: 'pixel-sofa office-el', label: '' },
    { className: 'pixel-coffee office-el', label: '' },
    { className: 'pixel-sign office-el', label: 'LOUNGE' },
    { className: 'pixel-plant office-el', label: '' },
  ],
  game: [
    { className: 'pixel-sign office-el', label: 'PLAY' },
    { className: 'pixel-console office-el', label: '' },
    { className: 'pixel-cabinet office-el', label: '' },
    { className: 'pixel-speaker office-el', label: '' },
    { className: 'pixel-beanbag office-el', label: '' },
  ],
};

const roomCopy = {
  lobby: '总览主人、访客和当前营业状态，承担 Agent 公司入口门面。',
  meeting: '围绕路线、任务和协作进行同步，成员展示更强调会议中的聚集感。',
  lounge: '表现休息、恢复和灵感整理，让空间从持续工作切到轻松补能。',
  game: '用更亮的灯色和像素设备表达高能互动，为团队制造“活着”的节奏。',
};

const slots = ['a', 'b', 'c', 'd'];

const state = {
  currentRoomId: loadCurrentRoomId(),
  selectedMemberId: members[0]?.id ?? null,
};

function renderMemberAvatar(member, className = 'member-avatar') {
  return `<img class="${className}" src="${member.avatar}" alt="${member.name} 头像" loading="lazy" decoding="async">`;
}

function loadCurrentRoomId() {
  const saved = localStorage.getItem(ROOM_STORAGE_KEY);
  if (rooms.some((room) => room.id === saved)) {
    return saved;
  }
  return roomState.currentRoomId || company.defaultRoomId;
}

function persistCurrentRoomId() {
  localStorage.setItem(ROOM_STORAGE_KEY, state.currentRoomId);
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
        <p>当前房间</p>
        <strong>${currentRoom.name}</strong>
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
        <p class="section-kicker">状态历史</p>
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
      </div>
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
      <div class="office-map" data-room-id="${currentRoom.id}" aria-label="${currentRoom.name} 场景">
        ${decorations.map((item) => `<div class="${item.className}">${item.label}</div>`).join('')}
        ${roomMembers.map((member, index) => `
          <button
            class="agent-dot"
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
          <h2>▸ ${company.ownerName} 的 Agent 公司空间</h2>
          <p>${roomCopy[currentRoom.id]}</p>
        </div>

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
  return `
    <aside class="feed">
      <h2>▸ ROOM FEED</h2>
      <ul>
        ${feed.map((item) => `<li>${item}</li>`).join('')}
        <li>${getCurrentRoom().name} 已载入，多房间切换状态已同步。</li>
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
    <div class="app">
      <header class="topbar">
        <div class="brand">
          <h1>${company.name}</h1>
          <p>${company.ownerName} · ${company.ownerTitle}</p>
        </div>
        <div class="meta">
          <p>${company.timeLabel}</p>
          <p>${company.onlineSummary}</p>
        </div>
        <nav class="nav">
          <span class="navlink active">Rooms</span>
          <span class="navlink">Status</span>
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
    </div>
  `;

  attachEvents();
}

function attachEvents() {
  document.querySelectorAll('[data-room-id]').forEach((button) => {
    button.addEventListener('click', () => switchRoom(button.dataset.roomId));
  });

  document.querySelectorAll('[data-member-id]').forEach((element) => {
    element.addEventListener('click', () => {
      state.selectedMemberId = element.dataset.memberId;
      renderApp();
    });
  });
}

function switchRoom(roomId) {
  if (!rooms.some((room) => room.id === roomId) || roomId === state.currentRoomId) {
    return;
  }

  const stage = document.querySelector('.stage');
  if (stage) {
    stage.classList.add('is-transitioning');
  }

  roomState.previousRoomId = state.currentRoomId;
  state.currentRoomId = roomId;
  roomState.currentRoomId = roomId;
  persistCurrentRoomId();

  window.setTimeout(() => {
    renderApp();
    const newStage = document.querySelector('.stage');
    if (newStage) {
      newStage.classList.add('is-transitioning');
      window.setTimeout(() => newStage.classList.remove('is-transitioning'), 320);
    }
  }, 120);
}

renderApp();

import type { ConnectionState } from '../signal/Signal.ts';

export interface CharacterDetail {
  id: string;
  name: string;
  role: string;
  faction: string;
  status: string;
  room: string;
  task: string;
  energy: string;
  avatarPath: string | null;
  activity: string;
}

export interface CharacterPopupState {
  detail: CharacterDetail;
  x: number;
  y: number;
}

export interface ChatEntry {
  id: string;
  speaker: string;
  channel: 'direct' | 'group' | 'system';
  text: string;
  mood: 'info' | 'working' | 'thinking' | 'speaking' | 'error';
  meta: string;
}

export interface SettingsState {
  ambientFx: boolean;
  compactUi: boolean;
  cameraZoom: number;
}

const DEFAULT_SETTINGS: SettingsState = {
  ambientFx: true,
  compactUi: false,
  cameraZoom: 1,
};

export class UiController {
  private loading = document.getElementById('loading');
  private loadingTitle = document.getElementById('loading-title');
  private loadingText = document.getElementById('loading-text');
  private citizenCard = document.getElementById('citizen-card');
  private citizenArt = document.getElementById('citizen-art');
  private citizenName = document.getElementById('citizen-name');
  private citizenMeta = document.getElementById('citizen-meta');
  private citizenTask = document.getElementById('citizen-task');
  private citizenEnergy = document.getElementById('citizen-energy');
  private citizenRoom = document.getElementById('citizen-room');
  private citizenFaction = document.getElementById('citizen-faction');
  private citizenActivity = document.getElementById('citizen-activity');
  private citizenAvatar = document.getElementById('citizen-avatar-chip');
  private popup = document.getElementById('character-popup');
  private popupName = document.getElementById('popup-name');
  private popupMeta = document.getElementById('popup-meta');
  private popupStatus = document.getElementById('popup-status');
  private chatHistory = document.getElementById('chat-history');
  private connectionState = document.getElementById('connection-state');
  private settingsPanel = document.getElementById('settings-panel');
  private settingsButton = document.getElementById('settings-toggle');
  private exitSummary = document.getElementById('room-exits');

  private ambientInput = document.getElementById('setting-ambient') as HTMLInputElement | null;
  private compactInput = document.getElementById('setting-compact') as HTMLInputElement | null;
  private zoomInput = document.getElementById('setting-zoom') as HTMLInputElement | null;
  private zoomValue = document.getElementById('setting-zoom-value');

  private settings: SettingsState = { ...DEFAULT_SETTINGS };

  constructor() {
    this.settingsButton?.addEventListener('click', () => {
      this.settingsPanel?.classList.toggle('is-open');
      this.settingsButton?.classList.toggle('active');
    });

    const sync = () => {
      this.settings = {
        ambientFx: this.ambientInput?.checked ?? DEFAULT_SETTINGS.ambientFx,
        compactUi: this.compactInput?.checked ?? DEFAULT_SETTINGS.compactUi,
        cameraZoom: Number(this.zoomInput?.value ?? DEFAULT_SETTINGS.cameraZoom),
      };
      if (this.zoomValue) {
        this.zoomValue.textContent = `${this.settings.cameraZoom.toFixed(2)}x`;
      }
      document.body.classList.toggle('compact-ui', this.settings.compactUi);
    };

    this.ambientInput?.addEventListener('change', sync);
    this.compactInput?.addEventListener('change', sync);
    this.zoomInput?.addEventListener('input', sync);
    sync();
  }

  getSettings(): SettingsState {
    return { ...this.settings };
  }

  onSettingsChange(callback: (settings: SettingsState) => void) {
    const handler = () => callback(this.getSettings());
    this.ambientInput?.addEventListener('change', handler);
    this.compactInput?.addEventListener('change', handler);
    this.zoomInput?.addEventListener('input', handler);
    callback(this.getSettings());
  }

  setLoading(visible: boolean, title = '连接共鸣网络', text = 'Canvas 场景与心跳流正在同步…') {
    if (!this.loading) return;
    this.loading.classList.toggle('is-hidden', !visible);
    if (this.loadingTitle) this.loadingTitle.textContent = title;
    if (this.loadingText) this.loadingText.textContent = text;
  }

  setConnectionState(state: ConnectionState) {
    if (!this.connectionState) return;
    const label = {
      idle: '待命',
      connecting: '连接中',
      connected: '在线',
      reconnecting: '重连中',
      disconnected: '离线',
      error: '异常',
    }[state];
    this.connectionState.textContent = label;
    this.connectionState.dataset.state = state;
  }

  setExitSummary(exits: string[]) {
    if (this.exitSummary) {
      this.exitSummary.textContent = exits.length > 0 ? exits.join(' · ') : '暂无出口';
    }
  }

  setSelectedCitizen(detail: CharacterDetail | null, fallbackRoom: string, fallbackArt: string | null) {
    if (
      !this.citizenCard ||
      !this.citizenName ||
      !this.citizenMeta ||
      !this.citizenTask ||
      !this.citizenEnergy ||
      !this.citizenRoom ||
      !this.citizenFaction ||
      !this.citizenAvatar ||
      !this.citizenActivity
    ) {
      return;
    }

    if (!detail) {
      this.citizenCard.classList.add('is-empty');
      this.citizenName.textContent = '选择共鸣者';
      this.citizenMeta.textContent = '点击角色查看详情，或点击出口切换地区';
      this.citizenFaction.textContent = '共鸣者档案';
      this.citizenTask.textContent = '--';
      this.citizenEnergy.textContent = '--';
      this.citizenRoom.textContent = fallbackRoom;
      this.citizenActivity.textContent = '观察中';
      setElementBackground(this.citizenArt, fallbackArt);
      setElementBackground(this.citizenAvatar, null);
      return;
    }

    this.citizenCard.classList.remove('is-empty');
    this.citizenName.textContent = detail.name;
    this.citizenMeta.textContent = `${detail.role} · ${detail.status}`;
    this.citizenFaction.textContent = detail.faction;
    this.citizenTask.textContent = detail.task;
    this.citizenEnergy.textContent = detail.energy;
    this.citizenRoom.textContent = detail.room;
    this.citizenActivity.textContent = detail.activity;
    setElementBackground(this.citizenArt, detail.avatarPath);
    setElementBackground(this.citizenAvatar, detail.avatarPath);
  }

  setCharacterPopup(state: CharacterPopupState | null) {
    if (!this.popup || !this.popupName || !this.popupMeta || !this.popupStatus) return;

    if (!state) {
      this.popup.classList.remove('is-visible');
      return;
    }

    this.popup.classList.add('is-visible');
    this.popup.style.transform = `translate(${Math.round(state.x)}px, ${Math.round(state.y)}px)`;
    this.popupName.textContent = state.detail.name;
    this.popupMeta.textContent = `${state.detail.role} · ${state.detail.faction}`;
    this.popupStatus.textContent = `${state.detail.status} · ${state.detail.activity}`;
  }

  setChatHistory(entries: ChatEntry[]) {
    if (!this.chatHistory) return;
    this.chatHistory.innerHTML = entries.map((entry) => {
      const speaker = escapeHtml(entry.speaker);
      const text = escapeHtml(entry.text);
      const meta = escapeHtml(entry.meta);
      return `
        <li class="chat-entry" data-channel="${entry.channel}" data-mood="${entry.mood}">
          <div class="chat-line">
            <strong>${speaker}</strong>
            <span>${meta}</span>
          </div>
          <p>${text}</p>
        </li>
      `;
    }).join('');
  }
}

function setElementBackground(element: HTMLElement | null, src: string | null) {
  if (!element) return;
  element.style.backgroundImage = src
    ? `linear-gradient(180deg, rgba(8, 12, 28, 0.1), rgba(8, 12, 28, 0.85)), url("${src}")`
    : 'none';
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

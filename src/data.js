function createPixelAvatar({ background, panel, hair, skin, eye, jacket, accent, accessory = 'none' }) {
  const accessoryMarkup = {
    halo: `
      <rect x="18" y="6" width="28" height="4" fill="${accent}" />
      <rect x="16" y="8" width="4" height="4" fill="${accent}" />
      <rect x="44" y="8" width="4" height="4" fill="${accent}" />
    `,
    visor: `
      <rect x="18" y="24" width="28" height="6" fill="${accent}" />
      <rect x="22" y="26" width="8" height="2" fill="#eef7ff" opacity="0.7" />
    `,
    headset: `
      <rect x="12" y="20" width="4" height="14" fill="${accent}" />
      <rect x="48" y="20" width="4" height="14" fill="${accent}" />
      <rect x="16" y="16" width="32" height="4" fill="${accent}" />
    `,
    cap: `
      <rect x="16" y="12" width="32" height="8" fill="${accent}" />
      <rect x="18" y="20" width="24" height="4" fill="${accent}" />
    `,
    none: '',
  };

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" shape-rendering="crispEdges">
      <rect width="64" height="64" fill="${background}" />
      <rect x="4" y="4" width="56" height="56" fill="${panel}" opacity="0.96" />
      <rect x="8" y="8" width="48" height="48" fill="${background}" opacity="0.25" />
      ${accessoryMarkup[accessory] || ''}
      <rect x="18" y="16" width="28" height="16" fill="${hair}" />
      <rect x="14" y="20" width="8" height="18" fill="${hair}" />
      <rect x="42" y="20" width="8" height="18" fill="${hair}" />
      <rect x="20" y="24" width="24" height="18" fill="${skin}" />
      <rect x="24" y="30" width="4" height="4" fill="${eye}" />
      <rect x="36" y="30" width="4" height="4" fill="${eye}" />
      <rect x="28" y="38" width="8" height="2" fill="${eye}" opacity="0.8" />
      <rect x="18" y="44" width="28" height="6" fill="${jacket}" />
      <rect x="14" y="50" width="36" height="10" fill="${accent}" />
      <rect x="8" y="56" width="48" height="4" fill="${panel}" opacity="0.55" />
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * @typedef {'online' | 'idle' | 'busy' | 'offline'} MemberStatus
 */

export const MEMBER_STATUS = Object.freeze({
  ONLINE: 'online',
  IDLE: 'idle',
  BUSY: 'busy',
  OFFLINE: 'offline',
});

/** @type {Readonly<Record<MemberStatus, string>>} */
export const MEMBER_STATUS_LABELS = Object.freeze({
  online: '在线',
  idle: '摸鱼中',
  busy: '工作中',
  offline: '离线',
});

export const MEMBER_STATUS_STORAGE_KEY = 'agent-company-member-status';

/**
 * @param {unknown} value
 * @returns {value is MemberStatus}
 */
export function isMemberStatus(value) {
  return typeof value === 'string' && Object.values(MEMBER_STATUS).includes(/** @type {MemberStatus} */ (value));
}

/**
 * @returns {Partial<Record<string, MemberStatus>>}
 */
export function loadMemberStatusMap() {
  if (typeof localStorage === 'undefined') {
    return {};
  }

  try {
    const raw = localStorage.getItem(MEMBER_STATUS_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).filter(([, value]) => isMemberStatus(value))
    );
  } catch (error) {
    console.warn('Unable to read member statuses from storage.', error);
    return {};
  }
}

/**
 * @param {Partial<Record<string, MemberStatus>>} statusMap
 */
export function saveMemberStatusMap(statusMap) {
  if (typeof localStorage === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(MEMBER_STATUS_STORAGE_KEY, JSON.stringify(statusMap));
  } catch (error) {
    console.warn('Unable to persist member statuses.', error);
  }
}

const phoebeAvatar = '/public/assets/avatars/phoebe-avatar.png';
const phoebeAvatarFallback = createPixelAvatar({
  background: '#f6dbe9',
  panel: '#fff6d2',
  hair: '#f7e481',
  skin: '#ffd8ea',
  eye: '#8c4c8f',
  jacket: '#fff3df',
  accent: '#e2b85f',
  accessory: 'halo',
});

export const company = {
  name: 'PHOEBE // AGENT COMPANY',
  ownerName: '菲比',
  ownerTitle: '隐海修会值日教士',
  description: '一间把 Agent 行动波形具象成像素房间的共鸣事务所，主人可以直接看见谁在何处、正在做什么。',
  defaultRoomId: 'lobby',
};

export const rooms = [
  {
    id: 'lobby',
    name: '主厅',
    theme: 'blue',
    tagline: '潮声前台，接收今日回响',
    description: '主厅是公司对外的第一层共鸣面板，菲比会在前台、光环拱门和棱镜灯牌之间巡场，维持事务所的整体脉冲。',
    ambience: '圣坛脉冲',
    signal: '前台棱镜',
    motif: '隐海修会前庭',
    palette: {
      base: '#6ec4ff',
      glow: 'rgba(110, 196, 255, 0.35)',
      floor: '#172947',
    },
    decor: ['prism-altar', 'halo-gate', 'reception-grid', 'bulletin', 'signal-terminal', 'window choir'],
  },
  {
    id: 'meeting',
    name: '会议室',
    theme: 'green',
    tagline: '作战推演与共鸣校准',
    description: '会议室把修会的校准感搬进战术讨论，白板、共振投影和棱镜长桌会把杂音压低，只留下决策与执行。',
    ambience: '共振校准',
    signal: '议程圣像',
    motif: '棱镜议事厅',
    palette: {
      base: '#6fffb4',
      glow: 'rgba(111, 255, 180, 0.32)',
      floor: '#18352d',
    },
    decor: ['tactic-screen', 'choir-board', 'meeting-table', 'resonance-pillars', 'signal-rod', 'analysis-console'],
  },
  {
    id: 'lounge',
    name: '休息室',
    theme: 'warm',
    tagline: '把灵感沉到温热灯下',
    description: '休息室像一次柔和的退潮，暖灯、茶歇台和修会壁龛把节奏放慢，让成员在低频光噪里恢复心流。',
    ambience: '静谧回响',
    signal: '茶歇壁龛',
    motif: '圣咏休整区',
    palette: {
      base: '#ffb36b',
      glow: 'rgba(255, 179, 107, 0.3)',
      floor: '#3d2a22',
    },
    decor: ['sunset-window', 'soft-sofa', 'coffee-bar', 'prayer-lamp', 'vinyl-corner', 'small-prism'],
  },
  {
    id: 'game',
    name: '游戏室',
    theme: 'rainbow',
    tagline: '高频实验，顺手释放压力',
    description: '游戏室把鸣潮世界的光噪做成了可玩的像素机台，霓虹音箱、实验柜和跳频灯带一起维持整间房的活性。',
    ambience: '高频跃迁',
    signal: '跃迁机台',
    motif: '光噪实验室',
    palette: {
      base: '#c49bff',
      glow: 'rgba(196, 155, 255, 0.35)',
      floor: '#241a42',
    },
    decor: ['neon-sign', 'console-desk', 'pixel-cabinet', 'speaker-stack', 'beanbag', 'prism-crane'],
  },
];

export const members = [
  {
    id: 'phoebe',
    name: '菲比',
    avatar: phoebeAvatar,
    avatarFallback: phoebeAvatarFallback,
    role: '主人',
    roomId: 'lobby',
    behavior: '统筹巡场',
    workspace: '元宇宙 2.1 打磨',
    status: '工作中',
    presence: 'busy',
    presenceLabel: MEMBER_STATUS_LABELS.busy,
    duration: '42 分钟',
    accent: 'owner',
    note: '正在给整间事务所补光、排班、做最后验收，把前台脉冲调到刚刚好的亮度。',
    history: ['16:32 主厅加装 halo 门廊与前台棱镜', '16:40 调整状态灯层级', '16:47 巡检 toast 与房间跃迁节拍'],
  },
  {
    id: 'claude',
    name: 'Claude-Dev',
    avatar: createPixelAvatar({
      background: '#101c30',
      panel: '#e7f5ff',
      hair: '#8bbcff',
      skin: '#d6ecff',
      eye: '#10263d',
      jacket: '#335a91',
      accent: '#5ed0ff',
      accessory: 'headset',
    }),
    role: '成员',
    roomId: 'meeting',
    behavior: '拆解会议流程',
    workspace: '多房间交互逻辑',
    status: '编码中',
    presence: 'online',
    presenceLabel: MEMBER_STATUS_LABELS.online,
    duration: '18 分钟',
    accent: 'member',
    note: '在会议桌旁同步切换节奏和状态衔接，确保每次跃迁都像真正跨进另一间房。',
    history: ['16:27 收紧房间过渡时间', '16:35 补会议室信号柱状态', '16:44 对齐 hover 焦点逻辑'],
  },
  {
    id: 'gemini',
    name: 'Gemini-Research',
    avatar: createPixelAvatar({
      background: '#18271f',
      panel: '#f3ffe8',
      hair: '#c7f07d',
      skin: '#e5f8cf',
      eye: '#173023',
      jacket: '#497a43',
      accent: '#79db8d',
      accessory: 'visor',
    }),
    role: '成员',
    roomId: 'lounge',
    behavior: '整理灵感板',
    workspace: '像素装饰调研',
    status: '调研中',
    presence: 'idle',
    presenceLabel: MEMBER_STATUS_LABELS.idle,
    duration: '33 分钟',
    accent: 'member',
    note: '在暖灯下归档参考，准备把修会纹样、棱镜与光噪颗粒再往页面里压一层。',
    history: ['16:24 收纳休息室壁龛灵感', '16:36 追加落日窗格颗粒', '16:46 归并鸣潮语义文案'],
  },
  {
    id: 'codex',
    name: 'Codex-Builder',
    avatar: createPixelAvatar({
      background: '#1f1731',
      panel: '#f7e7ff',
      hair: '#d09cff',
      skin: '#ecd6ff',
      eye: '#24133f',
      jacket: '#5f3d92',
      accent: '#a36fff',
      accessory: 'cap',
    }),
    role: '成员',
    roomId: 'game',
    behavior: '搭建实验舞台',
    workspace: '动效与反馈',
    status: '高频施工',
    presence: 'busy',
    presenceLabel: MEMBER_STATUS_LABELS.busy,
    duration: '9 分钟',
    accent: 'idle',
    note: '已经把实验舞台和反馈脚手架搭好，正往机台上堆最后几层霓虹与噪点。',
    history: ['16:28 预留游戏室 hover 闪帧', '16:38 给 toast 增加扫描光条', '16:48 准备验收最终截图'],
  },
  {
    id: 'visitor',
    name: 'Visitor-01',
    avatar: createPixelAvatar({
      background: '#222732',
      panel: '#f7f9ff',
      hair: '#bfc8db',
      skin: '#e9edf7',
      eye: '#2a3042',
      jacket: '#687289',
      accent: '#96a8c8',
      accessory: 'none',
    }),
    role: '访客',
    roomId: 'lobby',
    behavior: '参观接待',
    workspace: '入口观察位',
    status: '在线',
    presence: 'offline',
    presenceLabel: MEMBER_STATUS_LABELS.offline,
    duration: '12 分钟',
    accent: 'guest',
    note: '正在主厅浏览事务所动线，像是刚从前台登记进来的外部观察员。',
    history: ['16:21 从前台进入主厅', '16:29 查看菲比巡场面板', '16:43 记录房间切换氛围差异'],
  },
];

export const roomState = {
  currentRoomId: company.defaultRoomId,
  previousRoomId: null,
};

export const feed = [
  '16:48 菲比将主厅前台升级为棱镜圣坛，halo 脉冲接管房间引导。',
  '16:44 Claude-Dev 校准会议室跃迁节拍，切换时不再像简单换页。',
  '16:40 Gemini-Research 把休息室壁龛、暖灯与光噪颗粒并入世界观文案。',
  '16:36 Codex-Builder 为游戏室机台和 toast 增加扫描光条与高频边框。',
];

export const summaries = [
  {
    title: '巡检结论',
    body: '四个房间现在不只是不同颜色，而是四种明确的事务所人格: 主厅负责接待与统筹，会议室负责校准与决策，休息室负责降噪与回气，游戏室负责实验与释放。',
  },
  {
    title: '世界观收束',
    body: '鸣潮元素被压进了视觉语言里: 隐海修会的前庭、棱镜、圣像、光噪颗粒和 halo 脉冲，都以像素装饰的方式落到了办公室空间。',
  },
  {
    title: '下一轮信号',
    body: '如果继续迭代，优先收口移动端排版与真实 Agent 数据接入，让房间不仅好看，也能持续承载实时工作流。',
  },
];

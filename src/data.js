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

const phoebeAvatar = '/assets/avatars/phoebe-avatar.png';
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
    description: '主厅是公司对外的第一层共鸣面板，负责迎接访客、汇总状态和维持整座空间的节律。',
    ambience: '巡检中',
    signal: '高亮前台',
    palette: {
      base: '#6ec4ff',
      glow: 'rgba(110, 196, 255, 0.35)',
      floor: '#172947',
    },
    decor: ['welcome-sign', 'window', 'bulletin', 'vending', 'plant-large'],
  },
  {
    id: 'meeting',
    name: '会议室',
    theme: 'green',
    tagline: '作战推演与共鸣校准',
    description: '会议室专门承接路线讨论、任务拆解和决策收束，灯光会压低，让信息与决断更集中。',
    ambience: '议程同步',
    signal: '战术白板',
    palette: {
      base: '#6fffb4',
      glow: 'rgba(111, 255, 180, 0.32)',
      floor: '#18352d',
    },
    decor: ['screen-wall', 'meeting-table', 'whiteboard', 'speaker', 'plant'],
  },
  {
    id: 'lounge',
    name: '休息室',
    theme: 'warm',
    tagline: '把灵感沉到温热灯下',
    description: '休息室负责降噪、补能和整理灵感，像是一次短暂的潮声退去，让成员重新校准状态。',
    ambience: '低频放松',
    signal: '茶歇补能',
    palette: {
      base: '#ffb36b',
      glow: 'rgba(255, 179, 107, 0.3)',
      floor: '#3d2a22',
    },
    decor: ['sunset-window', 'sofa', 'coffee-bar', 'lamp', 'arcade-mini'],
  },
  {
    id: 'game',
    name: '游戏室',
    theme: 'rainbow',
    tagline: '高频实验，顺手释放压力',
    description: '游戏室收纳团队最轻快的一面，允许实验、娱乐和高能互动并存，让空间保持活力而不过载。',
    ambience: '能量拉满',
    signal: '实验机台',
    palette: {
      base: '#c49bff',
      glow: 'rgba(196, 155, 255, 0.35)',
      floor: '#241a42',
    },
    decor: ['neon-sign', 'console-desk', 'pixel-cabinet', 'speaker-stack', 'beanbag'],
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
    duration: '42 分钟',
    accent: 'owner',
    note: '正在给整间事务所补光、排班、做最后验收。',
    history: ['16:06 主厅灯牌重写为潮声前台', '16:15 为房间切换补了一层跃迁提示', '16:22 巡检访客入口与头像边框'],
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
    duration: '18 分钟',
    accent: 'member',
    note: '在会议桌旁同步切换节奏和状态衔接，避免房间感断裂。',
    history: ['16:01 校正会议室焦点成员逻辑', '16:10 把议程白板改成战术面板', '16:19 收敛切换动画的节拍'],
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
    duration: '33 分钟',
    accent: 'member',
    note: '在暖灯下归档参考，准备把房间装饰做得更像一个会呼吸的空间。',
    history: ['15:58 收到休息室暖色方向确认', '16:11 把像素窗景细化成落日层次', '16:17 追加一轮光效参考'],
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
    status: '待命',
    duration: '9 分钟',
    accent: 'idle',
    note: '已经把交互脚手架搭好，随时可以往游戏室再塞一点活力。',
    history: ['16:03 预留游戏室状态提示位', '16:14 为 toast 补像素边框', '16:20 准备处理 hover 反馈'],
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
    duration: '12 分钟',
    accent: 'guest',
    note: '正在主厅浏览公司动线，对多房间切换表现出明显兴趣。',
    history: ['16:00 从前台进入主厅', '16:08 查看菲比巡场面板', '16:21 观察像素舞台的房间切换'],
  },
];

export const roomState = {
  currentRoomId: company.defaultRoomId,
  previousRoomId: null,
};

export const feed = [
  '16:22 菲比为主厅补上潮声前台灯牌',
  '16:18 Claude-Dev 收敛房间切换节拍',
  '16:13 Gemini-Research 新增落日窗景参考',
  '16:09 Codex-Builder 为 toast 预热像素外框',
];

export const summaries = [
  { title: '巡检结论', body: '四个房间已经形成明确气质：主厅看全局，会议室做决策，休息室沉淀灵感，游戏室释放能量。' },
  { title: '当前进度', body: '本轮重点转向视觉氛围和互动节拍，目标是在保留 CRT 的前提下让空间更有生命感。' },
  { title: '下一轮信号', body: '继续补强角色肖像、状态反馈和房间细节，让每位成员都像真正驻留在事务所里。' },
];

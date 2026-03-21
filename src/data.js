export const company = {
  name: 'Agent-Company',
  ownerName: '菲比',
  ownerTitle: '公司主人',
  timeLabel: 'Tuesday · 16:30',
  onlineSummary: '5 位在线 · 2 位工作中 · 1 份新总结',
  defaultRoomId: 'lobby',
};

export const rooms = [
  {
    id: 'lobby',
    name: '主厅',
    theme: 'blue',
    tagline: '欢迎所有成员进入今日主舞台',
    description: '主厅负责总览公司运转状态，适合展示主人、访客和活跃中的核心成员。',
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
    tagline: '同步计划、拆解任务、做出决定',
    description: '会议室用于多人协作讨论，突出桌面、屏幕和更紧凑的座位分布。',
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
    tagline: '补充能量，短暂停靠，整理灵感',
    description: '休息室以暖色像素灯光和柔软家具为主，适合展示放松与恢复中的成员。',
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
    tagline: '高能互动，点燃团队气氛',
    description: '游戏室用更亮的彩色灯牌和设备表达活跃互动，承担实验和娱乐氛围。',
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
    role: '主人',
    roomId: 'lobby',
    behavior: '统筹中',
    workspace: '元宇宙 2.0 升级',
    status: '工作中',
    accent: 'owner',
    note: '正在安排今天的工作',
  },
  {
    id: 'claude',
    name: 'Claude-Dev',
    role: '成员',
    roomId: 'meeting',
    behavior: '开会中',
    workspace: '多房间架构',
    status: '编码中',
    accent: 'member',
    note: '讨论房间切换逻辑',
  },
  {
    id: 'gemini',
    name: 'Gemini-Research',
    role: '成员',
    roomId: 'lounge',
    behavior: '调研中',
    workspace: '视觉参考板',
    status: '调研中',
    accent: 'member',
    note: '整理配色与素材方向',
  },
  {
    id: 'codex',
    name: 'Codex-Builder',
    role: '成员',
    roomId: 'game',
    behavior: '实验中',
    workspace: '交互原型',
    status: '待命',
    accent: 'idle',
    note: '等待下一步任务',
  },
  {
    id: 'visitor',
    name: 'Visitor-01',
    role: '访客',
    roomId: 'lobby',
    behavior: '参观中',
    workspace: '入口接待',
    status: '在线',
    accent: 'guest',
    note: '短暂接入中',
  },
];

export const roomState = {
  currentRoomId: company.defaultRoomId,
  previousRoomId: null,
};

export const feed = [
  '16:18 菲比切换为工作状态',
  '16:12 Claude-Dev 更新首页模块说明',
  '16:05 Gemini-Research 整理素材方向',
  '15:56 新增首页原型执行顺序',
];

export const summaries = [
  { title: '今日总结', body: '产品定位、首页信息架构、素材策略已经收拢完成。' },
  { title: '最近汇报', body: '首页第一屏正在从规划切换到静态原型准备阶段。' },
  { title: '下一步', body: '继续收敛主舞台参考、菲比案例表达和基础素材包。' },
];

# Agent-Company v3.0 - 当前任务：多主题切换系统

## 任务状态
**当前进行中**: TASK_多主题支持
**Session**: agent:codex:acp:7463e8a3-3e95-4746-896b-981d396d0ffc

## 项目路径
/Users/golden-tenet/claw-spaces/Phoebe/Projects/Agent-Company-v3

## 任务目标
基于 miniverse 架构，全面重构 Agent-Company 为鸣潮主题的动态像素世界。

## 参考项目
- **Miniverse 路径**: /Users/golden-tenet/claw-spaces/Phoebe/Projects/miniverse
- **原 Agent-Company 路径**: /Users/golden-tenet/claw-spaces/Phoebe/Projects/Agent-Company
- **目标仓库**: https://github.com/EASYGOING45/Agent-Company.git

## Miniverse 架构分析

### 核心模块
1. **@miniverse/core** - Canvas 等距渲染引擎
   - Renderer: Canvas 2D 渲染器
   - Scene: 场景/瓦片系统
   - Citizen: 角色/Agent 系统
   - SpriteSheet: 精灵图管理
   - ParticleSystem: 粒子效果
   - SpeechBubbleSystem: 对话气泡
   - Signal: WebSocket/通信

2. **@miniverse/server** - 本地服务器
   - REST API
   - WebSocket 实时通信
   - Agent 状态管理

3. **demo** - 前端展示
   - 使用 core 引擎
   - 世界场景数据

### 关键配置
```typescript
interface MiniverseConfig {
  container: HTMLElement;
  world: string;
  scene: string;
  signal: SignalConfig;
  citizens: CitizenConfig[];
  scale?: number;
  width?: number;
  height?: number;
  worldBasePath?: string;
  spriteSheets?: Record<string, SpriteSheetConfig>;
  sceneConfig?: SceneConfig;
  objects?: ObjectConfig[];
  defaultSprites?: string[];
  autoSpawn?: boolean;
}
```

## 重构计划

### Phase 1: 项目初始化
1. 在 Projects/Agent-Company-v3/ 创建新项目
2. 复制 miniverse 的核心架构
3. 设置构建工具链 (Vite + TypeScript)

### Phase 2: 鸣潮主题改造

#### 角色系统 (9位鸣潮角色)
| ID | 名称 | 阵营 | 颜色 |
|----|------|------|------|
| phoebe | 菲比 | 黎那汐塔 | 金色 |
| changli | 长离 | 瑝珑 | 红色 |
| jinxi | 今汐 | 瑝珑 | 蓝白色 |
| jiyan | 忌炎 | 瑝珑 | 绿色 |
| xiangliyao | 相里要 | 瑝珑 | 蓝色 |
| zani | 赞妮 | 黎那汐塔 | 蓝紫色 |
| brant | 布兰特 | 黎那汐塔 | 红色 |
| colletta | 珂莱塔 | 黎那汐塔 | 蓝白色 |
| roccia | 洛可可 | 黎那汐塔 | 粉色 |

#### 场景系统 (4个鸣潮区域)
| ID | 名称 | 风格 | 主色调 |
|----|------|------|--------|
| huanglong | 今州 | 中式古风 | 青绿色 |
| blackshores | 黑海岸 | 科幻未来 | 紫色 |
| rinascita | 拉古那 | 欧式古典 | 金红色 |
| frontier | 前线 | 战场废墟 | 灰橙色 |

#### 视觉风格改造
- **背景**: 深色 `#0f0f1a` (比 miniverse 更深的底色)
- **强调色**: 金色 `#d6b07f` (Agent-Company 品牌色)
- **次要色**: 根据场景变化
- **字体**: 等宽字体 + 中文字体支持

### Phase 3: 数据迁移
1. 复用现有角色立绘 (public/assets/portraits/)
2. 复用现有头像 (public/assets/avatars/)
3. 生成新的精灵图配置
4. 创建场景瓦片数据

### Phase 4: 功能增强
1. 保留状态管理系统 (online/idle/busy/offline)
2. 添加角色详情面板
3. 添加场景切换动画
4. 添加中文 UI

### Phase 5: 构建部署
1. 构建项目
2. 推送到 GitHub
3. 部署到 Cloudflare Pages

## 技术规范

### 文件结构
```
Agent-Company-v3/
├── packages/
│   └── core/              # 从 miniverse 复制并改造
│       ├── src/
│       │   ├── renderer/
│       │   ├── scene/
│       │   ├── citizens/
│       │   ├── sprites/
│       │   ├── effects/
│       │   └── signal/
│       └── package.json
├── server/                # 从 miniverse 复制并改造
│   ├── src/
│   └── package.json
├── demo/                  # 前端展示
│   ├── src/
│   │   ├── main.ts
│   │   └── worlds/
│   ├── worlds/
│   │   ├── huanglong/
│   │   ├── blackshores/
│   │   ├── rinascita/
│   │   └── frontier/
│   └── index.html
├── assets/                # 角色资源
│   ├── portraits/
│   ├── avatars/
│   └── sprites/
└── package.json
```

### 状态映射
| Agent-Company | Miniverse |
|---------------|-----------|
| online | idle |
| idle | idle |
| busy | working |
| offline | offline |

### API 兼容
- 保持现有的 REST API 接口
- 保持 WebSocket 实时通信
- 保持心跳机制

## 验收标准
- [ ] 9位鸣潮角色在场景中显示
- [ ] 4个场景可切换
- [ ] 角色状态驱动动画
- [ ] 金色主题视觉风格
- [ ] 中文 UI 支持
- [ ] 成功部署到 Cloudflare Pages
- [ ] 代码推送到 GitHub

## 提交信息规范
```
feat: rebuild Agent-Company with miniverse architecture

- Migrate to miniverse isometric rendering engine
- Add 9 Wuthering Waves characters
- Create 4 region scenes (huanglong/blackshores/rinascita/frontier)
- Implement golden theme design
- Add Chinese language support
- Deploy to Cloudflare Pages
```

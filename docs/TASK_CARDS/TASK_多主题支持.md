# TASK_多主题支持 - Agent-Company 主题切换系统

**状态**：⏳进行中

**创建时间**：2026-03-28
**执行代理**：codex

---

## 🎯 任务目标

为 Agent-Company 添加**多主题切换系统**，让用户可以在不同视觉风格之间切换，提升产品个性化和可玩性。

## 🎨 主题设计

### 主题列表

1. **金色 resonance（默认）** - 当前主题，金色/暖色调，鸣潮共鸣主题
2. **极夜 Nightfall** - 深蓝/紫色调，冷峻赛博朋克风格
3. **薄暮 Twilight** - 柔粉/浅紫，温柔梦幻风格
4. **棱镜 Prism** - 彩虹渐变，多彩活力风格

### 每个主题需要覆盖

- 主色调（--accent, --accent-gold 等 CSS 变量）
- 背景渐变
- 文字颜色
- 边框/高亮色
- Canvas 场景色调滤镜（如果适用）
- Tab/按钮激活色

## 📦 涉及文件

- `src/styles.css` - 添加主题 CSS 变量系统
- `src/data.js` - 添加主题配置数据
- `src/main.ts` - 添加主题切换逻辑
- `index.html` - 添加主题选择器 UI

## 📋 执行步骤

### Step 1：扩展 CSS 变量主题系统

在 `styles.css` 底部添加：

```css
/* 主题变量覆盖 */
body[data-theme="nightfall"] {
  --bg-0: #0a0d1a;
  --bg-1: #0f1428;
  --bg-2: #161d38;
  --text: #e8edf8;
  --muted: rgba(232, 237, 248, 0.6);
  --accent: #7b9fff;
  --accent-secondary: #4d65cc;
  --accent-soft: rgba(123, 159, 255, 0.2);
  --accent-gold: #a8baff;
  --region-wash: rgba(123, 159, 255, 0.08);
  --line: rgba(123, 159, 255, 0.15);
}

body[data-theme="twilight"] {
  --bg-0: #1a0f18;
  --bg-1: #251420;
  --bg-2: #321c2a;
  --text: #fff5f8;
  --muted: rgba(255, 245, 248, 0.6);
  --accent: #ff9ec8;
  --accent-secondary: #cc5c99;
  --accent-soft: rgba(255, 158, 200, 0.2);
  --accent-gold: #ffb8da;
  --region-wash: rgba(255, 158, 200, 0.08);
  --line: rgba(255, 158, 200, 0.15);
}

body[data-theme="prism"] {
  --bg-0: #0d1020;
  --bg-1: #12162e;
  --bg-2: #181e40;
  --text: #ffffff;
  --muted: rgba(255, 255, 255, 0.6);
  --accent: #ff6b9d;
  --accent-secondary: #c54b8c;
  --accent-soft: rgba(255, 107, 157, 0.2);
  --accent-gold: #ffd93d;
  --region-wash: rgba(255, 217, 61, 0.08);
  --line: rgba(255, 217, 61, 0.15);
}
```

### Step 2：添加主题数据到 data.js

添加主题配置数组：

```typescript
export const THEMES = [
  { id: 'resonance', name: '金色共鸣', emoji: '✨', accent: '#d6b07f' },
  { id: 'nightfall', name: '极夜', emoji: '🌙', accent: '#7b9fff' },
  { id: 'twilight', name: '薄暮', emoji: '🌸', accent: '#ff9ec8' },
  { id: 'prism', name: '棱镜', emoji: '🌈', accent: '#ff6b9d' },
];

export const THEME_STORAGE_KEY = 'agent-company-theme';
```

添加加载/保存函数：

```typescript
export function loadTheme() {
  if (typeof localStorage === 'undefined') return 'resonance';
  return localStorage.getItem(THEME_STORAGE_KEY) || 'resonance';
}

export function saveTheme(themeId: string) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(THEME_STORAGE_KEY, themeId);
}
```

### Step 3：在 main.ts 集成主题切换

在初始化时：
1. 从 localStorage 读取当前主题
2. 将 `data-theme` 属性设置到 body
3. 在设置面板中添加主题选择器（或新建主题选择 UI）
4. 切换主题时更新 body 属性 + localStorage

### Step 4：在 index.html 添加主题选择 UI

在设置面板（settings-panel）中添加主题选择区域：

```html
<div class="settings-row">
  <span>主题</span>
  <div class="theme-selector" id="theme-selector">
    <!-- 动态生成 -->
  </div>
</div>
```

添加主题选择器样式到 CSS。

### Step 5：验证

- 切换主题后页面颜色整体变化
- 刷新后主题保持（localStorage）
- 移动端布局正常

## ✅ 验收标准

- [ ] 页面底部设置面板有主题选择器
- [ ] 点击主题后页面整体色调立即变化
- [ ] 刷新页面主题保持不变
- [ ] 4 个主题视觉差异明显
- [ ] 移动端布局正常

## 🔗 参考

- 主题变量参考现有 `--accent: #d6b07f; --accent-gold: #f2cb96;` 等变量体系
- 主题切换保持现有布局不变，只改变颜色

## 执行记录

（待填充）

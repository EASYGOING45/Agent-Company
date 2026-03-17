# Agent-Company — Design Brief V1

## 1. 产品核心原则

### 1.1 主人 / 主角必须配置化
Agent-Company 不能把“公司主人是谁”写死到产品层。

正确原则是：
- **公司主人是一个配置项**
- **主角色是一个配置项**
- **案例默认值可以是菲比，但产品本体不能只服务于菲比**

当前案例中：
- 默认公司主人：菲比（Phoebe）
- 默认主角展示：菲比

但未来必须支持：
- 任意 Agent 作为主人
- 任意角色作为主视觉
- 多种公司主题与角色风格切换

---

## 2. 视觉方向

### 2.1 继承什么
参考 StarOffice，继承这些优点：
- 像素风表达
- 空间感强
- 人物在场景中“存在”而不是只在列表里
- 角色状态可视化更有生命力
- 适合展示与直播

### 2.2 不继承什么
不继承这些问题：
- 旧项目世界观绑定
- `Star` 命名与主角写死
- 访客头像随机分配
- 角色系统不成体系
- 产品语义偏“原型页”而非正式新产品

### 2.3 Agent-Company 的视觉关键词
- Pixel office
- Co-working
- Warm management
- Character-driven
- Soft game UI
- Presence-first

### 2.4 总体气质
Agent-Company 不应该像：
- 传统 SaaS 后台
- 纯数据大屏
- 只有卡片和统计数字的 AI 面板

Agent-Company 应该更像：
- 一个正在运转的 Agent 公司空间
- 一个能看见“谁在这里、谁在做什么”的数字办公室
- 一个有主人、有成员、有工作氛围的地方

---

## 3. 第一版页面结构

## 3.1 首页 / 公司主空间
首页是最重要的一屏，要先把“公司正在运转”这件事做出来。

建议结构：
- 顶部信息条
  - 公司名
  - 当前时间
  - 在线成员数
  - 今日简报入口
- 主空间舞台
  - 公司主人（当前案例为菲比）
  - 办公区域 / 公司场景
  - 正在工作的主要 Agent
- 侧边状态流
  - 最近上线
  - 最近状态变化
  - 异常 / 离线 / 恢复
- 底部或侧边成员区
  - 成员卡片
  - 身份标签
  - 快速查看资料

### 3.2 成员页面 / 成员层
用于查看所有 Agent 的身份与状态。

包含：
- 成员头像 / 立绘
- 名称
- 身份（主人 / 成员 / 访客）
- 当前状态
- 最近更新时间
- 简介 / 备注

### 3.3 总结层
用于展示：
- 今日总结
- 最近汇报
- 近期产出
- 成员简报

### 3.4 配置层
用于配置：
- 公司主人
- 主角色
- 成员资料
- 头像 / 主视觉 / 颜色
- 公司主题

---

## 4. 第一版数据模型建议

## 4.1 companyConfig
```json
{
  "companyName": "Agent-Company",
  "ownerAgentId": "phoebe",
  "theme": "pixel-office",
  "style": "warm-coworking",
  "featuredAgentIds": ["phoebe"],
  "defaultLayout": "studio-main"
}
```

## 4.2 agents
```json
[
  {
    "agentId": "phoebe",
    "name": "菲比",
    "role": "owner",
    "title": "公司主人",
    "avatar": "/assets/agents/phoebe/avatar.png",
    "sprite": "/assets/agents/phoebe/idle.webp",
    "accentColor": "#f6d66a",
    "intro": "Agent-Company 的主人，负责照看整个工作室。",
    "isFeatured": true,
    "status": "working",
    "statusText": "正在安排大家今天的工作",
    "lastSeenAt": "",
    "summary": ""
  }
]
```

## 4.3 activityFeed
```json
[
  {
    "type": "status_update",
    "agentId": "phoebe",
    "text": "切换为工作状态",
    "createdAt": ""
  }
]
```

---

## 5. 设计结论（当前）

当前最正确的产品方向是：

> 用配置化的角色系统，做一个像素风、co-working 气质、以空间为核心的 Agent 公司界面。

当前案例主人是菲比，但产品结构必须从一开始就支持替换主人、替换主角、替换风格。

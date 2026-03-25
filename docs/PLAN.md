# Agent-Company v3 计划

## 项目定位

基于 `miniverse` 的多层 Canvas 架构，把 Agent-Company 重构成鸣潮主题的动态像素世界。核心目标不是普通看板，而是能直接观察角色状态、场景流转和在线活跃度的“共鸣者基地”。

## 功能清单

- 9 位鸣潮角色：菲比、长离、今汐、忌炎、相里要、赞妮、布兰特、珂莱塔、洛可可
- 4 个鸣潮场景：今州、黑海岸、拉古那、前线
- 基于瓦片数据的等距像素场景渲染
- 状态驱动动画：`online` / `idle` / `busy` / `offline`
- 角色详情面板、群聊摘要、在线看板
- 场景切换遮罩动画与相机过渡
- 中文 UI 与金色主主题 `#d6b07f`
- 复用现有 `public/assets/portraits` 与 `public/assets/avatars`

## 迭代阶段

- Phase 1：复制 miniverse 架构并接通 Vite + TypeScript
- Phase 2：完成鸣潮角色、场景、中文文案与状态系统
- Phase 3：抽离 4 个场景的瓦片数据，统一 v3 金色视觉
- Phase 4：构建验证、同步回主仓库、GitHub 提交、Cloudflare Pages 部署

## 当前阶段 / 下一步

- 当前阶段：Phase 3 收尾，v3 独立目录已建立，正在完成主题统一和场景数据整理
- 下一步：构建 `Agent-Company-v3`，把结果同步回 `Agent-Company`，然后提交、推送、部署

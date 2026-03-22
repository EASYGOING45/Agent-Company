/**
 * 鸣潮元宇宙 - 动画定义
 */

export interface AnimationDef {
  sheet: string;      // 精灵图名称
  row: number;        // 行号
  frames: number;     // 帧数
  speed: number;      // 播放速度（秒/帧）
}

export interface SpriteSheetConfig {
  sheets: Record<string, string>;  // 精灵图路径
  animations: Record<string, AnimationDef>;
  frameWidth: number;
  frameHeight: number;
}

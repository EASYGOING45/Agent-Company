/**
 * 鸣潮元宇宙 - 心跳上报示例
 * 
 * 如何让 Agent 接入鸣潮元宇宙：
 * 
 * 1. 直接 HTTP POST（任意语言）:
 *    curl -X POST http://localhost:4321/api/heartbeat \
 *      -H "Content-Type: application/json" \
 *      -d '{"agent":"phoebe","name":"菲比","state":"working","task":"元宇宙开发","room":"lobby","energy":0.9}'
 * 
 * 2. 定时心跳（建议每 30 秒一次）:
 *    - 状态: working | idle | thinking | sleeping | offline
 *    - room: lobby | meeting | lounge | game
 * 
 * 3. OpenClaw Cron 集成:
 *    - 在 workspace 配置 cron job
 *    - 调用外部 API 发送心跳
 */

const HEARTBEAT_API = 'http://localhost:4321/api/heartbeat';

interface HeartbeatPayload {
  agent: string;      // Agent ID (唯一标识)
  name: string;       // 显示名称
  state: string;      // working | idle | thinking | sleeping | error | speaking | offline
  task?: string;      // 当前任务（显示在气泡中）
  room?: string;      // lobby | meeting | lounge | game
  energy?: number;    // 0.0 - 1.0 能量值
}

async function sendHeartbeat(payload: HeartbeatPayload): Promise<void> {
  try {
    const response = await fetch(HEARTBEAT_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    console.log(`✅ 心跳成功:`, data);
  } catch (error) {
    console.error(`❌ 心跳失败:`, error);
  }
}

// 示例调用
sendHeartbeat({
  agent: 'phoebe',
  name: '菲比',
  state: 'working',
  task: '元宇宙 2.0 开发中',
  room: 'lobby',
  energy: 0.85,
});

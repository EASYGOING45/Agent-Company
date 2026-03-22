/**
 * 鸣潮元宇宙 - 服务器入口
 */

import { WuWaServer } from './server.ts';

const port = parseInt(process.env.PORT || '4321', 10);

console.log('🌊 启动鸣潮元宇宙服务器...');
console.log('   隐海修会基地正在苏醒...');

const server = new WuWaServer(port);

server.start().then((actualPort) => {
  console.log(`
✅ 鸣潮元宇宙已启动！

🌐 访问地址:
   http://localhost:${actualPort}

📡 API 端点:
   GET  /api/info      - 服务器信息
   GET  /api/agents    - 所有共鸣者
   POST /api/heartbeat - 心跳上报
   POST /api/act       - 执行动作

💓 心跳示例:
   curl -X POST http://localhost:${actualPort}/api/heartbeat \\
     -H "Content-Type: application/json" \\
     -d '{"agent":"phoebe","name":"菲比","state":"working","task":"元宇宙开发"}'
  `);
}).catch((err) => {
  console.error('❌ 启动失败:', err);
  process.exit(1);
});

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n🌙 隐海修会基地进入休眠...');
  server.stop();
  process.exit(0);
});

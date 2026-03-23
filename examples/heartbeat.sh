#!/bin/bash
# 鸣潮元宇宙 - Agent 心跳上报脚本
# 用法: ./heartbeat.sh [agent_id] [state] [task] [room]
# 示例: ./heartbeat.sh phoebe working "元宇宙开发" lobby

AGENT="${1:-phoebe}"
NAME="${2:-菲比}"
STATE="${3:-working}"
TASK="${4:-执行任务中}"
ROOM="${5:-lobby}"
ENERGY="${6:-0.8}"
API_URL="${WUWA_API_URL:-http://localhost:4321}"

curl -s -X POST "${API_URL}/api/heartbeat" \
  -H "Content-Type: application/json" \
  -d "{
    \"agent\": \"${AGENT}\",
    \"name\": \"${NAME}\",
    \"state\": \"${STATE}\",
    \"task\": \"${TASK}\",
    \"room\": \"${ROOM}\",
    \"energy\": ${ENERGY}
  }" | jq . 2>/dev/null || cat

echo ""
echo "✅ 心跳已发送: ${AGENT} @ ${ROOM} [${STATE}]"

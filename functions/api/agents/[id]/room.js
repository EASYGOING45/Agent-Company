import {
  errorJson,
  getAgent,
  json,
  readJsonBody,
  updateAgent,
  verifyAgentApiKey,
} from '../../../../kv.js';

export async function onRequestPut(context) {
  try {
    const agentId = context.params.id;
    const body = await readJsonBody(context.request);
    const roomId = typeof body.room_id === 'string' ? body.room_id.trim() : '';

    if (!roomId) {
      return errorJson('room_id is required.');
    }

    if (!(await verifyAgentApiKey(agentId, body.api_key))) {
      return errorJson('Invalid api_key.', 401);
    }

    const existing = await getAgent(agentId);
    if (!existing) {
      return errorJson('Agent not found.', 404);
    }

    await updateAgent(agentId, {
      room_id: roomId,
      bumpHeartbeat: false,
    });

    return json({
      success: true,
      agent_id: agentId,
      room_id: roomId,
    });
  } catch (error) {
    return errorJson(error.message || 'Unable to switch room.');
  }
}

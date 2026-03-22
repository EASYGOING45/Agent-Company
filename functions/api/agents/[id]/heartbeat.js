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
    const apiKey = body.api_key;

    if (!(await verifyAgentApiKey(agentId, apiKey))) {
      return errorJson('Invalid api_key.', 401);
    }

    const existing = await getAgent(agentId);
    if (!existing) {
      return errorJson('Agent not found.', 404);
    }

    await updateAgent(agentId, {
      status: body.status,
      room_id: body.room_id || existing.room_id,
      behavior: body.behavior,
      workspace: body.workspace,
      duration: body.duration,
      note: body.note,
    });

    return json({
      success: true,
      server_time: new Date().toISOString(),
    });
  } catch (error) {
    return errorJson(error.message || 'Unable to update heartbeat.');
  }
}

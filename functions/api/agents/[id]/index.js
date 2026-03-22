import {
  deleteAgent,
  errorJson,
  getAgent,
  json,
  readJsonBody,
  verifyAgentApiKey,
} from '../../../../kv.js';

export async function onRequestDelete(context) {
  try {
    const agentId = context.params.id;
    const body = await readJsonBody(context.request);

    if (!(await verifyAgentApiKey(agentId, body.api_key))) {
      return errorJson('Invalid api_key.', 401);
    }

    const existing = await getAgent(agentId);
    if (!existing) {
      return errorJson('Agent not found.', 404);
    }

    await deleteAgent(agentId);

    return json({
      success: true,
      agent_id: agentId,
    });
  } catch (error) {
    return errorJson(error.message || 'Unable to delete agent.');
  }
}

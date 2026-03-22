import { createAgent, errorJson, json, readJsonBody } from '../../../kv.js';

export async function onRequestPost(context) {
  try {
    const body = await readJsonBody(context.request);
    const { agent, apiKey } = await createAgent(body);

    return json({
      success: true,
      agent_id: agent.agent_id,
      api_key: apiKey,
    });
  } catch (error) {
    return errorJson(error.message || 'Unable to register agent.');
  }
}

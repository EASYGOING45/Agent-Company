import { errorJson, json, listAgents } from '../../../kv.js';

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const roomId = url.searchParams.get('room_id') || '';
    const payload = await listAgents(roomId);
    return json(payload);
  } catch (error) {
    return errorJson(error.message || 'Unable to list agents.', 500);
  }
}

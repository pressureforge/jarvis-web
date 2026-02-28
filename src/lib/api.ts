import { OntologyData, ChatMessage } from '../types';

const API_BASE = 'https://api.jarvis-tool.xyz';

export async function getOntology(): Promise<OntologyData> {
  const res = await fetch(`${API_BASE}/ontology`);
  if (!res.ok) throw new Error('Failed to fetch ontology');
  return res.json();
}

export async function getMessages(): Promise<{ messages: ChatMessage[]; serverTime: number }> {
  const res = await fetch(`${API_BASE}/messages`);
  if (!res.ok) throw new Error('Failed to fetch messages');
  return res.json();
}

export async function sendMessage(message: string): Promise<void> {
  const res = await fetch(`${API_BASE}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sender: 'guest', message }),
  });
  if (!res.ok) throw new Error('Failed to send message');
}

export async function pollResponses(lastTimestamp: number): Promise<{ messages: ChatMessage[]; serverTime: number }> {
  const res = await fetch(`${API_BASE}/messages/poll?last=${lastTimestamp}`);
  if (!res.ok) throw new Error('Failed to poll responses');
  return res.json();
}

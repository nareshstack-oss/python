import { sessions, users } from '../data/store.js';

export function createSession(userId) {
  const token = `token-${userId}-${Date.now()}`;
  sessions.set(token, userId);
  return token;
}

export function getUserByToken(token) {
  const userId = sessions.get(token);
  return users.find((user) => user.id === userId) || null;
}

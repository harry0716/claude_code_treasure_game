// localStorage backend — used when VITE_GH_PAGES=true (GitHub Pages deployment)

interface User {
  username: string;
  password: string;
}

export interface LocalSession {
  id: number;
  username: string;
  started_at: string;
  ended_at: string | null;
  final_score: number | null;
  result: string | null;
  click_count: number;
}

const USERS_KEY = 'ghp_users';
const SESSIONS_KEY = 'ghp_sessions';
const NEXT_ID_KEY = 'ghp_next_id';

function getUsers(): User[] {
  return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
}

function getAllSessions(): LocalSession[] {
  return JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]');
}

function nextId(): number {
  const id = parseInt(localStorage.getItem(NEXT_ID_KEY) || '1');
  localStorage.setItem(NEXT_ID_KEY, String(id + 1));
  return id;
}

export function localRegister(username: string, password: string): { token: string; username: string } | { error: string } {
  if (username.length < 2) return { error: '帳號至少需要 2 個字元' };
  if (password.length < 4) return { error: '密碼至少需要 4 個字元' };
  const users = getUsers();
  if (users.find(u => u.username === username)) return { error: '帳號已存在' };
  users.push({ username, password });
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return { token: btoa(username + ':' + Date.now()), username };
}

export function localLogin(username: string, password: string): { token: string; username: string } | { error: string } {
  const users = getUsers();
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return { error: '帳號或密碼錯誤' };
  return { token: btoa(username + ':' + Date.now()), username };
}

export function localCreateSession(username: string): number {
  const sessions = getAllSessions();
  const id = nextId();
  sessions.push({
    id,
    username,
    started_at: new Date().toISOString(),
    ended_at: null,
    final_score: null,
    result: null,
    click_count: 0,
  });
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  return id;
}

export function localLogClick(sessionId: number): void {
  const sessions = getAllSessions();
  const s = sessions.find(s => s.id === sessionId);
  if (s) {
    s.click_count += 1;
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  }
}

export function localEndSession(sessionId: number, finalScore: number, result: string): void {
  const sessions = getAllSessions();
  const s = sessions.find(s => s.id === sessionId);
  if (s) {
    s.ended_at = new Date().toISOString();
    s.final_score = finalScore;
    s.result = result;
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  }
}

export function localGetHistory(username: string): LocalSession[] {
  return getAllSessions()
    .filter(s => s.username === username)
    .reverse()
    .slice(0, 20);
}

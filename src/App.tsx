import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from './components/ui/button';
import keyIcon from './assets/key.png';
import closedChest from './assets/treasure_closed.png';
import treasureChest from './assets/treasure_opened.png';
import skeletonChest from './assets/treasure_opened_skeleton.png';
import chestOpenSound from './audios/chest_open.mp3';
import evilLaughSound from './audios/chest_open_with_evil_laugh.mp3';
import {
  localRegister, localLogin, localCreateSession,
  localLogClick, localEndSession, localGetHistory,
} from './storage';

const IS_GH_PAGES = import.meta.env.VITE_GH_PAGES === 'true';

interface Box {
  id: number;
  isOpen: boolean;
  hasTreasure: boolean;
}

interface GameSession {
  id: number;
  started_at: string;
  ended_at: string | null;
  final_score: number | null;
  result: string | null;
  click_count: number;
}

type View = 'auth' | 'game' | 'history';
type AuthMode = 'login' | 'register';

export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [username, setUsername] = useState<string>(() => localStorage.getItem('username') || '');
  const [view, setView] = useState<View>(token ? 'game' : 'auth');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [boxes, setBoxes] = useState<Box[]>([]);
  const [score, setScore] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);

  const [history, setHistory] = useState<GameSession[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const apiHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  });

  const handleAuth = async () => {
    setAuthError('');
    setAuthLoading(true);
    try {
      if (IS_GH_PAGES) {
        const result = authMode === 'register'
          ? localRegister(authUsername, authPassword)
          : localLogin(authUsername, authPassword);
        if ('error' in result) { setAuthError(result.error); return; }
        localStorage.setItem('token', result.token);
        localStorage.setItem('username', result.username);
        setToken(result.token);
        setUsername(result.username);
        setView('game');
      } else {
        const res = await fetch(`/api/auth/${authMode}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: authUsername, password: authPassword }),
        });
        const data = await res.json();
        if (!res.ok) { setAuthError(data.error || '操作失敗'); return; }
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        setToken(data.token);
        setUsername(data.username);
        setView('game');
      }
    } catch {
      setAuthError('無法連線到伺服器');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setToken(null);
    setUsername('');
    setView('auth');
    setAuthUsername('');
    setAuthPassword('');
  };

  const startNewSession = async () => {
    try {
      if (IS_GH_PAGES) {
        const id = localCreateSession(username);
        setSessionId(id);
        return id;
      }
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: apiHeaders(),
      });
      const data = await res.json();
      setSessionId(data.sessionId);
      return data.sessionId as number;
    } catch {
      return null;
    }
  };

  const initializeGame = async () => {
    const newSessionId = await startNewSession();
    const treasureBoxIndex = Math.floor(Math.random() * 3);
    const newBoxes: Box[] = Array.from({ length: 3 }, (_, index) => ({
      id: index,
      isOpen: false,
      hasTreasure: index === treasureBoxIndex,
    }));
    setBoxes(newBoxes);
    setScore(0);
    setGameEnded(false);
    return newSessionId;
  };

  useEffect(() => {
    if (view === 'game' && token) {
      initializeGame();
    }
  }, [view]);

  const openBox = async (boxId: number) => {
    if (gameEnded) return;

    const box = boxes.find(b => b.id === boxId);
    if (!box || box.isOpen) return;

    new Audio(box.hasTreasure ? chestOpenSound : evilLaughSound).play();

    const scoreChange = box.hasTreasure ? 100 : -50;
    const newScore = score + scoreChange;

    setBoxes(prevBoxes => {
      const updatedBoxes = prevBoxes.map(b => {
        if (b.id === boxId && !b.isOpen) {
          return { ...b, isOpen: true };
        }
        return b;
      });

      const treasureFound = updatedBoxes.some(b => b.isOpen && b.hasTreasure);
      const allOpened = updatedBoxes.every(b => b.isOpen);
      if (treasureFound || allOpened) {
        setGameEnded(true);
      }

      return updatedBoxes;
    });

    setScore(newScore);

    if (sessionId) {
      if (IS_GH_PAGES) {
        localLogClick(sessionId);
      } else {
        fetch(`/api/games/${sessionId}/logs`, {
          method: 'POST',
          headers: apiHeaders(),
          body: JSON.stringify({
            boxId,
            hasTreasure: box.hasTreasure,
            scoreChange,
            scoreAfter: newScore,
          }),
        }).catch(() => {});
      }
    }
  };

  useEffect(() => {
    if (!gameEnded || !sessionId) return;
    const result = score > 0 ? 'win' : score < 0 ? 'lose' : 'tie';
    if (IS_GH_PAGES) {
      localEndSession(sessionId, score, result);
    } else {
      fetch(`/api/games/${sessionId}`, {
        method: 'PUT',
        headers: apiHeaders(),
        body: JSON.stringify({ finalScore: score, result }),
      }).catch(() => {});
    }
  }, [gameEnded]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      if (IS_GH_PAGES) {
        setHistory(localGetHistory(username));
      } else {
        const res = await fetch('/api/games', { headers: apiHeaders() });
        const data = await res.json();
        setHistory(data);
      }
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (view === 'history' && token) {
      loadHistory();
    }
  }, [view]);

  if (view === 'auth') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border-2 border-amber-300 p-8">
          <h1 className="text-3xl text-center mb-2 text-amber-900">🏴‍☠️ 寶藏獵人</h1>
          <p className="text-center text-amber-700 text-sm mb-6">
            {authMode === 'login' ? '登入帳號繼續冒險' : '建立帳號開始冒險'}
          </p>

          <div className="flex gap-2 mb-6">
            <button
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${authMode === 'login' ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-700'}`}
              onClick={() => { setAuthMode('login'); setAuthError(''); }}
            >
              登入
            </button>
            <button
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${authMode === 'register' ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-700'}`}
              onClick={() => { setAuthMode('register'); setAuthError(''); }}
            >
              註冊
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-amber-800 mb-1">帳號</label>
              <input
                type="text"
                value={authUsername}
                onChange={e => setAuthUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAuth()}
                className="w-full px-3 py-2 border-2 border-amber-300 rounded-lg focus:outline-none focus:border-amber-500 bg-white"
                placeholder="輸入帳號"
              />
            </div>
            <div>
              <label className="block text-sm text-amber-800 mb-1">密碼</label>
              <input
                type="password"
                value={authPassword}
                onChange={e => setAuthPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAuth()}
                className="w-full px-3 py-2 border-2 border-amber-300 rounded-lg focus:outline-none focus:border-amber-500 bg-white"
                placeholder="輸入密碼（至少 4 字元）"
              />
            </div>

            {authError && (
              <p className="text-red-600 text-sm text-center">{authError}</p>
            )}

            <Button
              onClick={handleAuth}
              disabled={authLoading}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            >
              {authLoading ? '處理中...' : authMode === 'login' ? '登入' : '註冊'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'history') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 flex flex-col items-center p-8">
        <div className="w-full max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl text-amber-900">📋 遊戲歷史紀錄</h1>
            <div className="flex gap-2">
              <Button onClick={() => setView('game')} className="bg-amber-600 hover:bg-amber-700 text-white text-sm px-4">
                回到遊戲
              </Button>
              <Button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white text-sm px-4">
                登出
              </Button>
            </div>
          </div>

          <p className="text-amber-700 mb-4">玩家：<span className="font-bold">{username}</span></p>

          {historyLoading ? (
            <p className="text-amber-700 text-center py-8">載入中...</p>
          ) : history.length === 0 ? (
            <p className="text-amber-700 text-center py-8">尚無遊戲紀錄</p>
          ) : (
            <div className="bg-white/80 rounded-xl border-2 border-amber-300 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-amber-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-amber-800">時間</th>
                    <th className="px-4 py-3 text-center text-amber-800">點擊次數</th>
                    <th className="px-4 py-3 text-center text-amber-800">最終分數</th>
                    <th className="px-4 py-3 text-center text-amber-800">結果</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((g, i) => (
                    <tr key={g.id} className={i % 2 === 0 ? 'bg-white' : 'bg-amber-50'}>
                      <td className="px-4 py-3 text-amber-900">
                        {new Date(g.started_at).toLocaleString('zh-TW')}
                      </td>
                      <td className="px-4 py-3 text-center text-amber-800">{g.click_count}</td>
                      <td className={`px-4 py-3 text-center font-bold ${
                        (g.final_score ?? 0) > 0 ? 'text-green-600' :
                        (g.final_score ?? 0) < 0 ? 'text-red-600' : 'text-amber-700'
                      }`}>
                        {g.final_score !== null ? `$${g.final_score}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {g.result === 'win' ? '🏆 贏了' :
                         g.result === 'lose' ? '💀 輸了' :
                         g.result === 'tie' ? '🤝 平手' : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 flex flex-col items-center justify-center p-8">
      <div className="w-full flex justify-between items-center mb-4 max-w-3xl">
        <span className="text-amber-800 text-sm">👤 {username}</span>
        <div className="flex gap-2">
          <Button onClick={() => setView('history')} className="bg-amber-200 hover:bg-amber-300 text-amber-900 text-sm px-4 py-2">
            歷史紀錄
          </Button>
          <Button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2">
            登出
          </Button>
        </div>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-4xl mb-4 text-amber-900">🏴‍☠️ Treasure Hunt Game 🏴‍☠️</h1>
        <p className="text-amber-800 mb-4">
          Click on the treasure chests to discover what's inside!
        </p>
        <p className="text-amber-700 text-sm">
          💰 Treasure: +$100 | 💀 Skeleton: -$50
        </p>
      </div>

      <div className="mb-8 flex items-center gap-4">
        <div className="text-2xl text-center p-4 bg-amber-200/80 backdrop-blur-sm rounded-lg shadow-lg border-2 border-amber-400">
          <span className="text-amber-900">Current Score: </span>
          <span className={`${score >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${score}
          </span>
        </div>
        <div className={`text-2xl font-bold ${score > 0 ? 'text-green-600' : score < 0 ? 'text-red-600' : 'text-amber-700'}`}>
          {score > 0 ? '贏了' : score < 0 ? '輸了' : '平手'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {boxes.map((box) => (
              <motion.div
                key={box.id}
                className="flex flex-col items-center"
                style={{ cursor: box.isOpen ? 'default' : `url(${keyIcon}) 16 16, pointer` }}
                whileHover={{ scale: box.isOpen ? 1 : 1.05 }}
                whileTap={{ scale: box.isOpen ? 1 : 0.95 }}
                onClick={() => openBox(box.id)}
              >
                <motion.div
                  initial={{ rotateY: 0 }}
                  animate={{
                    rotateY: box.isOpen ? 180 : 0,
                    scale: box.isOpen ? 1.1 : 1
                  }}
                  transition={{
                    duration: 0.6,
                    ease: "easeInOut"
                  }}
                  className="relative"
                >
                  <img
                    src={box.isOpen
                      ? (box.hasTreasure ? treasureChest : skeletonChest)
                      : closedChest
                    }
                    alt={box.isOpen
                      ? (box.hasTreasure ? "Treasure!" : "Skeleton!")
                      : "Treasure Chest"
                    }
                    className="w-48 h-48 object-contain drop-shadow-lg"
                  />

                  {box.isOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                      className="absolute -top-8 left-1/2 transform -translate-x-1/2"
                    >
                      {box.hasTreasure ? (
                        <div className="text-2xl animate-bounce">✨💰✨</div>
                      ) : (
                        <div className="text-2xl animate-pulse">💀👻💀</div>
                      )}
                    </motion.div>
                  )}
                </motion.div>

                <div className="mt-4 text-center">
                  {box.isOpen ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4, duration: 0.3 }}
                      className={`text-lg p-2 rounded-lg ${
                        box.hasTreasure
                          ? 'bg-green-100 text-green-800 border border-green-300'
                          : 'bg-red-100 text-red-800 border border-red-300'
                      }`}
                    >
                      {box.hasTreasure ? '+$100' : '-$50'}
                    </motion.div>
                  ) : (
                    <div className="text-amber-700 p-2">
                      Click to open!
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
      </div>

      {gameEnded && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="mb-4 p-6 bg-amber-200/80 backdrop-blur-sm rounded-xl shadow-lg border-2 border-amber-400">
                <h2 className="text-2xl mb-2 text-amber-900">Game Over!</h2>
                <p className="text-lg text-amber-800">
                  Final Score: <span className={`${score >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${score}
                  </span>
                </p>
                <p className="text-sm text-amber-600 mt-2">
                  {boxes.some(box => box.isOpen && box.hasTreasure)
                    ? 'Treasure found! Well done, treasure hunter! 🎉'
                    : 'No treasure found this time! Better luck next time! 💀'}
                </p>
              </div>

              <Button
                onClick={() => initializeGame()}
                className="text-lg px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white"
              >
                Play Again
              </Button>
            </motion.div>
          )}
    </div>
  );
}

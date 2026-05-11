import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const COLORS = ['#0052cc', '#0065ff', '#00875a', '#ff5630', '#ff7a00', '#6554c0', '#00b8d9'];

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [boards, setBoards] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', background: '#0052cc' });
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/boards').then((r) => setBoards(r.data)).catch(console.error);
  }, []);

  const createBoard = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    try {
      const { data } = await api.post('/boards', form);
      setBoards([data, ...boards]);
      setShowForm(false);
      setForm({ title: '', description: '', background: '#0052cc' });
    } catch (err) {
      setError(err.response?.data?.message || 'Error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-700 text-white px-6 py-3 flex items-center justify-between shadow">
        <span className="text-xl font-bold tracking-tight">Trello</span>
        <div className="flex items-center gap-3">
          <span className="text-sm">{user?.name}</span>
          <button onClick={() => navigate('/profile')} title="Xem hồ sơ"
            className="w-8 h-8 rounded-full bg-blue-400 hover:bg-blue-300 flex items-center justify-center text-sm font-bold transition">
            {user?.name?.[0]?.toUpperCase()}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Boards của bạn</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {boards.map((b) => (
            <div
              key={b.id}
              onClick={() => navigate(`/board/${b.id}`)}
              className="h-28 rounded-xl cursor-pointer hover:opacity-90 transition-opacity p-3 flex items-end shadow"
              style={{ background: b.background }}
            >
              <span className="text-white font-semibold text-sm leading-tight drop-shadow">{b.title}</span>
            </div>
          ))}
          <button
            onClick={() => setShowForm(true)}
            className="h-28 rounded-xl bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-500 text-sm font-medium transition"
          >
            + Tạo board mới
          </button>
        </div>
      </main>

      {/* Create board modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-800 mb-4">Tạo board mới</h3>
            <form onSubmit={createBoard} className="space-y-3">
              <input
                type="text"
                placeholder="Tên board *"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                autoFocus
              />
              <input
                type="text"
                placeholder="Mô tả (tùy chọn)"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <div>
                <p className="text-xs text-gray-500 mb-2">Màu nền</p>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm({ ...form, background: c })}
                      className="w-7 h-7 rounded-full border-2 transition"
                      style={{ background: c, borderColor: form.background === c ? '#1e40af' : 'transparent' }}
                    />
                  ))}
                </div>
              </div>
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button type="submit" className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition">
                  Tạo
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-200 transition">
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

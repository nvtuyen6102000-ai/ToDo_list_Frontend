import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: user?.name || '' });
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [tab, setTab] = useState('info');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const saveInfo = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setSaving(true);
    try {
      const { data } = await api.put('/auth/profile', { name: form.name });
      updateUser(data);
      setSuccess('Cập nhật thành công');
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi');
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (pwForm.new_password !== pwForm.confirm)
      return setError('Mật khẩu mới không khớp');
    if (pwForm.new_password.length < 6)
      return setError('Mật khẩu mới tối thiểu 6 ký tự');
    setSaving(true);
    try {
      await api.put('/auth/profile', {
        name: user.name,
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
      });
      setSuccess('Đổi mật khẩu thành công');
      setPwForm({ current_password: '', new_password: '', confirm: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi');
    } finally {
      setSaving(false);
    }
  };

  const initials = user?.name?.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-700 text-white px-6 py-3 flex items-center gap-4 shadow">
        <button onClick={() => navigate('/')} className="text-sm hover:underline opacity-80">
          ← Dashboard
        </button>
        <span className="text-lg font-bold">Hồ sơ cá nhân</span>
      </header>

      <main className="max-w-lg mx-auto px-4 py-10">
        {/* Avatar + basic info */}
        <div className="bg-white rounded-2xl shadow p-6 flex items-center gap-5 mb-6">
          <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-2xl font-bold text-white shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-xl font-semibold text-gray-800">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Tham gia {user?.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="flex border-b border-gray-100">
            {[['info', 'Thông tin'], ['password', 'Đổi mật khẩu']].map(([key, label]) => (
              <button
                key={key}
                onClick={() => { setTab(key); setError(''); setSuccess(''); }}
                className={`flex-1 py-3 text-sm font-medium transition ${
                  tab === key
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {success && <p className="text-green-600 text-sm mb-4 bg-green-50 rounded-lg px-3 py-2">{success}</p>}
            {error && <p className="text-red-500 text-sm mb-4 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

            {tab === 'info' && (
              <form onSubmit={saveInfo} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Họ tên</label>
                  <input
                    type="text"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full border border-gray-100 rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                    value={user?.email}
                    disabled
                  />
                  <p className="text-xs text-gray-400 mt-1">Email không thể thay đổi</p>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </form>
            )}

            {tab === 'password' && (
              <form onSubmit={savePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={pwForm.current_password}
                    onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Mật khẩu mới</label>
                  <input
                    type="password"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={pwForm.new_password}
                    onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={pwForm.confirm}
                    onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {saving ? 'Đang đổi...' : 'Đổi mật khẩu'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="w-full mt-4 text-sm text-red-500 hover:text-red-700 py-2 transition"
        >
          Đăng xuất
        </button>
      </main>
    </div>
  );
}

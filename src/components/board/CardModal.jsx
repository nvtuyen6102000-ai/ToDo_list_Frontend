import { useState } from 'react';
import api from '../../api/axios';

export default function CardModal({ card, boardMembers, onClose, onUpdated, onDeleted }) {
  const [form, setForm] = useState({
    title: card.title,
    description: card.description || '',
    deadline: card.deadline ? card.deadline.slice(0, 16) : '',
  });
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState(card.members || []);

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.put(`/lists/${card.list_id}/cards/${card.id}`, {
        title: form.title,
        description: form.description || null,
        deadline: form.deadline || null,
      });
      onUpdated({ ...data, members });
    } finally {
      setSaving(false);
    }
  };

  const toggleMember = async (member) => {
    const assigned = members.find((m) => m.id === member.id);
    if (assigned) {
      await api.delete(`/lists/${card.list_id}/cards/${card.id}/members/${member.id}`);
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
    } else {
      await api.post(`/lists/${card.list_id}/cards/${card.id}/members`, { user_id: member.id });
      setMembers((prev) => [...prev, member]);
    }
  };

  const deleteCard = async () => {
    if (!confirm('Xóa card này?')) return;
    await api.delete(`/lists/${card.list_id}/cards/${card.id}`);
    onDeleted(card.id, card.list_id);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 pt-16 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          {/* Title */}
          <input
            className="w-full text-lg font-semibold text-gray-800 border-0 border-b-2 border-gray-200 focus:border-blue-500 focus:outline-none pb-1 mb-4"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          {/* Description */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Mô tả</label>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              placeholder="Thêm mô tả..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {/* Deadline */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Deadline</label>
            <input
              type="datetime-local"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
            {form.deadline && (
              <button onClick={() => setForm({ ...form, deadline: '' })} className="ml-2 text-xs text-gray-400 hover:text-red-500">Xóa</button>
            )}
          </div>

          {/* Members */}
          {boardMembers.length > 0 && (
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Thành viên</label>
              <div className="flex flex-wrap gap-2">
                {boardMembers.map((m) => {
                  const assigned = members.find((am) => am.id === m.id);
                  return (
                    <button
                      key={m.id}
                      onClick={() => toggleMember(m)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition border ${
                        assigned
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${assigned ? 'bg-blue-500' : 'bg-gray-300'}`}>
                        {m.name?.[0]?.toUpperCase()}
                      </div>
                      {m.name}
                      {assigned && <span>✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-2">
            <button onClick={deleteCard} className="text-sm text-red-500 hover:text-red-700 transition">Xóa card</button>
            <div className="flex gap-2">
              <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Hủy</button>
              <button onClick={save} disabled={saving} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
                {saving ? 'Lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

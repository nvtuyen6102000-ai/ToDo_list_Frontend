import { useState } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import CardItem from './CardItem';

export default function BoardList({ list, cards, onAddCard, onDeleteList, onCardClick }) {
  const [addingCard, setAddingCard] = useState(false);
  const [cardTitle, setCardTitle] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  const { setNodeRef } = useDroppable({ id: list.id });

  const submitCard = async (e) => {
    e.preventDefault();
    if (!cardTitle.trim()) return;
    await onAddCard(list.id, cardTitle);
    setCardTitle('');
    setAddingCard(false);
  };

  return (
    <div className="shrink-0 w-64 bg-gray-100 rounded-xl flex flex-col max-h-full shadow">
      {/* List header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <span className="font-semibold text-sm text-gray-700">{list.title}</span>
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="text-gray-400 hover:text-gray-600 text-lg leading-none px-1">⋯</button>
          {showMenu && (
            <div className="absolute right-0 top-6 bg-white shadow-lg rounded-lg z-10 py-1 min-w-32">
              <button
                onClick={() => { onDeleteList(list.id); setShowMenu(false); }}
                className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition"
              >
                Xóa list
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cards */}
      <div ref={setNodeRef} className="flex-1 overflow-y-auto px-2 pb-2 space-y-2 scrollbar-hide min-h-[4px]">
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <CardItem key={card.id} card={card} onCardClick={onCardClick} />
          ))}
        </SortableContext>
      </div>

      {/* Add card */}
      <div className="px-2 pb-2">
        {addingCard ? (
          <form onSubmit={submitCard} className="bg-white rounded-lg p-2 shadow-sm">
            <textarea
              autoFocus
              className="w-full text-sm border border-gray-300 rounded px-2 py-1.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập tiêu đề card..."
              rows={2}
              value={cardTitle}
              onChange={(e) => setCardTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitCard(e); } }}
            />
            <div className="flex gap-2 mt-2">
              <button type="submit" className="bg-blue-600 text-white text-xs rounded-lg px-3 py-1.5 hover:bg-blue-700 transition">Thêm</button>
              <button type="button" onClick={() => setAddingCard(false)} className="text-gray-500 text-xs px-2 hover:text-gray-700 transition">Hủy</button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setAddingCard(true)}
            className="w-full text-left text-sm text-gray-500 hover:bg-gray-200 rounded-lg px-3 py-2 transition"
          >
            + Thêm card
          </button>
        )}
      </div>
    </div>
  );
}

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function CardItem({ card, onCardClick, isDragging }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  };

  const isOverdue = card.deadline && new Date(card.deadline) < new Date();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => !isDragging && onCardClick?.(card)}
      className="bg-white rounded-lg px-3 py-2.5 shadow-sm hover:shadow-md cursor-pointer transition-shadow select-none"
    >
      <p className="text-sm text-gray-800 font-medium leading-snug">{card.title}</p>
      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
        {card.deadline && (
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${isOverdue ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
            {new Date(card.deadline).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
          </span>
        )}
        {card.description && (
          <span className="text-xs text-gray-400">≡</span>
        )}
        {(card.members?.length > 0) && (
          <div className="flex -space-x-1 ml-auto">
            {card.members.slice(0, 3).map((m) => (
              <div key={m.id} title={m.name} className="w-5 h-5 rounded-full bg-blue-400 border border-white flex items-center justify-center text-[9px] font-bold text-white">
                {m.name?.[0]?.toUpperCase()}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

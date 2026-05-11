import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  closestCorners, defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import api from '../api/axios';
import { connectSocket, disconnectSocket } from '../socket/socket';
import BoardList from '../components/board/BoardList';
import CardModal from '../components/board/CardModal';
import CardItem from '../components/board/CardItem';

export default function BoardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [cards, setCards] = useState({});
  const [activeCard, setActiveCard] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [newListTitle, setNewListTitle] = useState('');
  const [addingList, setAddingList] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const loadBoard = useCallback(async () => {
    const [boardRes, listsRes] = await Promise.all([
      api.get(`/boards/${id}`),
      api.get(`/boards/${id}/lists`)
    ]);
    setBoard(boardRes.data);
    const sortedLists = listsRes.data.sort((a, b) => a.position - b.position);
    setLists(sortedLists);

    const cardMap = {};
    await Promise.all(
      sortedLists.map(async (list) => {
        const r = await api.get(`/lists/${list.id}/cards`);
        cardMap[list.id] = r.data.sort((a, b) => a.position - b.position);
      })
    );
    setCards(cardMap);
  }, [id]);

  useEffect(() => {
    loadBoard();
    const socket = connectSocket();
    socket.emit('join_board', id);

    socket.on('list_created', (list) => {
      setLists((prev) => [...prev, list].sort((a, b) => a.position - b.position));
      setCards((prev) => ({ ...prev, [list.id]: [] }));
    });
    socket.on('list_updated', (list) => {
      setLists((prev) => prev.map((l) => l.id === list.id ? list : l));
    });
    socket.on('list_deleted', (listId) => {
      setLists((prev) => prev.filter((l) => l.id !== listId));
      setCards((prev) => { const n = { ...prev }; delete n[listId]; return n; });
    });
    socket.on('card_created', (card) => {
      setCards((prev) => ({
        ...prev,
        [card.list_id]: [...(prev[card.list_id] || []), card]
      }));
    });
    socket.on('card_updated', (card) => {
      setCards((prev) => ({
        ...prev,
        [card.list_id]: (prev[card.list_id] || []).map((c) => c.id === card.id ? card : c)
      }));
    });
    socket.on('card_deleted', ({ cardId, listId }) => {
      setCards((prev) => ({
        ...prev,
        [listId]: (prev[listId] || []).filter((c) => c.id !== cardId)
      }));
    });
    socket.on('card_moved', ({ cardId, fromListId, toListId, position }) => {
      setCards((prev) => {
        const from = (prev[fromListId] || []).filter((c) => c.id !== cardId);
        const card = (prev[fromListId] || []).find((c) => c.id === cardId);
        if (!card) return prev;
        const updatedCard = { ...card, list_id: toListId, position };
        const to = [...(prev[toListId] || []), updatedCard].sort((a, b) => a.position - b.position);
        return { ...prev, [fromListId]: from, [toListId]: to };
      });
    });

    return () => {
      socket.emit('leave_board', id);
      socket.off('list_created'); socket.off('list_updated'); socket.off('list_deleted');
      socket.off('card_created'); socket.off('card_updated'); socket.off('card_deleted'); socket.off('card_moved');
    };
  }, [id, loadBoard]);

  const addList = async (e) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    const { data } = await api.post(`/boards/${id}/lists`, { title: newListTitle });
    setLists((prev) => [...prev, data]);
    setCards((prev) => ({ ...prev, [data.id]: [] }));
    connectSocket().emit('list_created', { boardId: id, list: data });
    setNewListTitle('');
    setAddingList(false);
  };

  const addCard = async (listId, title) => {
    const { data } = await api.post(`/lists/${listId}/cards`, { title });
    setCards((prev) => ({ ...prev, [listId]: [...(prev[listId] || []), data] }));
    connectSocket().emit('card_created', { boardId: id, card: data });
  };

  const deleteList = async (listId) => {
    await api.delete(`/boards/${id}/lists/${listId}`);
    setLists((prev) => prev.filter((l) => l.id !== listId));
    setCards((prev) => { const n = { ...prev }; delete n[listId]; return n; });
    connectSocket().emit('list_deleted', { boardId: id, listId });
  };

  const handleDragStart = ({ active }) => {
    for (const listId of Object.keys(cards)) {
      const card = cards[listId].find((c) => c.id === active.id);
      if (card) { setActiveCard(card); break; }
    }
  };

  const handleDragEnd = async ({ active, over }) => {
    setActiveCard(null);
    if (!over || active.id === over.id) return;

    let fromListId = null;
    let toListId = null;

    for (const [listId, listCards] of Object.entries(cards)) {
      if (listCards.find((c) => c.id === active.id)) fromListId = listId;
      if (listCards.find((c) => c.id === over.id) || listId === over.id) toListId = listId;
    }

    if (!fromListId) return;
    if (!toListId) toListId = over.id;

    const fromCards = [...(cards[fromListId] || [])];
    const toCards = fromListId === toListId ? fromCards : [...(cards[toListId] || [])];

    const activeIdx = fromCards.findIndex((c) => c.id === active.id);
    const overIdx = toCards.findIndex((c) => c.id === over.id);

    let newCards;
    if (fromListId === toListId) {
      newCards = arrayMove(fromCards, activeIdx, overIdx);
      setCards((prev) => ({ ...prev, [fromListId]: newCards }));
    } else {
      const [moved] = fromCards.splice(activeIdx, 1);
      const insertIdx = overIdx >= 0 ? overIdx : toCards.length;
      toCards.splice(insertIdx, 0, { ...moved, list_id: toListId });
      setCards((prev) => ({ ...prev, [fromListId]: fromCards, [toListId]: toCards }));
      newCards = toCards;
    }

    const movedCard = newCards.find((c) => c.id === active.id);
    const idx = newCards.indexOf(movedCard);
    const prev = newCards[idx - 1]?.position || 0;
    const next = newCards[idx + 1]?.position || (prev + 2000);
    const newPosition = (prev + next) / 2;

    await api.put(`/lists/${toListId}/cards/${active.id}`, {
      list_id: toListId,
      position: newPosition
    });
    connectSocket().emit('card_moved', { boardId: id, cardId: active.id, fromListId, toListId, position: newPosition });
  };

  const openCard = (card) => setSelectedCard(card);

  const onCardUpdated = (updated) => {
    setCards((prev) => ({
      ...prev,
      [updated.list_id]: (prev[updated.list_id] || []).map((c) => c.id === updated.id ? updated : c)
    }));
    connectSocket().emit('card_updated', { boardId: id, card: updated });
    setSelectedCard(null);
  };

  const onCardDeleted = (cardId, listId) => {
    setCards((prev) => ({ ...prev, [listId]: (prev[listId] || []).filter((c) => c.id !== cardId) }));
    connectSocket().emit('card_deleted', { boardId: id, cardId, listId });
    setSelectedCard(null);
  };

  if (!board) return <div className="flex items-center justify-center h-screen text-gray-400">Đang tải...</div>;

  return (
    <div className="h-screen flex flex-col" style={{ background: board.background }}>
      {/* Board header */}
      <div className="flex items-center gap-4 px-4 py-3 bg-black/20 text-white">
        <button onClick={() => navigate('/')} className="text-sm hover:underline opacity-80">← Dashboard</button>
        <h1 className="font-bold text-lg">{board.title}</h1>
        <div className="ml-auto flex -space-x-2">
          {(board.members || []).slice(0, 5).map((m) => (
            <div key={m.id} title={m.name} className="w-7 h-7 rounded-full bg-blue-400 border-2 border-white flex items-center justify-center text-xs font-bold text-white">
              {m.name?.[0]?.toUpperCase()}
            </div>
          ))}
        </div>
      </div>

      {/* Lists area */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-3 p-4 h-full items-start">
            {lists.map((list) => (
              <BoardList
                key={list.id}
                list={list}
                cards={cards[list.id] || []}
                onAddCard={addCard}
                onDeleteList={deleteList}
                onCardClick={openCard}
              />
            ))}

            {/* Add list */}
            <div className="shrink-0 w-64">
              {addingList ? (
                <form onSubmit={addList} className="bg-white rounded-xl p-3 shadow">
                  <input
                    autoFocus
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                    placeholder="Tên list..."
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 bg-blue-600 text-white text-sm rounded-lg py-1.5 hover:bg-blue-700 transition">Thêm</button>
                    <button type="button" onClick={() => setAddingList(false)} className="flex-1 bg-gray-100 text-gray-600 text-sm rounded-lg py-1.5 hover:bg-gray-200 transition">Hủy</button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setAddingList(true)}
                  className="w-full text-white/90 hover:bg-white/20 rounded-xl px-4 py-3 text-sm font-medium text-left transition"
                >
                  + Thêm list
                </button>
              )}
            </div>
          </div>
          <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }) }}>
            {activeCard && <CardItem card={activeCard} isDragging />}
          </DragOverlay>
        </DndContext>
      </div>

      {selectedCard && (
        <CardModal
          card={selectedCard}
          boardMembers={board.members || []}
          onClose={() => setSelectedCard(null)}
          onUpdated={onCardUpdated}
          onDeleted={onCardDeleted}
        />
      )}
    </div>
  );
}

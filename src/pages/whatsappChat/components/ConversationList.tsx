

export function ConversationList({
  conversations,
  activeId,
  onSelect
}: {
  conversations: any[];
  activeId: number | null;
  onSelect: (id: number) => void;
}) {
  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-100 font-semibold text-gray-700 text-sm text-left">
        Conversaciones ({conversations.length})
      </div>
      <div className="flex-1">
        {conversations.map(c => {
          const isActive = activeId === c.id;
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`w-full text-left p-4 border-b border-gray-100 transition-colors flex flex-col gap-1 cursor-pointer ${isActive ? "bg-primary/5" : "hover:bg-gray-50"
                }`}
            >
              <div className="flex justify-between items-center w-full">
                <span className="font-medium text-gray-800 text-sm truncate pr-2">
                  {c.name || `+${c.phone}`}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
                    ${c.mode === 'AI'
                    ? "bg-primary/10 text-primary"
                    : "bg-gray-200 text-gray-600"
                  }`}>
                  {c.mode}
                </span>
              </div>
              <span className="text-xs text-gray-500 truncate w-full text-left">
                {c.last_message_preview || "Sin mensajes"}
              </span>
            </button>
          );
        })}
        {conversations.length === 0 && (
          <div className="p-4 text-sm text-gray-500 text-center mt-4">
            No hay conversaciones aún.
          </div>
        )}
      </div>
    </div>
  );
}

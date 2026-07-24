

export function ModeToggle({
  mode,
  onToggle
}: {
  mode: 'AI' | 'HUMAN';
  onToggle: (newMode: 'AI' | 'HUMAN') => void
}) {
  const isAI = mode === 'AI';

  return (
    <div className="flex items-center bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => onToggle('AI')}
        className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${isAI ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
      >
        IA AUTOMÁTICO
      </button>
      <button
        onClick={() => onToggle('HUMAN')}
        className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${!isAI ? "bg-white text-amber-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
      >
        MODO MANUAL
      </button>
    </div>
  );
}

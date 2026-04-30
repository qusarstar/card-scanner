import Link from 'next/link';

export default function CardItem({ card }) {
  const initials = (card.name || card.company || '?').slice(0, 1).toUpperCase();
  const score = card.ai_score;

  function scoreColor() {
    if (score == null) return 'text-gray-400';
    if (score >= 75) return 'text-green-600';
    if (score >= 50) return 'text-orange-500';
    return 'text-gray-400';
  }

  return (
    <Link
      href={`/card/${card.id}`}
      className="flex items-center bg-white rounded-2xl p-4 active:bg-gray-50 transition"
    >
      <div className="w-12 h-12 rounded-xl bg-brand text-white flex items-center justify-center text-lg font-semibold overflow-hidden flex-shrink-0">
        {card.image_url ? (
          <img src={card.image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          initials
        )}
      </div>

      <div className="ml-3 flex-1 min-w-0">
        <p className="font-semibold truncate">{card.name || '（未命名）'}</p>
        <p className="text-sm text-gray-500 truncate">
          {card.company || '無公司資訊'}
          {card.title && ` · ${card.title}`}
        </p>
      </div>

      {score != null && (
        <div className={`text-right ml-2 ${scoreColor()}`}>
          <p className="text-lg font-bold leading-none">{score}</p>
          <p className="text-[10px] text-gray-400">潛力</p>
        </div>
      )}
    </Link>
  );
}

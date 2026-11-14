import Link from 'next/link';
import ar from '@/lib/ar.json';
import Disclaimer from '@/components/Disclaimer';

export default function Home() {
  const cards = [
    {
      href: '/retake',
      emoji: '📊',
      title: ar.landing.retakeCard.title,
      description: ar.landing.retakeCard.description,
      active: true,
    },
    {
      href: '/guidance',
      emoji: '🧭',
      title: ar.landing.guidanceCard.title,
      description: ar.landing.guidanceCard.description,
      active: true,
    },
    {
      href: '/admission',
      emoji: '🎓',
      title: ar.landing.admissionCard.title,
      description: ar.landing.admissionCard.description,
      active: true,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-12 pt-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
          {ar.landing.hero}
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto">
          {ar.landing.subtitle}
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) =>
          card.active ? (
            <Link
              key={card.href}
              href={card.href}
              className="block bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-shadow border border-gray-100 group"
            >
              <div className="text-4xl mb-4">{card.emoji}</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                {card.title}
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                {card.description}
              </p>
            </Link>
          ) : (
            <div
              key={card.href}
              className="relative bg-white rounded-xl shadow-sm p-6 border border-gray-100 opacity-60 cursor-not-allowed"
            >
              <span className="absolute top-3 start-3 bg-gray-200 text-gray-500 text-xs px-2 py-1 rounded-full">
                {ar.comingSoon}
              </span>
              <div className="text-4xl mb-4">{card.emoji}</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                {card.title}
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                {card.description}
              </p>
            </div>
          ),
        )}
      </div>

      <Disclaimer />
    </div>
  );
}

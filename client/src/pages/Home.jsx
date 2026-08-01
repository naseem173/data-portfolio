import { Link } from 'react-router-dom'

const projects = [
  {
    to: '/projects/stocks',
    title: 'Indian Stock Market Analytics',
    description:
      '5 years of NSE daily OHLCV data across 12 large-caps, PostgreSQL window functions for returns/volatility/moving averages, live price quotes.',
    status: 'live',
    icon: '📈',
    accent: '#2a78d6',
    accentDark: '#3987e5',
  },
  {
    to: '/projects/cricket',
    title: 'Cricket Analytics',
    description:
      '295k+ ball-by-ball IPL deliveries, SQL aggregation-heavy player & team stats, interactive dashboard.',
    status: 'live',
    icon: '🏏',
    accent: '#1baf7a',
    accentDark: '#199e70',
  },
]

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100">
        Data Analyst{' '}
        <span
          className="bg-clip-text text-transparent"
          style={{ backgroundImage: 'linear-gradient(135deg, #2a78d6, #4a3aa7)' }}
        >
          Portfolio
        </span>
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-xl">
        Two end-to-end case studies showing SQL, Python, and full-stack (MERN) work: from raw
        data to a live interactive dashboard.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {projects.map((p) => (
          <Link
            key={p.to}
            to={p.to}
            className="block rounded-xl p-5 border-t-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:-translate-y-0.5 transition bg-white dark:bg-gray-800"
            style={{ borderTopColor: p.accent }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
                  style={{ backgroundColor: `${p.accent}1a` }}
                >
                  {p.icon}
                </span>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{p.title}</h2>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  p.status === 'live'
                    ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}
              >
                {p.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">{p.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

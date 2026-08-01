import { Link } from 'react-router-dom'

const projects = [
  {
    to: '/projects/stocks',
    title: 'Indian Stock Market Analytics',
    description:
      '5 years of NSE daily OHLCV data across 12 large-caps, PostgreSQL window functions for returns/volatility/moving averages, live price quotes.',
    status: 'live',
  },
  {
    to: '/projects/cricket',
    title: 'Cricket Analytics',
    description:
      '295k+ ball-by-ball IPL deliveries, SQL aggregation-heavy player & team stats, interactive dashboard.',
    status: 'live',
  },
]

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-semibold text-gray-900 dark:text-gray-100">Data Analyst Portfolio</h1>
      <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-xl">
        Two end-to-end case studies showing SQL, Python, and full-stack (MERN) work: from raw
        data to a live interactive dashboard.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {projects.map((p) => (
          <Link
            key={p.to}
            to={p.to}
            className="block border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-gray-400 dark:hover:border-gray-500 transition bg-white dark:bg-gray-800"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{p.title}</h2>
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
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{p.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

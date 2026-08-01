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
      'Match/innings/player data, SQL aggregation-heavy player & team stats, interactive dashboard.',
    status: 'coming soon',
  },
]

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-semibold text-gray-900">Data Analyst Portfolio</h1>
      <p className="text-gray-500 mt-2 max-w-xl">
        Two end-to-end case studies showing SQL, Python, and full-stack (MERN) work: from raw
        data to a live interactive dashboard.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {projects.map((p) => (
          <Link
            key={p.to}
            to={p.to}
            className="block border border-gray-200 rounded-xl p-5 hover:border-gray-400 transition bg-white"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{p.title}</h2>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  p.status === 'live' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {p.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-2">{p.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

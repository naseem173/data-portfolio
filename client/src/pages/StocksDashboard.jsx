import { useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { api } from '../api/client'

export default function StocksDashboard() {
  const [symbols, setSymbols] = useState([])
  const [rankings, setRankings] = useState([])
  const [selected, setSelected] = useState('AAPL')
  const [analysis, setAnalysis] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/stocks/symbols').then((res) => setSymbols(res.data))
    api.get('/api/stocks/rankings').then((res) => setRankings(res.data))
  }, [])

  useEffect(() => {
    setLoading(true)
    api.get(`/api/stocks/${selected}/analysis`).then((res) => {
      setAnalysis(res.data)
      setLoading(false)
    })
  }, [selected])

  const latest = analysis[analysis.length - 1]

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-semibold text-gray-900">Stock Market Analytics</h1>
      <p className="text-gray-500 mt-1">
        5 years of daily price data, PostgreSQL window-function analysis, live from Postgres → Express → React.
      </p>

      <div className="mt-6 flex gap-2 flex-wrap">
        {symbols.map((s) => (
          <button
            key={s.symbol}
            onClick={() => setSelected(s.symbol)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
              selected === s.symbol
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
            }`}
          >
            {s.symbol}
          </button>
        ))}
      </div>

      {latest && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat label="Latest close" value={`$${Number(latest.close).toFixed(2)}`} />
          <Stat
            label="Daily return"
            value={latest.daily_return_pct ? `${Number(latest.daily_return_pct).toFixed(2)}%` : '—'}
          />
          <Stat label="20-day MA" value={`$${Number(latest.ma_20).toFixed(2)}`} />
          <Stat
            label="30d volatility"
            value={latest.rolling_30d_volatility_pct ? `${Number(latest.rolling_30d_volatility_pct).toFixed(2)}%` : '—'}
          />
        </div>
      )}

      <div className="mt-8 bg-white border border-gray-200 rounded-xl p-4 h-96">
        {loading ? (
          <div className="h-full flex items-center justify-center text-gray-400">Loading…</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analysis}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="trade_date" tickFormatter={(d) => d.slice(0, 7)} minTickGap={40} />
              <YAxis domain={['auto', 'auto']} />
              <Tooltip labelFormatter={(d) => d.slice(0, 10)} />
              <Legend />
              <Line type="monotone" dataKey="close" stroke="#111827" dot={false} name="Close" />
              <Line type="monotone" dataKey="ma_20" stroke="#3b82f6" dot={false} name="MA 20" />
              <Line type="monotone" dataKey="ma_50" stroke="#f59e0b" dot={false} name="MA 50" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <h2 className="text-xl font-semibold text-gray-900 mt-10 mb-3">
        Total return ranking (full history loaded)
      </h2>
      <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
        <thead className="bg-gray-50 text-gray-500">
          <tr>
            <th className="text-left px-4 py-2">Rank</th>
            <th className="text-left px-4 py-2">Symbol</th>
            <th className="text-right px-4 py-2">First close</th>
            <th className="text-right px-4 py-2">Last close</th>
            <th className="text-right px-4 py-2">Total return</th>
          </tr>
        </thead>
        <tbody>
          {rankings.map((r) => (
            <tr key={r.symbol} className="border-t border-gray-100">
              <td className="px-4 py-2">{r.return_rank}</td>
              <td className="px-4 py-2 font-medium">{r.symbol}</td>
              <td className="px-4 py-2 text-right">${Number(r.first_close).toFixed(2)}</td>
              <td className="px-4 py-2 text-right">${Number(r.last_close).toFixed(2)}</td>
              <td
                className={`px-4 py-2 text-right font-medium ${
                  Number(r.total_return_pct) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {Number(r.total_return_pct).toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="text-xs uppercase tracking-wide text-gray-400">{label}</div>
      <div className="text-xl font-semibold text-gray-900 mt-1">{value}</div>
    </div>
  )
}

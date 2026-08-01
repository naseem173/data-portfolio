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

const LIVE_POLL_MS = 15_000

function currencySymbol(symbol) {
  return symbol.endsWith('.NS') ? '₹' : '$'
}

function fmtPrice(symbol, value) {
  return `${currencySymbol(symbol)}${Number(value).toFixed(2)}`
}

export default function StocksDashboard() {
  const [symbols, setSymbols] = useState([])
  const [rankings, setRankings] = useState([])
  const [selected, setSelected] = useState('RELIANCE.NS')
  const [analysis, setAnalysis] = useState([])
  const [loading, setLoading] = useState(true)
  const [live, setLive] = useState(null)

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

  useEffect(() => {
    let cancelled = false
    setLive(null)

    const fetchLive = () => {
      api
        .get(`/api/stocks/${selected}/live`)
        .then((res) => {
          if (!cancelled) setLive(res.data)
        })
        .catch(() => {
          if (!cancelled) setLive((prev) => prev ?? { error: true })
        })
    }

    fetchLive()
    const id = setInterval(fetchLive, LIVE_POLL_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [selected])

  const latest = analysis[analysis.length - 1]
  const usTickers = symbols.filter((s) => !s.symbol.endsWith('.NS'))
  const inTickers = symbols.filter((s) => s.symbol.endsWith('.NS'))

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-semibold text-gray-900">Indian Stock Market Analytics</h1>
      <p className="text-gray-500 mt-1">
        5 years of NSE daily price data, PostgreSQL window-function analysis, live quotes — Postgres → Express → React.
      </p>

      <TickerGroup label="India (NSE)" tickers={inTickers} selected={selected} onSelect={setSelected} />
      <TickerGroup label="US (for comparison)" tickers={usTickers} selected={selected} onSelect={setSelected} />

      <LivePriceCard symbol={selected} live={live} />

      {latest && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat label="Latest close" value={fmtPrice(selected, latest.close)} />
          <Stat
            label="Daily return"
            value={latest.daily_return_pct ? `${Number(latest.daily_return_pct).toFixed(2)}%` : '—'}
          />
          <Stat label="20-day MA" value={fmtPrice(selected, latest.ma_20)} />
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
              <td className="px-4 py-2 text-right">{fmtPrice(r.symbol, r.first_close)}</td>
              <td className="px-4 py-2 text-right">{fmtPrice(r.symbol, r.last_close)}</td>
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

function TickerGroup({ label, tickers, selected, onSelect }) {
  if (tickers.length === 0) return null
  return (
    <div className="mt-4 first:mt-6">
      <div className="text-xs uppercase tracking-wide text-gray-400 mb-1.5">{label}</div>
      <div className="flex gap-2 flex-wrap">
        {tickers.map((s) => (
          <button
            key={s.symbol}
            onClick={() => onSelect(s.symbol)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
              selected === s.symbol
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
            }`}
          >
            {s.symbol.replace('.NS', '')}
          </button>
        ))}
      </div>
    </div>
  )
}

function LivePriceCard({ symbol, live }) {
  const isUp = live && !live.error && live.change >= 0
  return (
    <div className="mt-6 bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
      <div>
        <div className="text-xs uppercase tracking-wide text-gray-400 flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Live price · {symbol}
        </div>
        {live && !live.error ? (
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-semibold text-gray-900">
              {currencySymbol(symbol)}
              {Number(live.price).toFixed(2)}
            </span>
            <span className={`text-sm font-medium ${isUp ? 'text-green-600' : 'text-red-600'}`}>
              {isUp ? '+' : ''}
              {Number(live.change).toFixed(2)} ({Number(live.changePercent).toFixed(2)}%)
            </span>
          </div>
        ) : (
          <div className="text-gray-400 mt-1">Fetching live quote…</div>
        )}
      </div>
      {live && !live.error && (
        <div className="text-right text-xs text-gray-400">
          <div>{live.marketState === 'REGULAR' ? 'Market open' : 'Market closed'}</div>
          <div>as of {new Date(live.asOf).toLocaleTimeString()}</div>
        </div>
      )}
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

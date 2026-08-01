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
import { useTheme } from '../theme/ThemeContext.jsx'

const LIVE_POLL_MS = 15_000

function currencySymbol(symbol) {
  return symbol.endsWith('.NS') ? '₹' : '$'
}

function fmtPrice(symbol, value) {
  return `${currencySymbol(symbol)}${Number(value).toFixed(2)}`
}

// Diverging scale: red (-1) -> neutral gray (0) -> blue (+1)
function corrColor(value, isDark) {
  const v = Math.max(-1, Math.min(1, value))
  const neutral = isDark ? [56, 56, 53] : [240, 239, 236]
  const pole = v >= 0 ? [37, 106, 191] : [227, 73, 72]
  const t = Math.abs(v)
  const rgb = neutral.map((n, i) => Math.round(n + (pole[i] - n) * t))
  return `rgb(${rgb.join(',')})`
}

function corrTextColor(value, isDark) {
  if (isDark) return '#f3f4f6'
  return Math.abs(value) > 0.55 ? '#ffffff' : '#0b0b0b'
}

export default function StocksDashboard() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [symbols, setSymbols] = useState([])
  const [rankings, setRankings] = useState([])
  const [selected, setSelected] = useState('RELIANCE.NS')
  const [analysis, setAnalysis] = useState([])
  const [loading, setLoading] = useState(true)
  const [live, setLive] = useState(null)
  const [correlations, setCorrelations] = useState([])

  useEffect(() => {
    api.get('/api/stocks/symbols').then((res) => setSymbols(res.data))
    api.get('/api/stocks/rankings').then((res) => setRankings(res.data))
    api.get('/api/stocks/correlations').then((res) => setCorrelations(res.data))
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
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">
        Indian Stock Market <span style={{ color: isDark ? '#3987e5' : '#2a78d6' }}>Analytics</span>
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mt-1">
        5 years of NSE daily price data, PostgreSQL window-function analysis, live quotes — Postgres → Express → React.
      </p>

      <TickerGroup label="India (NSE)" tickers={inTickers} selected={selected} onSelect={setSelected} />
      <TickerGroup label="US (for comparison)" tickers={usTickers} selected={selected} onSelect={setSelected} />

      <LivePriceCard symbol={selected} live={live} />

      {latest && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat label="Latest close" value={fmtPrice(selected, latest.close)} accent="#2a78d6" />
          <Stat
            label="Daily return"
            value={latest.daily_return_pct ? `${Number(latest.daily_return_pct).toFixed(2)}%` : '—'}
            accent="#eb6834"
          />
          <Stat label="20-day MA" value={fmtPrice(selected, latest.ma_20)} accent="#1baf7a" />
          <Stat
            label="30d volatility"
            value={latest.rolling_30d_volatility_pct ? `${Number(latest.rolling_30d_volatility_pct).toFixed(2)}%` : '—'}
            accent="#4a3aa7"
          />
        </div>
      )}

      <SectionHeading color="#2a78d6">Price history &amp; moving averages</SectionHeading>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 h-96">
        {loading ? (
          <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500">Loading…</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analysis}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#eee'} />
              <XAxis
                dataKey="trade_date"
                tickFormatter={(d) => d.slice(0, 7)}
                minTickGap={40}
                tick={{ fill: isDark ? '#9ca3af' : '#6b7280' }}
                stroke={isDark ? '#4b5563' : '#d1d5db'}
              />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fill: isDark ? '#9ca3af' : '#6b7280' }}
                stroke={isDark ? '#4b5563' : '#d1d5db'}
              />
              <Tooltip
                labelFormatter={(d) => d.slice(0, 10)}
                contentStyle={
                  isDark
                    ? { backgroundColor: '#1f2937', border: '1px solid #374151', color: '#f3f4f6' }
                    : undefined
                }
              />
              <Legend wrapperStyle={{ color: isDark ? '#d1d5db' : undefined }} />
              <Line type="monotone" dataKey="close" stroke={isDark ? '#e5e7eb' : '#111827'} dot={false} name="Close" />
              <Line type="monotone" dataKey="ma_20" stroke="#3b82f6" dot={false} name="MA 20" />
              <Line type="monotone" dataKey="ma_50" stroke="#f59e0b" dot={false} name="MA 50" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <SectionHeading color="#eb6834">Total return ranking (full history loaded)</SectionHeading>
      <table className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
          <tr>
            <th className="text-left px-4 py-2">Rank</th>
            <th className="text-left px-4 py-2">Symbol</th>
            <th className="text-right px-4 py-2">First close</th>
            <th className="text-right px-4 py-2">Last close</th>
            <th className="text-right px-4 py-2">Total return</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900">
          {rankings.map((r) => (
            <tr key={r.symbol} className="border-t border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300">
              <td className="px-4 py-2">{r.return_rank}</td>
              <td className="px-4 py-2 font-medium text-gray-900 dark:text-gray-100">{r.symbol}</td>
              <td className="px-4 py-2 text-right">{fmtPrice(r.symbol, r.first_close)}</td>
              <td className="px-4 py-2 text-right">{fmtPrice(r.symbol, r.last_close)}</td>
              <td
                className={`px-4 py-2 text-right font-medium ${
                  Number(r.total_return_pct) >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {Number(r.total_return_pct).toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <SectionHeading color="#4a3aa7">Return correlation across stocks</SectionHeading>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 -mt-2">
        Computed in Python (pandas{' '}
        <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">.corr()</code> over daily
        returns) — genuinely simpler than SQL for a full pairwise matrix, then written back to
        Postgres for the API to serve.
      </p>
      <CorrelationHeatmap data={correlations} symbols={symbols.map((s) => s.symbol)} isDark={isDark} />

      <HowItsBuilt />
    </div>
  )
}

function SectionHeading({ color, children }) {
  return (
    <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-gray-100 mt-10 mb-3">
      <span className="w-1.5 h-5 rounded-full" style={{ backgroundColor: color }} />
      {children}
    </h2>
  )
}

function CorrelationHeatmap({ data, symbols, isDark }) {
  if (symbols.length === 0) return null
  const lookup = new Map(data.map((d) => [`${d.symbol_a}|${d.symbol_b}`, Number(d.correlation)]))
  const short = (s) => s.replace('.NS', '')

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 overflow-x-auto">
      <table className="text-xs border-collapse">
        <thead>
          <tr>
            <th className="w-20" />
            {symbols.map((s) => (
              <th key={s} className="px-1 py-1 font-medium text-gray-500 dark:text-gray-400 text-center">
                {short(s)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {symbols.map((rowSym) => (
            <tr key={rowSym}>
              <th className="pr-2 py-1 font-medium text-gray-500 dark:text-gray-400 text-right whitespace-nowrap">
                {short(rowSym)}
              </th>
              {symbols.map((colSym) => {
                const v = lookup.get(`${rowSym}|${colSym}`)
                if (v === undefined) return <td key={colSym} className="w-9 h-9" />
                return (
                  <td
                    key={colSym}
                    title={`${short(rowSym)} vs ${short(colSym)}: ${v.toFixed(2)}`}
                    className="w-9 h-9 text-center align-middle"
                    style={{ backgroundColor: corrColor(v, isDark), color: corrTextColor(v, isDark) }}
                  >
                    {v.toFixed(1)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center gap-2 mt-4 text-xs text-gray-500 dark:text-gray-400">
        <span>-1</span>
        <div
          className="h-2 w-40 rounded-full"
          style={{
            background: `linear-gradient(to right, rgb(227,73,72), ${
              isDark ? 'rgb(56,56,53)' : 'rgb(240,239,236)'
            }, rgb(37,106,191))`,
          }}
        />
        <span>+1</span>
        <span className="ml-2">correlation of daily returns</span>
      </div>
    </div>
  )
}

function HowItsBuilt() {
  const codeClass = 'bg-white dark:bg-gray-900 px-1 rounded border border-gray-200 dark:border-gray-700'
  return (
    <div className="mt-10 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">How this was built</h2>
      <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
        <div>
          <Label color="#2a78d6">Problem</Label>
          <p className="mt-1">
            Track and compare Indian large-cap stocks across sectors — historical performance,
            risk, and what's happening right now — in one place.
          </p>
        </div>
        <div>
          <Label color="#eb6834">Data</Label>
          <p className="mt-1">
            5 years of daily OHLCV for 12 NSE stocks (plus 5 US stocks for comparison) via{' '}
            <code className={codeClass}>yfinance</code>, and live quotes via a Yahoo Finance quote
            endpoint.
          </p>
        </div>
        <div>
          <Label color="#4a3aa7">SQL</Label>
          <p className="mt-1">
            Window functions do the heavy lifting: <code className={codeClass}>LAG()</code> for
            daily returns, moving <code className={codeClass}>AVG() OVER (ROWS BETWEEN…)</code>,{' '}
            <code className={codeClass}>STDDEV() OVER</code> for rolling volatility, and{' '}
            <code className={codeClass}>RANK()</code> for cross-symbol return ranking.
          </p>
        </div>
        <div>
          <Label color="#1baf7a">Python</Label>
          <p className="mt-1">
            pandas pivots the price history into a date × symbol matrix and computes the full
            correlation matrix in one <code className={codeClass}>.corr()</code> call — the kind
            of matrix operation that's awkward in SQL but trivial in pandas.
          </p>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Label color="#e87ba4">Key insight</Label>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          The two IT-services stocks (Infosys, TCS) move together far more than either does with
          banking or energy names — a reminder that "diversified" only holds if the picks are
          actually uncorrelated, not just different tickers.
        </p>
      </div>
    </div>
  )
}

function Label({ color, children }) {
  return (
    <div className="flex items-center gap-1.5 font-semibold text-gray-900 dark:text-gray-100">
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      {children}
    </div>
  )
}

function TickerGroup({ label, tickers, selected, onSelect }) {
  if (tickers.length === 0) return null
  return (
    <div className="mt-4 first:mt-6">
      <div className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1.5">{label}</div>
      <div className="flex gap-2 flex-wrap">
        {tickers.map((s) => (
          <button
            key={s.symbol}
            onClick={() => onSelect(s.symbol)}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition ${
              selected === s.symbol
                ? 'text-white border-transparent shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
            style={
              selected === s.symbol
                ? { background: 'linear-gradient(135deg, #2a78d6, #4a3aa7)' }
                : undefined
            }
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
  const accent = live && !live.error ? (isUp ? '#1baf7a' : '#e34948') : '#9ca3af'
  return (
    <div
      className="mt-6 bg-white dark:bg-gray-800 border-l-4 border-y border-r border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-center justify-between"
      style={{ borderLeftColor: accent }}
    >
      <div>
        <div className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Live price · {symbol}
        </div>
        {live && !live.error ? (
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {currencySymbol(symbol)}
              {Number(live.price).toFixed(2)}
            </span>
            <span
              className={`text-sm font-medium ${
                isUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}
            >
              {isUp ? '+' : ''}
              {Number(live.change).toFixed(2)} ({Number(live.changePercent).toFixed(2)}%)
            </span>
          </div>
        ) : (
          <div className="text-gray-400 dark:text-gray-500 mt-1">Fetching live quote…</div>
        )}
      </div>
      {live && !live.error && (
        <div className="text-right text-xs text-gray-400 dark:text-gray-500">
          <div>{live.marketState === 'REGULAR' ? 'Market open' : 'Market closed'}</div>
          <div>as of {new Date(live.asOf).toLocaleTimeString()}</div>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, accent }) {
  return (
    <div
      className="bg-white dark:bg-gray-800 border-t-4 border-x border-b border-gray-200 dark:border-gray-700 rounded-xl p-4"
      style={{ borderTopColor: accent }}
    >
      <div className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</div>
      <div className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</div>
    </div>
  )
}

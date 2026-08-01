import { Router } from 'express'
import YahooFinance from 'yahoo-finance2'
import { pool } from '../db.js'

const router = Router()
const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] })

// Simple in-memory cache so rapid polling doesn't hammer Yahoo Finance
const liveCache = new Map()
const LIVE_TTL_MS = 15_000

// GET /api/stocks/symbols
router.get('/symbols', async (req, res) => {
  const { rows } = await pool.query('SELECT symbol, name FROM symbols ORDER BY symbol')
  res.json(rows)
})

// GET /api/stocks/:symbol/prices
router.get('/:symbol/prices', async (req, res) => {
  const { symbol } = req.params
  const { rows } = await pool.query(
    'SELECT trade_date, open, high, low, close, volume FROM daily_prices WHERE symbol = $1 ORDER BY trade_date',
    [symbol.toUpperCase()]
  )
  res.json(rows)
})

// GET /api/stocks/:symbol/analysis - daily return, 20/50-day moving averages, 30-day volatility
router.get('/:symbol/analysis', async (req, res) => {
  const { symbol } = req.params
  const { rows } = await pool.query(
    `
    WITH returns AS (
      SELECT
        trade_date,
        close,
        (close - LAG(close) OVER (ORDER BY trade_date))
          / LAG(close) OVER (ORDER BY trade_date) AS daily_return
      FROM daily_prices
      WHERE symbol = $1
    )
    SELECT
      trade_date,
      close,
      ROUND(daily_return * 100, 4) AS daily_return_pct,
      ROUND(AVG(close) OVER (ORDER BY trade_date ROWS BETWEEN 19 PRECEDING AND CURRENT ROW), 4) AS ma_20,
      ROUND(AVG(close) OVER (ORDER BY trade_date ROWS BETWEEN 49 PRECEDING AND CURRENT ROW), 4) AS ma_50,
      ROUND(STDDEV(daily_return) OVER (ORDER BY trade_date ROWS BETWEEN 29 PRECEDING AND CURRENT ROW) * 100, 4) AS rolling_30d_volatility_pct
    FROM returns
    ORDER BY trade_date
    `,
    [symbol.toUpperCase()]
  )
  res.json(rows)
})

// GET /api/stocks/rankings - total return over the loaded history, ranked across symbols
router.get('/rankings', async (req, res) => {
  const { rows } = await pool.query(`
    WITH bounds AS (
      SELECT symbol, MIN(trade_date) AS start_date, MAX(trade_date) AS end_date
      FROM daily_prices
      GROUP BY symbol
    ),
    endpoints AS (
      SELECT
        b.symbol,
        (SELECT close FROM daily_prices p WHERE p.symbol = b.symbol AND p.trade_date = b.start_date) AS first_close,
        (SELECT close FROM daily_prices p WHERE p.symbol = b.symbol AND p.trade_date = b.end_date) AS last_close
      FROM bounds b
    )
    SELECT
      symbol,
      first_close,
      last_close,
      ROUND((last_close - first_close) / first_close * 100, 2) AS total_return_pct,
      RANK() OVER (ORDER BY (last_close - first_close) / first_close DESC) AS return_rank
    FROM endpoints
    ORDER BY return_rank
  `)
  res.json(rows)
})

// GET /api/stocks/:symbol/live - current quote (cached briefly to avoid rate limits)
router.get('/:symbol/live', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase()
  const cached = liveCache.get(symbol)
  if (cached && Date.now() - cached.fetchedAt < LIVE_TTL_MS) {
    return res.json(cached.data)
  }

  try {
    const q = await yf.quote(symbol)
    const data = {
      symbol,
      price: q.regularMarketPrice,
      change: q.regularMarketChange,
      changePercent: q.regularMarketChangePercent,
      currency: q.currency,
      marketState: q.marketState,
      asOf: q.regularMarketTime,
    }
    liveCache.set(symbol, { data, fetchedAt: Date.now() })
    res.json(data)
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch live quote', detail: err.message })
  }
})

// GET /api/stocks/correlations - pairwise return correlations (computed in Python)
router.get('/correlations', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT symbol_a, symbol_b, correlation FROM stock_correlations ORDER BY symbol_a, symbol_b'
  )
  res.json(rows)
})

export default router

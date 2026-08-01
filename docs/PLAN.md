# Project Plan

## Goal

A portfolio site that proves data-analyst chops (SQL + Python) *and* full-stack ability (MERN),
via two deep case studies rather than many shallow demos.

## Tech stack

- **Frontend**: React (Vite), Tailwind CSS, a charting library (Recharts or Nivo)
- **Backend**: Node.js + Express, REST API
- **Databases**:
  - PostgreSQL — the analytical database for both case studies (relational cricket data,
    time-series stock data). This is where the "heavy SQL" lives: CTEs, window functions,
    indexing, query optimization.
  - MongoDB — lightweight store for portfolio content itself (project metadata, blog-style
    write-ups) if needed; optional, can start Postgres-only.
- **Python**: pandas/numpy for cleaning and analysis, Jupyter notebooks for exploration,
  a small FastAPI service only if we need to serve ML predictions live (e.g. win probability,
  return forecasts) — otherwise Python runs offline and writes results into Postgres.

## Case study 1: Cricket Analytics

- **Data**: ball-by-ball or match-level data (e.g. Cricsheet YAML/CSV exports, or a Kaggle IPL dataset)
- **SQL**: schema for matches/innings/deliveries/players; queries for batting average, strike
  rate, economy, partnership analysis, head-to-head records, powerplay/death-overs breakdowns
- **Python**: data cleaning/loading pipeline, exploratory notebook, maybe a simple win-probability
  model based on match state
- **Dashboard**: player/team search, performance trends over time, match comparisons

## Case study 2: Stock Market Analytics

- **Data**: historical daily OHLCV data (via a free API like Alpha Vantage/Yahoo Finance dump, or CSV)
- **SQL**: window functions for moving averages, daily/period returns, volatility, ranking
  top movers
- **Python**: technical indicators (RSI, MACD, Bollinger Bands), simple backtest of a
  strategy, results written back to Postgres
- **Dashboard**: candlestick/line charts, indicator overlays, watchlist, simple portfolio
  simulator

## Site structure

- Homepage: intro + the two flagship project cards
- `/projects/cricket` — case study write-up + embedded live dashboard
- `/projects/stocks` — case study write-up + embedded live dashboard
- Each case study page tells the story: problem → data → SQL → Python → dashboard → insight

## Roadmap (suggested order)

1. Portfolio shell (homepage, nav, project pages, deployed early so it's never "not live")
2. Stock case study (cleaner public data/APIs, faster to get an MVP dashboard working)
3. Cricket case study
4. Polish: write-ups, deploy (Vercel/Render/Railway), custom domain if desired

## Open questions to revisit together

- Which stock data source: free API (rate-limited) vs static historical CSV dataset?
- Which cricket dataset: Cricsheet (very detailed, more cleaning work) vs a pre-cleaned
  Kaggle IPL dataset (faster to start)?
- Deployment target for Postgres in production (Railway/Supabase/Neon all have free tiers)

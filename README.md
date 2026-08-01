# Data Portfolio — Cricket & Stocks Analytics

A full-stack data analyst portfolio built on the MERN stack, showcasing heavy SQL and Python
analysis work through two flagship, end-to-end case studies:

1. **Indian Stock Market Analytics** — 5 years of NSE daily price data (plus a few US stocks for
   comparison), SQL window-function analysis (returns, moving averages, volatility, rankings),
   live price quotes, interactive React dashboard.
2. **Cricket Analytics** — ~296k ball-by-ball IPL deliveries across 1,243 matches, SQL
   aggregation-heavy batting/bowling leaderboards, partnership and phase (powerplay/death-overs)
   breakdowns, team head-to-head records, interactive React dashboard.

See [docs/PLAN.md](docs/PLAN.md) for the full architecture, tech stack, and roadmap.

## Monorepo layout

```
client/             React (Vite) frontend — portfolio shell + dashboards
server/             Node/Express API — serves processed data to the client
sql/
  cricket/          SQL schema + analysis queries for cricket dataset
  stocks/           SQL schema + analysis queries for stocks dataset
python-analysis/
  cricket/          Data cleaning, stats, notebooks for cricket case study
  stocks/           Data cleaning, indicators, backtests for stocks case study
docs/               Planning docs, architecture notes, write-ups
```

## Running locally

1. Postgres running with a `data_portfolio` database (`brew services start postgresql@16`)
2. `server/`: `npm install`, copy `.env.example` to `.env`, `npm run dev` (port 5050)
3. `client/`: `npm install`, `npm run dev` (port 5173)
4. Load data: in `python-analysis/stocks/` and `python-analysis/cricket/`, create a venv, install
   `requirements.txt`, then run each folder's `fetch_data.py` followed by its load script
   (`load_to_postgres.py` / `parse_and_load.py`)

## Status

✅ Both flagship case studies (stocks, cricket) are live end-to-end.

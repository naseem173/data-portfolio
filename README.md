# Data Portfolio — Cricket & Stocks Analytics

A full-stack data analyst portfolio built on the MERN stack, showcasing heavy SQL and Python
analysis work through two flagship, end-to-end case studies:

1. **Cricket Analytics** — relational match/player/innings data, SQL aggregation-heavy queries,
   Python-based stats modeling, interactive React dashboard.
2. **Stock Market Analytics** — time-series price data, SQL window-function analysis,
   Python technical indicators & backtesting, interactive React dashboard with charts.

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

## Status

🚧 Early scaffold — architecture in place, dashboards not yet built.

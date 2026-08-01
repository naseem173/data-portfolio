"""Pairwise correlation of daily returns across all loaded stocks (pandas/numpy).

This is genuinely easier in Python than SQL: pull the whole price history into
a DataFrame, pivot to a date x symbol matrix, compute % change, then a single
.corr() call gives the full correlation matrix. Results are written back to
Postgres so the dashboard can serve them like any other query.
"""
import pandas as pd
import psycopg2

DB_DSN = "dbname=data_portfolio"


def main():
    conn = psycopg2.connect(DB_DSN)

    prices = pd.read_sql(
        "SELECT symbol, trade_date, close FROM daily_prices ORDER BY trade_date", conn
    )
    wide = prices.pivot(index="trade_date", columns="symbol", values="close").astype(float)
    returns = wide.pct_change(fill_method=None).dropna(how="all")

    corr = returns.corr()

    rows = []
    for symbol_a in corr.columns:
        for symbol_b in corr.columns:
            rows.append((symbol_a, symbol_b, round(float(corr.loc[symbol_a, symbol_b]), 4)))

    cur = conn.cursor()
    cur.execute("TRUNCATE stock_correlations")
    cur.executemany(
        "INSERT INTO stock_correlations (symbol_a, symbol_b, correlation) VALUES (%s, %s, %s)",
        rows,
    )
    conn.commit()
    print(f"Wrote {len(rows)} correlation pairs across {len(corr.columns)} symbols")
    cur.close()
    conn.close()


if __name__ == "__main__":
    main()

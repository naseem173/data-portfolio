"""Load the fetched CSVs into the daily_prices table in Postgres."""
import pathlib
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values

from fetch_data import TICKERS

RAW_DIR = pathlib.Path(__file__).parent / "data" / "raw"
DB_DSN = "dbname=data_portfolio"


def main():
    conn = psycopg2.connect(DB_DSN)
    cur = conn.cursor()

    symbol_rows = list(TICKERS.items())
    execute_values(
        cur,
        "INSERT INTO symbols (symbol, name) VALUES %s ON CONFLICT (symbol) DO NOTHING",
        symbol_rows,
    )

    for symbol in TICKERS:
        df = pd.read_csv(RAW_DIR / f"{symbol}.csv")
        rows = [
            (symbol, row.Date, row.Open, row.High, row.Low, row.Close, int(row.Volume))
            for row in df.itertuples(index=False)
        ]
        execute_values(
            cur,
            """
            INSERT INTO daily_prices (symbol, trade_date, open, high, low, close, volume)
            VALUES %s
            ON CONFLICT (symbol, trade_date) DO UPDATE SET
                open = EXCLUDED.open,
                high = EXCLUDED.high,
                low = EXCLUDED.low,
                close = EXCLUDED.close,
                volume = EXCLUDED.volume
            """,
            rows,
        )
        print(f"{symbol}: loaded {len(rows)} rows")

    conn.commit()
    cur.close()
    conn.close()


if __name__ == "__main__":
    main()

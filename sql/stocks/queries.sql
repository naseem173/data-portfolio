-- Stock analytics queries: window functions over daily_prices

-- 1. Daily return (%) per symbol
SELECT
    symbol,
    trade_date,
    close,
    ROUND(
        (close - LAG(close) OVER (PARTITION BY symbol ORDER BY trade_date))
        / LAG(close) OVER (PARTITION BY symbol ORDER BY trade_date) * 100,
        4
    ) AS daily_return_pct
FROM daily_prices
ORDER BY symbol, trade_date;

-- 2. Moving averages (20-day and 50-day) per symbol
SELECT
    symbol,
    trade_date,
    close,
    ROUND(AVG(close) OVER (
        PARTITION BY symbol ORDER BY trade_date
        ROWS BETWEEN 19 PRECEDING AND CURRENT ROW
    ), 4) AS ma_20,
    ROUND(AVG(close) OVER (
        PARTITION BY symbol ORDER BY trade_date
        ROWS BETWEEN 49 PRECEDING AND CURRENT ROW
    ), 4) AS ma_50
FROM daily_prices
ORDER BY symbol, trade_date;

-- 3. Rolling 30-day volatility (stddev of daily returns) per symbol
WITH returns AS (
    SELECT
        symbol,
        trade_date,
        (close - LAG(close) OVER (PARTITION BY symbol ORDER BY trade_date))
            / LAG(close) OVER (PARTITION BY symbol ORDER BY trade_date) AS daily_return
    FROM daily_prices
)
SELECT
    symbol,
    trade_date,
    ROUND(
        STDDEV(daily_return) OVER (
            PARTITION BY symbol ORDER BY trade_date
            ROWS BETWEEN 29 PRECEDING AND CURRENT ROW
        ) * 100,
        4
    ) AS rolling_30d_volatility_pct
FROM returns
ORDER BY symbol, trade_date;

-- 4. Top movers: best single-day gain per symbol (ranked)
WITH returns AS (
    SELECT
        symbol,
        trade_date,
        close,
        (close - LAG(close) OVER (PARTITION BY symbol ORDER BY trade_date))
            / LAG(close) OVER (PARTITION BY symbol ORDER BY trade_date) * 100 AS daily_return_pct
    FROM daily_prices
)
SELECT symbol, trade_date, close, ROUND(daily_return_pct, 4) AS daily_return_pct
FROM (
    SELECT *, RANK() OVER (PARTITION BY symbol ORDER BY daily_return_pct DESC) AS rnk
    FROM returns
    WHERE daily_return_pct IS NOT NULL
) ranked
WHERE rnk = 1
ORDER BY daily_return_pct DESC;

-- 5. Period return over the full loaded history, ranked across symbols
WITH bounds AS (
    SELECT
        symbol,
        MIN(trade_date) AS start_date,
        MAX(trade_date) AS end_date
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
ORDER BY return_rank;

-- Stock market analytics schema

CREATE TABLE IF NOT EXISTS symbols (
    symbol      TEXT PRIMARY KEY,
    name        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_prices (
    symbol      TEXT NOT NULL REFERENCES symbols(symbol),
    trade_date  DATE NOT NULL,
    open        NUMERIC(12, 4) NOT NULL,
    high        NUMERIC(12, 4) NOT NULL,
    low         NUMERIC(12, 4) NOT NULL,
    close       NUMERIC(12, 4) NOT NULL,
    volume      BIGINT NOT NULL,
    PRIMARY KEY (symbol, trade_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_prices_date ON daily_prices (trade_date);

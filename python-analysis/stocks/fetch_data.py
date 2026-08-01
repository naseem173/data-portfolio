"""Download free historical daily OHLCV data via yfinance (Yahoo Finance)."""
import pathlib
import yfinance as yf

TICKERS = {
    # Indian stocks (NSE, via Yahoo Finance's .NS suffix) - primary focus, across sectors
    "RELIANCE.NS": "Reliance Industries Ltd.",
    "TCS.NS": "Tata Consultancy Services Ltd.",
    "INFY.NS": "Infosys Ltd.",
    "HDFCBANK.NS": "HDFC Bank Ltd.",
    "ICICIBANK.NS": "ICICI Bank Ltd.",
    "SBIN.NS": "State Bank of India",
    "BHARTIARTL.NS": "Bharti Airtel Ltd.",
    "ITC.NS": "ITC Ltd.",
    "HINDUNILVR.NS": "Hindustan Unilever Ltd.",
    "BAJFINANCE.NS": "Bajaj Finance Ltd.",
    "MARUTI.NS": "Maruti Suzuki India Ltd.",
    "LT.NS": "Larsen & Toubro Ltd.",
    # US stocks - kept for cross-market comparison
    "AAPL": "Apple Inc.",
    "MSFT": "Microsoft Corp.",
    "GOOGL": "Alphabet Inc.",
    "TSLA": "Tesla Inc.",
    "SPY": "SPDR S&P 500 ETF",
}

RAW_DIR = pathlib.Path(__file__).parent / "data" / "raw"
PERIOD = "5y"


def main():
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    for symbol in TICKERS:
        df = yf.download(symbol, period=PERIOD, progress=False, auto_adjust=False)
        df.columns = df.columns.get_level_values(0)
        df = df.reset_index()
        out_path = RAW_DIR / f"{symbol}.csv"
        df.to_csv(out_path, index=False)
        print(f"{symbol}: {len(df)} rows -> {out_path}")


if __name__ == "__main__":
    main()

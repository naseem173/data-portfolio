"""Download the free Cricsheet IPL ball-by-ball dataset (no auth required).

Source: https://cricsheet.org/downloads/ipl_json.zip
"""
import io
import pathlib
import zipfile
import requests

URL = "https://cricsheet.org/downloads/ipl_json.zip"
RAW_DIR = pathlib.Path(__file__).parent / "data" / "raw"
EXTRACT_DIR = RAW_DIR / "ipl_json"


def main():
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Downloading {URL} ...")
    resp = requests.get(URL, timeout=60)
    resp.raise_for_status()

    with zipfile.ZipFile(io.BytesIO(resp.content)) as zf:
        zf.extractall(EXTRACT_DIR)
        n_files = len(zf.namelist())

    print(f"Extracted {n_files} files to {EXTRACT_DIR}")


if __name__ == "__main__":
    main()

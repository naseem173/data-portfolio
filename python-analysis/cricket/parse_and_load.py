"""Parse Cricsheet IPL JSON match files into matches.csv / deliveries.csv,
then bulk-load both into Postgres.

Run fetch_data.py first to download the raw JSON files.
"""
import csv
import json
import os
import pathlib
import psycopg2

RAW_DIR = pathlib.Path(__file__).parent / "data" / "raw" / "ipl_json"
OUT_DIR = pathlib.Path(__file__).parent / "data" / "processed"
DB_DSN = os.environ.get("DATABASE_URL", "dbname=data_portfolio")

MATCH_FIELDS = [
    "match_id", "season", "match_date", "city", "venue", "team1", "team2",
    "toss_winner", "toss_decision", "winner", "win_by_runs", "win_by_wickets",
    "player_of_match",
]
DELIVERY_FIELDS = [
    "match_id", "inning", "batting_team", "over", "ball", "batter", "bowler",
    "non_striker", "batter_runs", "extra_runs", "total_runs", "extras_type",
    "is_wicket", "player_dismissed", "dismissal_kind",
]


def parse_match(path: pathlib.Path):
    data = json.loads(path.read_text())
    info = data["info"]
    match_id = path.stem

    teams = info["teams"]
    toss = info.get("toss", {})
    outcome = info.get("outcome", {})
    by = outcome.get("by", {})
    pom = info.get("player_of_match")

    match_row = {
        "match_id": match_id,
        "season": str(info.get("season", "")),
        "match_date": info["dates"][0],
        "city": info.get("city", ""),
        "venue": info.get("venue", ""),
        "team1": teams[0],
        "team2": teams[1] if len(teams) > 1 else "",
        "toss_winner": toss.get("winner", ""),
        "toss_decision": toss.get("decision", ""),
        "winner": outcome.get("winner", ""),
        "win_by_runs": by.get("runs", ""),
        "win_by_wickets": by.get("wickets", ""),
        "player_of_match": pom[0] if pom else "",
    }

    delivery_rows = []
    for inning_idx, inning in enumerate(data["innings"], start=1):
        batting_team = inning["team"]
        for over in inning["overs"]:
            over_num = over["over"]
            for delivery in over["deliveries"]:
                ball_num = int(delivery["actual_delivery"].split(".")[1])
                runs = delivery["runs"]
                extras = delivery.get("extras", {})
                extras_type = next(iter(extras.keys()), "")
                wickets = delivery.get("wickets", [])
                is_wicket = bool(wickets)
                player_dismissed = wickets[0].get("player_out", "") if wickets else ""
                dismissal_kind = wickets[0].get("kind", "") if wickets else ""

                delivery_rows.append({
                    "match_id": match_id,
                    "inning": inning_idx,
                    "batting_team": batting_team,
                    "over": over_num,
                    "ball": ball_num,
                    "batter": delivery["batter"],
                    "bowler": delivery["bowler"],
                    "non_striker": delivery.get("non_striker", ""),
                    "batter_runs": runs["batter"],
                    "extra_runs": runs["extras"],
                    "total_runs": runs["total"],
                    "extras_type": extras_type,
                    "is_wicket": is_wicket,
                    "player_dismissed": player_dismissed,
                    "dismissal_kind": dismissal_kind,
                })

    return match_row, delivery_rows


def write_csvs():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    match_path = OUT_DIR / "matches.csv"
    delivery_path = OUT_DIR / "deliveries.csv"

    files = sorted(RAW_DIR.glob("*.json"))
    with open(match_path, "w", newline="") as mf, open(delivery_path, "w", newline="") as df:
        match_writer = csv.DictWriter(mf, fieldnames=MATCH_FIELDS)
        delivery_writer = csv.DictWriter(df, fieldnames=DELIVERY_FIELDS)
        match_writer.writeheader()
        delivery_writer.writeheader()

        total_deliveries = 0
        for path in files:
            match_row, delivery_rows = parse_match(path)
            match_writer.writerow(match_row)
            delivery_writer.writerows(delivery_rows)
            total_deliveries += len(delivery_rows)

    print(f"Parsed {len(files)} matches, {total_deliveries} deliveries")
    return match_path, delivery_path


def load_to_postgres(match_path, delivery_path):
    conn = psycopg2.connect(DB_DSN)
    cur = conn.cursor()
    cur.execute("TRUNCATE deliveries, matches CASCADE")

    with open(match_path) as f:
        cur.copy_expert(
            "COPY matches FROM STDIN WITH (FORMAT csv, HEADER true, NULL '')", f
        )
    with open(delivery_path) as f:
        cur.copy_expert(
            "COPY deliveries FROM STDIN WITH (FORMAT csv, HEADER true, NULL '')", f
        )

    conn.commit()
    cur.execute("SELECT COUNT(*) FROM matches")
    print("matches loaded:", cur.fetchone()[0])
    cur.execute("SELECT COUNT(*) FROM deliveries")
    print("deliveries loaded:", cur.fetchone()[0])
    cur.close()
    conn.close()


if __name__ == "__main__":
    match_path, delivery_path = write_csvs()
    load_to_postgres(match_path, delivery_path)

-- Cricket analytics schema (IPL ball-by-ball data, source: cricsheet.org)

CREATE TABLE IF NOT EXISTS matches (
    match_id            TEXT PRIMARY KEY,
    season              TEXT,
    match_date          DATE NOT NULL,
    city                TEXT,
    venue               TEXT,
    team1               TEXT NOT NULL,
    team2               TEXT NOT NULL,
    toss_winner         TEXT,
    toss_decision       TEXT,
    winner              TEXT,
    win_by_runs         INT,
    win_by_wickets      INT,
    player_of_match     TEXT
);

CREATE TABLE IF NOT EXISTS deliveries (
    match_id            TEXT NOT NULL REFERENCES matches(match_id),
    inning              INT NOT NULL,
    batting_team        TEXT NOT NULL,
    over                INT NOT NULL,
    ball                INT NOT NULL,
    batter              TEXT NOT NULL,
    bowler              TEXT NOT NULL,
    non_striker         TEXT,
    batter_runs         INT NOT NULL,
    extra_runs          INT NOT NULL,
    total_runs          INT NOT NULL,
    extras_type         TEXT,
    is_wicket           BOOLEAN NOT NULL DEFAULT FALSE,
    player_dismissed    TEXT,
    dismissal_kind      TEXT
);

CREATE INDEX IF NOT EXISTS idx_deliveries_match ON deliveries (match_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_batter ON deliveries (batter);
CREATE INDEX IF NOT EXISTS idx_deliveries_bowler ON deliveries (bowler);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches (match_date);

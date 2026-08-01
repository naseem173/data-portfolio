-- Cricket analytics queries over ball-by-ball IPL data (matches, deliveries)

-- 1. Batting leaderboard: runs, average, strike rate (min 200 balls faced to qualify)
SELECT
    batter,
    COUNT(*) FILTER (WHERE extras_type IS DISTINCT FROM 'wides') AS balls_faced,
    SUM(batter_runs) AS runs,
    SUM(CASE WHEN batter_runs = 4 THEN 1 ELSE 0 END) AS fours,
    SUM(CASE WHEN batter_runs = 6 THEN 1 ELSE 0 END) AS sixes,
    COUNT(*) FILTER (WHERE is_wicket AND player_dismissed = batter) AS dismissals,
    ROUND(
        SUM(batter_runs)::numeric
        / NULLIF(COUNT(*) FILTER (WHERE is_wicket AND player_dismissed = batter), 0),
        2
    ) AS average,
    ROUND(
        SUM(batter_runs)::numeric
        / NULLIF(COUNT(*) FILTER (WHERE extras_type IS DISTINCT FROM 'wides'), 0) * 100,
        2
    ) AS strike_rate
FROM deliveries
GROUP BY batter
HAVING COUNT(*) FILTER (WHERE extras_type IS DISTINCT FROM 'wides') >= 200
ORDER BY runs DESC
LIMIT 20;

-- 2. Bowling leaderboard: wickets, economy, average, strike rate (min 200 legal balls bowled)
WITH bowler_deliveries AS (
    SELECT
        bowler,
        (extras_type IS DISTINCT FROM 'wides' AND extras_type IS DISTINCT FROM 'noballs') AS is_legal_ball,
        batter_runs + CASE WHEN extras_type IN ('wides', 'noballs') THEN extra_runs ELSE 0 END AS bowler_runs,
        (is_wicket AND dismissal_kind IS DISTINCT FROM 'run out') AS is_bowler_wicket
    FROM deliveries
)
SELECT
    bowler,
    COUNT(*) FILTER (WHERE is_legal_ball) AS balls_bowled,
    SUM(bowler_runs) AS runs_conceded,
    SUM(CASE WHEN is_bowler_wicket THEN 1 ELSE 0 END) AS wickets,
    ROUND(SUM(bowler_runs)::numeric / NULLIF(COUNT(*) FILTER (WHERE is_legal_ball), 0) * 6, 2) AS economy,
    ROUND(
        SUM(bowler_runs)::numeric / NULLIF(SUM(CASE WHEN is_bowler_wicket THEN 1 ELSE 0 END), 0),
        2
    ) AS average,
    ROUND(
        COUNT(*) FILTER (WHERE is_legal_ball)::numeric
        / NULLIF(SUM(CASE WHEN is_bowler_wicket THEN 1 ELSE 0 END), 0),
        2
    ) AS bowling_strike_rate
FROM bowler_deliveries
GROUP BY bowler
HAVING COUNT(*) FILTER (WHERE is_legal_ball) >= 200
ORDER BY wickets DESC
LIMIT 20;

-- 3. Wicket partnerships per innings: runs scored between each fall of wicket
WITH deliveries_ordered AS (
    SELECT
        *,
        SUM(CASE WHEN is_wicket THEN 1 ELSE 0 END) OVER (
            PARTITION BY match_id, inning ORDER BY over, ball
            ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
        ) AS wickets_before
    FROM deliveries
)
SELECT
    match_id,
    inning,
    wickets_before + 1 AS wicket_number,
    SUM(total_runs) AS partnership_runs,
    COUNT(*) AS balls
FROM deliveries_ordered
GROUP BY match_id, inning, wickets_before
ORDER BY match_id, inning, wicket_number;

-- 4. Head-to-head team records
SELECT
    LEAST(team1, team2) AS team_a,
    GREATEST(team1, team2) AS team_b,
    COUNT(*) AS matches_played,
    SUM(CASE WHEN winner = LEAST(team1, team2) THEN 1 ELSE 0 END) AS team_a_wins,
    SUM(CASE WHEN winner = GREATEST(team1, team2) THEN 1 ELSE 0 END) AS team_b_wins
FROM matches
GROUP BY team_a, team_b
ORDER BY matches_played DESC;

-- 5. Powerplay (overs 1-6) vs death-overs (overs 16-20) scoring rate by team
SELECT
    batting_team,
    ROUND(AVG(pp_runs), 2) AS avg_powerplay_runs,
    ROUND(AVG(death_runs), 2) AS avg_death_overs_runs
FROM (
    SELECT
        match_id,
        inning,
        batting_team,
        SUM(CASE WHEN over <= 5 THEN total_runs ELSE 0 END) AS pp_runs,
        SUM(CASE WHEN over >= 15 THEN total_runs ELSE 0 END) AS death_runs
    FROM deliveries
    GROUP BY match_id, inning, batting_team
) innings_splits
GROUP BY batting_team
ORDER BY avg_powerplay_runs DESC;

-- 6. Season-by-season run totals for a given player (ranked within each season)
SELECT
    m.season,
    d.batter,
    SUM(d.batter_runs) AS runs,
    RANK() OVER (PARTITION BY m.season ORDER BY SUM(d.batter_runs) DESC) AS season_rank
FROM deliveries d
JOIN matches m ON m.match_id = d.match_id
GROUP BY m.season, d.batter
ORDER BY m.season, season_rank
LIMIT 100;

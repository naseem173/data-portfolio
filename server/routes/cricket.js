import { Router } from 'express'
import { pool } from '../db.js'

const router = Router()

// GET /api/cricket/teams
router.get('/teams', async (req, res) => {
  const { rows } = await pool.query(`
    SELECT DISTINCT team FROM (
      SELECT team1 AS team FROM matches
      UNION
      SELECT team2 AS team FROM matches
    ) t
    ORDER BY team
  `)
  res.json(rows.map((r) => r.team))
})

// GET /api/cricket/batting?limit=20 - batting leaderboard (min 200 balls faced)
router.get('/batting', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100)
  const { rows } = await pool.query(
    `
    SELECT
        batter,
        COUNT(*) FILTER (WHERE extras_type IS DISTINCT FROM 'wides') AS balls_faced,
        SUM(batter_runs) AS runs,
        SUM(CASE WHEN batter_runs = 4 THEN 1 ELSE 0 END) AS fours,
        SUM(CASE WHEN batter_runs = 6 THEN 1 ELSE 0 END) AS sixes,
        COUNT(*) FILTER (WHERE is_wicket AND player_dismissed = batter) AS dismissals,
        ROUND(SUM(batter_runs)::numeric / NULLIF(COUNT(*) FILTER (WHERE is_wicket AND player_dismissed = batter), 0), 2) AS average,
        ROUND(SUM(batter_runs)::numeric / NULLIF(COUNT(*) FILTER (WHERE extras_type IS DISTINCT FROM 'wides'), 0) * 100, 2) AS strike_rate
    FROM deliveries
    GROUP BY batter
    HAVING COUNT(*) FILTER (WHERE extras_type IS DISTINCT FROM 'wides') >= 200
    ORDER BY runs DESC
    LIMIT $1
    `,
    [limit]
  )
  res.json(rows)
})

// GET /api/cricket/bowling?limit=20 - bowling leaderboard (min 200 legal balls bowled)
router.get('/bowling', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100)
  const { rows } = await pool.query(
    `
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
        ROUND(SUM(bowler_runs)::numeric / NULLIF(SUM(CASE WHEN is_bowler_wicket THEN 1 ELSE 0 END), 0), 2) AS average,
        ROUND(COUNT(*) FILTER (WHERE is_legal_ball)::numeric / NULLIF(SUM(CASE WHEN is_bowler_wicket THEN 1 ELSE 0 END), 0), 2) AS bowling_strike_rate
    FROM bowler_deliveries
    GROUP BY bowler
    HAVING COUNT(*) FILTER (WHERE is_legal_ball) >= 200
    ORDER BY wickets DESC
    LIMIT $1
    `,
    [limit]
  )
  res.json(rows)
})

// GET /api/cricket/head-to-head - all team-pair records
router.get('/head-to-head', async (req, res) => {
  const { rows } = await pool.query(`
    SELECT
        LEAST(team1, team2) AS team_a,
        GREATEST(team1, team2) AS team_b,
        COUNT(*) AS matches_played,
        SUM(CASE WHEN winner = LEAST(team1, team2) THEN 1 ELSE 0 END) AS team_a_wins,
        SUM(CASE WHEN winner = GREATEST(team1, team2) THEN 1 ELSE 0 END) AS team_b_wins
    FROM matches
    GROUP BY team_a, team_b
    ORDER BY matches_played DESC
  `)
  res.json(rows)
})

// GET /api/cricket/phase-breakdown - powerplay vs death-overs scoring rate by team
// (per-over rate, not raw totals - powerplay is 6 overs, death-overs is 5, so totals alone
// aren't comparable)
router.get('/phase-breakdown', async (req, res) => {
  const { rows } = await pool.query(`
    SELECT
        batting_team,
        ROUND(AVG(pp_runs) / 6, 2) AS powerplay_run_rate,
        ROUND(AVG(death_runs) / 5, 2) AS death_overs_run_rate
    FROM (
        SELECT match_id, inning, batting_team,
            SUM(CASE WHEN over <= 5 THEN total_runs ELSE 0 END) AS pp_runs,
            SUM(CASE WHEN over >= 15 THEN total_runs ELSE 0 END) AS death_runs
        FROM deliveries
        GROUP BY match_id, inning, batting_team
    ) innings_splits
    GROUP BY batting_team
    ORDER BY death_overs_run_rate DESC
  `)
  res.json(rows)
})

// GET /api/cricket/player/:name - combined batting + bowling career stats
router.get('/player/:name', async (req, res) => {
  const { name } = req.params
  const battingQuery = pool.query(
    `
    SELECT
        COUNT(*) FILTER (WHERE extras_type IS DISTINCT FROM 'wides') AS balls_faced,
        SUM(batter_runs) AS runs,
        SUM(CASE WHEN batter_runs = 4 THEN 1 ELSE 0 END) AS fours,
        SUM(CASE WHEN batter_runs = 6 THEN 1 ELSE 0 END) AS sixes,
        COUNT(DISTINCT match_id) AS matches,
        COUNT(*) FILTER (WHERE is_wicket AND player_dismissed = batter) AS dismissals,
        ROUND(SUM(batter_runs)::numeric / NULLIF(COUNT(*) FILTER (WHERE is_wicket AND player_dismissed = batter), 0), 2) AS average,
        ROUND(SUM(batter_runs)::numeric / NULLIF(COUNT(*) FILTER (WHERE extras_type IS DISTINCT FROM 'wides'), 0) * 100, 2) AS strike_rate
    FROM deliveries
    WHERE batter = $1
    GROUP BY batter
    `,
    [name]
  )
  const bowlingQuery = pool.query(
    `
    WITH bowler_deliveries AS (
        SELECT
            (extras_type IS DISTINCT FROM 'wides' AND extras_type IS DISTINCT FROM 'noballs') AS is_legal_ball,
            batter_runs + CASE WHEN extras_type IN ('wides', 'noballs') THEN extra_runs ELSE 0 END AS bowler_runs,
            (is_wicket AND dismissal_kind IS DISTINCT FROM 'run out') AS is_bowler_wicket
        FROM deliveries
        WHERE bowler = $1
    )
    SELECT
        COUNT(*) FILTER (WHERE is_legal_ball) AS balls_bowled,
        SUM(bowler_runs) AS runs_conceded,
        SUM(CASE WHEN is_bowler_wicket THEN 1 ELSE 0 END) AS wickets,
        ROUND(SUM(bowler_runs)::numeric / NULLIF(COUNT(*) FILTER (WHERE is_legal_ball), 0) * 6, 2) AS economy
    FROM bowler_deliveries
    `,
    [name]
  )

  const [batting, bowling] = await Promise.all([battingQuery, bowlingQuery])
  res.json({
    name,
    batting: batting.rows[0] || null,
    bowling: bowling.rows[0]?.balls_bowled ? bowling.rows[0] : null,
  })
})

export default router

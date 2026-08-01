import { useEffect, useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { api } from '../api/client'
import { useTheme } from '../theme/ThemeContext.jsx'

const TEAM_CODE = {
  'Chennai Super Kings': 'CSK',
  'Deccan Chargers': 'DCH',
  'Delhi Capitals': 'DC',
  'Delhi Daredevils': 'DD',
  'Gujarat Lions': 'GL',
  'Gujarat Titans': 'GT',
  'Kings XI Punjab': 'KXIP',
  'Kochi Tuskers Kerala': 'KTK',
  'Kolkata Knight Riders': 'KKR',
  'Lucknow Super Giants': 'LSG',
  'Mumbai Indians': 'MI',
  'Pune Warriors': 'PW',
  'Punjab Kings': 'PBKS',
  'Rajasthan Royals': 'RR',
  'Rising Pune Supergiant': 'RPS',
  'Rising Pune Supergiants': 'RPS2',
  'Royal Challengers Bangalore': 'RCB',
  'Royal Challengers Bengaluru': 'RCB2',
  'Sunrisers Hyderabad': 'SRH',
}

function teamCode(name) {
  return TEAM_CODE[name] || name
}

export default function CricketDashboard() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [teams, setTeams] = useState([])
  const [batting, setBatting] = useState([])
  const [bowling, setBowling] = useState([])
  const [headToHead, setHeadToHead] = useState([])
  const [phaseBreakdown, setPhaseBreakdown] = useState([])
  const [teamA, setTeamA] = useState('')
  const [teamB, setTeamB] = useState('')

  useEffect(() => {
    api.get('/api/cricket/teams').then((res) => setTeams(res.data))
    api.get('/api/cricket/batting?limit=15').then((res) => setBatting(res.data))
    api.get('/api/cricket/bowling?limit=15').then((res) => setBowling(res.data))
    api.get('/api/cricket/head-to-head').then((res) => setHeadToHead(res.data))
    api.get('/api/cricket/phase-breakdown').then((res) =>
      setPhaseBreakdown(res.data.map((row) => ({ ...row, team_code: teamCode(row.batting_team) })))
    )
  }, [])

  const record = useMemo(() => {
    if (!teamA || !teamB || teamA === teamB) return null
    const a = [teamA, teamB].sort()
    return headToHead.find((r) => r.team_a === a[0] && r.team_b === a[1]) || null
  }, [teamA, teamB, headToHead])

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">
        Cricket <span style={{ color: isDark ? '#199e70' : '#1baf7a' }}>Analytics</span>
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mt-1">
        295k+ ball-by-ball IPL deliveries across 1,243 matches, PostgreSQL aggregation &amp; window
        functions — Postgres → Express → React. Source:{' '}
        <a href="https://cricsheet.org" target="_blank" rel="noreferrer" className="underline">
          cricsheet.org
        </a>
        .
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <LeaderboardCard
          title="Batting leaders"
          subtitle="min. 200 balls faced"
          accent="#eb6834"
          columns={[
            { key: 'batter', label: 'Batter', align: 'left' },
            { key: 'runs', label: 'Runs' },
            { key: 'average', label: 'Avg' },
            { key: 'strike_rate', label: 'SR' },
            { key: 'sixes', label: '6s' },
          ]}
          rows={batting}
        />
        <LeaderboardCard
          title="Bowling leaders"
          subtitle="min. 200 legal balls bowled"
          accent="#1baf7a"
          columns={[
            { key: 'bowler', label: 'Bowler', align: 'left' },
            { key: 'wickets', label: 'Wkts' },
            { key: 'economy', label: 'Econ' },
            { key: 'average', label: 'Avg' },
            { key: 'bowling_strike_rate', label: 'SR' },
          ]}
          rows={bowling}
        />
      </div>

      <SectionHeading color="#2a78d6">Powerplay vs. death-overs scoring rate by team</SectionHeading>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 -mt-2">
        Runs per over, not raw totals — powerplay is 6 overs, death-overs is 5, so totals alone
        aren't comparable.
      </p>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={phaseBreakdown} margin={{ top: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#eee'} />
            <XAxis
              dataKey="team_code"
              interval={0}
              tick={{ fontSize: 11, fill: isDark ? '#9ca3af' : '#6b7280' }}
              stroke={isDark ? '#4b5563' : '#d1d5db'}
            />
            <YAxis tick={{ fill: isDark ? '#9ca3af' : '#6b7280' }} stroke={isDark ? '#4b5563' : '#d1d5db'} />
            <Tooltip
              labelFormatter={(_, payload) => payload?.[0]?.payload?.batting_team ?? ''}
              contentStyle={
                isDark
                  ? { backgroundColor: '#1f2937', border: '1px solid #374151', color: '#f3f4f6' }
                  : undefined
              }
            />
            <Legend verticalAlign="top" align="right" wrapperStyle={{ color: isDark ? '#d1d5db' : undefined }} />
            <Bar dataKey="powerplay_run_rate" name="Powerplay run rate (overs 1-6)" fill="#3b82f6" />
            <Bar dataKey="death_overs_run_rate" name="Death-overs run rate (overs 16-20)" fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
        Hover a bar for the full team name. Team codes:{' '}
        {Object.entries(TEAM_CODE)
          .map(([name, code]) => `${code}=${name}`)
          .join(' · ')}
      </p>

      <SectionHeading color="#e87ba4">Team head-to-head</SectionHeading>
      <div className="flex gap-3 flex-wrap items-center">
        <TeamSelect label="Team A" value={teamA} onChange={setTeamA} teams={teams} />
        <span className="text-gray-400 dark:text-gray-500">vs</span>
        <TeamSelect label="Team B" value={teamB} onChange={setTeamB} teams={teams} />
      </div>

      {teamA && teamB && teamA !== teamB && (
        <div className="mt-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          {record ? (
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{record.matches_played} matches played</div>
              <div className="mt-3 grid grid-cols-2 gap-4">
                <TeamWinBox
                  name={record.team_a}
                  wins={record.team_a_wins}
                  highlight={record.team_a === teamA}
                />
                <TeamWinBox
                  name={record.team_b}
                  wins={record.team_b_wins}
                  highlight={record.team_b === teamA}
                />
              </div>
            </div>
          ) : (
            <div className="text-gray-400 dark:text-gray-500">No matches found between these teams.</div>
          )}
        </div>
      )}

      <HowItsBuilt />
    </div>
  )
}

function SectionHeading({ color, children }) {
  return (
    <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-gray-100 mt-10 mb-3">
      <span className="w-1.5 h-5 rounded-full" style={{ backgroundColor: color }} />
      {children}
    </h2>
  )
}

function Label({ color, children }) {
  return (
    <div className="flex items-center gap-1.5 font-semibold text-gray-900 dark:text-gray-100">
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      {children}
    </div>
  )
}

function HowItsBuilt() {
  const codeClass = 'bg-white dark:bg-gray-900 px-1 rounded border border-gray-200 dark:border-gray-700'
  return (
    <div className="mt-10 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">How this was built</h2>
      <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
        <div>
          <Label color="#2a78d6">Problem</Label>
          <p className="mt-1">
            Raw ball-by-ball cricket data is deeply nested (match → innings → over → delivery) and
            not directly queryable. Turn it into player and team insights.
          </p>
        </div>
        <div>
          <Label color="#eb6834">Data</Label>
          <p className="mt-1">
            1,243 IPL matches, ~296k deliveries, from the free{' '}
            <a href="https://cricsheet.org" target="_blank" rel="noreferrer" className="underline">
              cricsheet.org
            </a>{' '}
            JSON dataset — no API key required.
          </p>
        </div>
        <div>
          <Label color="#1baf7a">Python</Label>
          <p className="mt-1">
            A parser flattens each match's nested JSON (innings → overs → deliveries) into two
            relational tables — <code className={codeClass}>matches</code> and{' '}
            <code className={codeClass}>deliveries</code> — then bulk-loads them with Postgres{' '}
            <code className={codeClass}>COPY</code>.
          </p>
        </div>
        <div>
          <Label color="#4a3aa7">SQL</Label>
          <p className="mt-1">
            Conditional aggregation (<code className={codeClass}>FILTER WHERE</code>) builds
            batting/bowling leaderboards from one flat delivery table; a windowed running{' '}
            <code className={codeClass}>SUM() OVER</code> of wickets-so-far segments each innings
            into wicket partnerships.
          </p>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Label color="#e87ba4">Key insight</Label>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Normalizing both phases to a per-over rate, most teams actually score faster in the
          death overs than the powerplay, despite the fielding restrictions favoring the
          batting side early on — the late-innings willingness to take risks outweighs the
          powerplay's fielding advantage.
        </p>
      </div>
    </div>
  )
}

function LeaderboardCard({ title, subtitle, columns, rows, accent }) {
  return (
    <div
      className="bg-white dark:bg-gray-800 border-t-4 border-x border-b border-gray-200 dark:border-gray-700 rounded-xl p-4"
      style={{ borderTopColor: accent }}
    >
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="font-bold text-gray-900 dark:text-gray-100">{title}</h3>
        <span className="text-xs text-gray-400 dark:text-gray-500">{subtitle}</span>
      </div>
      <table className="w-full text-sm">
        <thead className="text-gray-400 dark:text-gray-500">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className={`py-1.5 font-medium ${c.align === 'left' ? 'text-left' : 'text-right'}`}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.batter || row.bowler} className="border-t border-gray-100 dark:border-gray-700">
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={`py-1.5 ${
                    c.align === 'left'
                      ? 'text-left font-medium text-gray-900 dark:text-gray-100'
                      : 'text-right text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {i === 0 && c.align === 'left' ? '🏆 ' : ''}
                  {row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TeamSelect({ label, value, onChange, teams }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
    >
      <option value="">{label}</option>
      {teams.map((t) => (
        <option key={t} value={t}>
          {t}
        </option>
      ))}
    </select>
  )
}

function TeamWinBox({ name, wins, highlight }) {
  return (
    <div
      className={`rounded-lg p-3 ${
        highlight ? 'text-white' : 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
      }`}
      style={highlight ? { background: 'linear-gradient(135deg, #e87ba4, #4a3aa7)' } : undefined}
    >
      <div className="text-xs uppercase tracking-wide opacity-70">{name}</div>
      <div className="text-2xl font-bold mt-1">{wins} wins</div>
    </div>
  )
}

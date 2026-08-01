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

export default function CricketDashboard() {
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
    api.get('/api/cricket/phase-breakdown').then((res) => setPhaseBreakdown(res.data))
  }, [])

  const record = useMemo(() => {
    if (!teamA || !teamB || teamA === teamB) return null
    const a = [teamA, teamB].sort()
    return headToHead.find((r) => r.team_a === a[0] && r.team_b === a[1]) || null
  }, [teamA, teamB, headToHead])

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-semibold text-gray-900">Cricket Analytics</h1>
      <p className="text-gray-500 mt-1">
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

      <h2 className="text-xl font-semibold text-gray-900 mt-10 mb-1">
        Powerplay vs. death-overs scoring rate by team
      </h2>
      <p className="text-sm text-gray-500 mb-3">
        Runs per over, not raw totals — powerplay is 6 overs, death-overs is 5, so totals alone
        aren't comparable.
      </p>
      <div className="bg-white border border-gray-200 rounded-xl p-4 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={phaseBreakdown} margin={{ bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis
              dataKey="batting_team"
              angle={-30}
              textAnchor="end"
              interval={0}
              tick={{ fontSize: 11 }}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="powerplay_run_rate" name="Powerplay run rate (overs 1-6)" fill="#3b82f6" />
            <Bar dataKey="death_overs_run_rate" name="Death-overs run rate (overs 16-20)" fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <h2 className="text-xl font-semibold text-gray-900 mt-10 mb-3">Team head-to-head</h2>
      <div className="flex gap-3 flex-wrap items-center">
        <TeamSelect label="Team A" value={teamA} onChange={setTeamA} teams={teams} />
        <span className="text-gray-400">vs</span>
        <TeamSelect label="Team B" value={teamB} onChange={setTeamB} teams={teams} />
      </div>

      {teamA && teamB && teamA !== teamB && (
        <div className="mt-4 bg-white border border-gray-200 rounded-xl p-5">
          {record ? (
            <div>
              <div className="text-sm text-gray-500">{record.matches_played} matches played</div>
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
            <div className="text-gray-400">No matches found between these teams.</div>
          )}
        </div>
      )}

      <HowItsBuilt />
    </div>
  )
}

function HowItsBuilt() {
  return (
    <div className="mt-10 bg-gray-50 border border-gray-200 rounded-xl p-5">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">How this was built</h2>
      <div className="grid sm:grid-cols-2 gap-4 text-sm text-gray-600">
        <div>
          <div className="font-medium text-gray-900">Problem</div>
          <p className="mt-1">
            Raw ball-by-ball cricket data is deeply nested (match → innings → over → delivery) and
            not directly queryable. Turn it into player and team insights.
          </p>
        </div>
        <div>
          <div className="font-medium text-gray-900">Data</div>
          <p className="mt-1">
            1,243 IPL matches, ~296k deliveries, from the free{' '}
            <a href="https://cricsheet.org" target="_blank" rel="noreferrer" className="underline">
              cricsheet.org
            </a>{' '}
            JSON dataset — no API key required.
          </p>
        </div>
        <div>
          <div className="font-medium text-gray-900">Python</div>
          <p className="mt-1">
            A parser flattens each match's nested JSON (innings → overs → deliveries) into two
            relational tables — <code className="bg-white px-1 rounded border border-gray-200">matches</code> and{' '}
            <code className="bg-white px-1 rounded border border-gray-200">deliveries</code> — then
            bulk-loads them with Postgres <code className="bg-white px-1 rounded border border-gray-200">COPY</code>.
          </p>
        </div>
        <div>
          <div className="font-medium text-gray-900">SQL</div>
          <p className="mt-1">
            Conditional aggregation (<code className="bg-white px-1 rounded border border-gray-200">FILTER WHERE</code>) builds
            batting/bowling leaderboards from one flat delivery table; a windowed running{' '}
            <code className="bg-white px-1 rounded border border-gray-200">SUM() OVER</code> of
            wickets-so-far segments each innings into wicket partnerships.
          </p>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="font-medium text-gray-900 text-sm">Key insight</div>
        <p className="mt-1 text-sm text-gray-600">
          Normalizing both phases to a per-over rate, most teams actually score faster in the
          death overs than the powerplay, despite the fielding restrictions favoring the
          batting side early on — the late-innings willingness to take risks outweighs the
          powerplay's fielding advantage.
        </p>
      </div>
    </div>
  )
}

function LeaderboardCard({ title, subtitle, columns, rows }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-baseline justify-between mb-2">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <span className="text-xs text-gray-400">{subtitle}</span>
      </div>
      <table className="w-full text-sm">
        <thead className="text-gray-400">
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
            <tr key={row.batter || row.bowler} className="border-t border-gray-100">
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={`py-1.5 ${c.align === 'left' ? 'text-left font-medium text-gray-900' : 'text-right text-gray-700'}`}
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
      className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
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
    <div className={`rounded-lg p-3 ${highlight ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="text-xs uppercase tracking-wide opacity-70">{name}</div>
      <div className="text-2xl font-semibold mt-1">{wins} wins</div>
    </div>
  )
}

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';

export default function TrackView() {
  const { userGoalId } = useParams();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(null);
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const [logged, setLogged] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/progress/${userGoalId}`).then(res => setProgress(res.data)).catch(() => {});
  }, [userGoalId, logged]);

  async function submitLog() {
    if (!value) return setError('Please enter a value');
    setLoading(true);
    setError('');
    try {
      await api.post('/tracking-logs', {
        user_goal_id: userGoalId,
        metric: progress?.logs ? 'value' : 'value',
        value: parseFloat(value),
        notes,
      });
      setValue('');
      setNotes('');
      setLogged(l => !l);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to log');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-10">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-stone-900">Track Progress</h1>
          <button onClick={() => navigate(`/plan/${userGoalId}`)} className="text-sm text-stone-500 hover:text-stone-700">
            ← Plan
          </button>
        </div>

        {/* Log today */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 mb-6">
          <h2 className="font-semibold text-stone-800 mb-4 text-sm">Log today</h2>
          <div className="flex items-center gap-3 mb-3">
            <input
              type="number"
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="Today's value"
              className="border border-stone-300 rounded-lg px-3 py-2 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Optional note"
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          <button
            onClick={submitLog}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Logging...' : 'Log it'}
          </button>
        </div>

        {/* Progress */}
        {progress && (
          <div className="space-y-4">
            <div className="bg-white border border-stone-200 rounded-2xl p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs text-stone-400 uppercase tracking-wide">Baseline</p>
                  <p className="text-2xl font-bold text-stone-800">{progress.baseline}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-stone-400 uppercase tracking-wide">Current</p>
                  <p className="text-2xl font-bold text-stone-800">{progress.current}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-stone-400 uppercase tracking-wide">Change</p>
                  <p className={`text-2xl font-bold ${progress.delta > 0 ? 'text-emerald-600' : progress.delta < 0 ? 'text-red-500' : 'text-stone-400'}`}>
                    {progress.delta > 0 ? '+' : ''}{progress.delta}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="bg-stone-100 rounded-full h-2 mb-3">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (progress.weeksElapsed / progress.timelineWeeks) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-stone-500">Week {progress.weeksElapsed} of {progress.timelineWeeks}</p>
            </div>

            {/* Verdict */}
            <div className={`rounded-xl p-4 text-sm border ${
              progress.isWorking === true ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
              progress.isWorking === false ? 'bg-amber-50 border-amber-200 text-amber-800' :
              'bg-stone-50 border-stone-200 text-stone-600'
            }`}>
              {progress.message}
            </div>

            {/* Log history */}
            {progress.logs?.length > 0 && (
              <div className="bg-white border border-stone-200 rounded-2xl p-5">
                <h3 className="font-medium text-stone-800 text-sm mb-3">Log history</h3>
                <div className="space-y-2">
                  {progress.logs.slice(-7).reverse().map((log, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-stone-500">{new Date(log.loggedAt).toLocaleDateString()}</span>
                      <span className="font-medium text-stone-800">{log.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-stone-400 mt-8 text-center">
          Missing a day doesn't derail you. Habit formation takes a median of 66 days — keep going.
        </p>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

const TIER_COLORS = {
  strong: 'bg-emerald-100 text-emerald-800',
  moderate: 'bg-blue-100 text-blue-800',
  mixed: 'bg-amber-100 text-amber-800',
  emerging: 'bg-purple-100 text-purple-800',
};

const GOAL_ICONS = {
  gym: '💪',
  gut: '🦠',
  skin: '✨',
  fat_loss: '🎯',
  energy: '⚡',
};

export default function GoalPicker() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/goals').then(res => {
      setGoals(res.data.goals);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <p className="text-stone-500">Loading goals...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-stone-900">Choose your goal</h1>
          <p className="text-stone-500 mt-1 text-sm">Each plan is driven by evidence, not guesswork.</p>
        </div>

        <div className="space-y-3">
          {goals.map(goal => (
            <button
              key={goal.id}
              onClick={() => navigate(`/intake/${goal.id}`)}
              className="w-full bg-white border border-stone-200 rounded-2xl p-5 text-left hover:border-emerald-400 hover:shadow-sm transition group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{GOAL_ICONS[goal.id] || '🎯'}</span>
                  <div>
                    <h3 className="font-semibold text-stone-900 group-hover:text-emerald-700">{goal.name}</h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {goal.timelineWeeks} weeks · {goal.endpoint?.metric?.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${TIER_COLORS[goal.evidenceTier]}`}>
                  {goal.evidenceTier} evidence
                </span>
              </div>
            </button>
          ))}
        </div>

        <p className="text-xs text-stone-400 mt-8 text-center">
          Not medical advice. All claims are sourced and shown with their evidence tier.
        </p>
      </div>
    </div>
  );
}

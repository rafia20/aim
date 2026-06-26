import { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import api from '../lib/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function PlanView() {
  const { userGoalId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [targets, setTargets] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);

  async function generatePlan() {
    setGenerating(true);
    setError('');
    try {
      const res = await api.post('/meal-plans/generate', {
        user_goal_id: userGoalId,
        intake_answers: state?.intakeAnswers || {},
      });
      setPlan(res.data.mealPlan.items);
      setTargets(res.data.targets);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate plan');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-stone-900">Your Meal Plan</h1>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/track/${userGoalId}`)}
              className="text-sm border border-stone-300 text-stone-700 px-3 py-1.5 rounded-lg hover:bg-stone-100"
            >
              Track
            </button>
            <button
              onClick={() => navigate(`/grocery/${userGoalId}`, { state: { planId: plan?.id } })}
              disabled={!plan}
              className="text-sm bg-stone-800 text-white px-3 py-1.5 rounded-lg hover:bg-stone-900 disabled:opacity-40"
            >
              Grocery list →
            </button>
          </div>
        </div>

        {targets && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
            <p className="text-sm font-medium text-emerald-800 mb-2">Your targets (computed from your data)</p>
            {Object.values(targets).map(t => (
              <p key={t.ruleId} className="text-sm text-emerald-700">• {t.display}</p>
            ))}
          </div>
        )}

        {!plan && (
          <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center">
            <p className="text-stone-600 mb-6 text-sm">Ready to generate your personalised 7-day meal plan?</p>
            <button
              onClick={generatePlan}
              disabled={generating}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              {generating ? 'Generating your plan...' : 'Generate meal plan'}
            </button>
            {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
          </div>
        )}

        {plan?.days && (
          <div className="space-y-4">
            {plan.days.map((day, i) => (
              <div key={i} className="bg-white border border-stone-200 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-stone-800">{DAYS[i] || `Day ${day.day}`}</h3>
                  {day.daily_protein_g > 0 && (
                    <span className="text-xs bg-stone-100 text-stone-600 px-2 py-1 rounded-full">
                      {day.daily_protein_g}g protein
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {['breakfast', 'lunch', 'dinner', 'snack'].map(meal => {
                    const m = day.meals?.[meal];
                    if (!m) return null;
                    return (
                      <div key={meal} className="flex items-start gap-3 text-sm">
                        <span className="text-stone-400 w-20 shrink-0 capitalize">{meal}</span>
                        <div>
                          <span className="font-medium text-stone-800">{m.name}</span>
                          {m.description && <p className="text-stone-500 text-xs mt-0.5">{m.description}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {plan.weekly_summary && (
              <div className="bg-stone-100 rounded-xl p-4 text-sm text-stone-600">
                {plan.weekly_summary}
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-stone-400 mt-8 text-center">
          Not medical advice. Meals are generated to meet your computed targets, not to replace clinical guidance.
        </p>
      </div>
    </div>
  );
}

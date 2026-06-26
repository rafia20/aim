import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api';

export default function Intake() {
  const { goalId } = useParams();
  const navigate = useNavigate();
  const [goal, setGoal] = useState(null);
  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState(0); // 0 = intake questions, 1 = routine, 2 = baseline
  const [routine, setRoutine] = useState({ city: '', budget_weekly: '', cooking_days: 5, prep_minutes: 30 });
  const [baseline, setBaseline] = useState('');
  const [userGoalId, setUserGoalId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/goals').then(res => {
      const g = res.data.goals.find(g => g.id === goalId);
      setGoal(g);
    });
  }, [goalId]);

  function handleAnswer(id, value) {
    setAnswers(prev => ({ ...prev, [id]: value }));
  }

  async function submitIntake() {
    setLoading(true);
    setError('');
    try {
      // Save routine
      await api.post('/intake', {
        ...routine,
        dietary_preferences: answers.dietary_preference ? [answers.dietary_preference] : [],
        allergies: answers.allergies || [],
      });

      // Activate goal
      const res = await api.post('/user-goals', { goal_id: goalId, intake_answers: answers });
      setUserGoalId(res.data.userGoal.id);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function submitBaseline() {
    if (!baseline) return setError('Please enter your baseline value');
    setLoading(true);
    setError('');
    try {
      await api.post('/baselines', {
        user_goal_id: userGoalId,
        metric: goal.endpoint.metric,
        value: parseFloat(baseline),
      });
      navigate(`/plan/${userGoalId}`, { state: { intakeAnswers: answers } });
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  if (!goal) return <div className="min-h-screen bg-stone-50 flex items-center justify-center"><p className="text-stone-500">Loading...</p></div>;

  const questions = goal.intakeQuestions || [];

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-10">
      <div className="max-w-lg mx-auto">
        <button onClick={() => navigate('/goals')} className="text-sm text-stone-400 hover:text-stone-600 mb-6 flex items-center gap-1">
          ← Back to goals
        </button>

        <h1 className="text-2xl font-bold text-stone-900 mb-1">{goal.name}</h1>
        <p className="text-stone-500 text-sm mb-8">Answer a few questions to get your personalised plan.</p>

        {step < 2 && (
          <div className="space-y-6">
            {step === 0 && questions.map(q => (
              <div key={q.id} className="bg-white rounded-2xl border border-stone-200 p-5">
                <label className="block font-medium text-stone-800 mb-3 text-sm">
                  {q.prompt}
                  {q.required && <span className="text-red-400 ml-1">*</span>}
                </label>

                {q.type === 'number' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={answers[q.id] || ''}
                      onChange={e => handleAnswer(q.id, parseFloat(e.target.value))}
                      className="border border-stone-300 rounded-lg px-3 py-2 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    {q.unit && <span className="text-stone-400 text-sm">{q.unit}</span>}
                  </div>
                )}

                {q.type === 'single_select' && (
                  <div className="flex flex-wrap gap-2">
                    {q.options.map(opt => (
                      <button
                        key={opt}
                        onClick={() => handleAnswer(q.id, opt)}
                        className={`px-3 py-1.5 rounded-full text-sm border transition ${answers[q.id] === opt ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-stone-700 border-stone-300 hover:border-emerald-400'}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {q.type === 'multi_select' && (
                  <div className="flex flex-wrap gap-2">
                    {q.options.map(opt => {
                      const selected = (answers[q.id] || []).includes(opt);
                      return (
                        <button
                          key={opt}
                          onClick={() => {
                            const current = answers[q.id] || [];
                            handleAnswer(q.id, selected ? current.filter(v => v !== opt) : [...current, opt]);
                          }}
                          className={`px-3 py-1.5 rounded-full text-sm border transition ${selected ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-stone-700 border-stone-300 hover:border-emerald-400'}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}

                {q.type === 'boolean' && (
                  <div className="flex gap-3">
                    {['Yes', 'No'].map(opt => (
                      <button
                        key={opt}
                        onClick={() => handleAnswer(q.id, opt === 'Yes')}
                        className={`px-4 py-2 rounded-lg text-sm border transition ${answers[q.id] === (opt === 'Yes') ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-stone-700 border-stone-300'}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {step === 1 && (
              <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4">
                <h2 className="font-semibold text-stone-800">Your routine & budget</h2>
                {[
                  { key: 'city', label: 'Your city', placeholder: 'e.g. Karachi, London', type: 'text' },
                  { key: 'budget_weekly', label: 'Weekly grocery budget ($)', placeholder: 'e.g. 50', type: 'number' },
                  { key: 'cooking_days', label: 'Days you cook per week', placeholder: '1–7', type: 'number' },
                  { key: 'prep_minutes', label: 'Minutes available to cook per day', placeholder: 'e.g. 30', type: 'number' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-sm font-medium text-stone-700 mb-1">{f.label}</label>
                    <input
                      type={f.type}
                      value={routine[f.key]}
                      onChange={e => setRoutine(prev => ({ ...prev, [f.key]: f.type === 'number' ? parseFloat(e.target.value) : e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                ))}
              </div>
            )}

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <div className="flex gap-3">
              {step === 1 && <button onClick={() => setStep(0)} className="flex-1 border border-stone-300 text-stone-700 py-2 rounded-lg text-sm hover:bg-stone-50">Back</button>}
              <button
                onClick={() => step === 0 ? setStep(1) : submitIntake()}
                disabled={loading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
              >
                {loading ? 'Saving...' : step === 0 ? 'Continue' : 'Activate goal'}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <h2 className="font-semibold text-stone-800 mb-1">Capture your baseline</h2>
              <p className="text-sm text-stone-600">
                This is your day-zero measurement. You can't track progress without a starting point.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 p-5">
              <label className="block font-medium text-stone-800 mb-3 text-sm">
                Your current {goal.endpoint.metric.replace(/_/g, ' ')} ({goal.endpoint.unit})
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={baseline}
                  onChange={e => setBaseline(e.target.value)}
                  placeholder="Enter value"
                  className="border border-stone-300 rounded-lg px-3 py-2 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-stone-400 text-sm">{goal.endpoint.unit}</span>
              </div>
            </div>

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <button
              onClick={submitBaseline}
              disabled={loading || !baseline}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              {loading ? 'Starting...' : 'Start my plan →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

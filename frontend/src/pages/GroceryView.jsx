import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import api from '../lib/api';

export default function GroceryView() {
  const { userGoalId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [planId, setPlanId] = useState(state?.planId || null);
  const [grocery, setGrocery] = useState(null);
  const [totalCost, setTotalCost] = useState(null);
  const [overBudget, setOverBudget] = useState(false);
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-fetch latest meal plan ID if not passed via state
  useEffect(() => {
    if (!planId && userGoalId) {
      api.get(`/meal-plans/latest/${userGoalId}`)
        .then(res => setPlanId(res.data.mealPlan.id))
        .catch(() => setError('No meal plan found. Generate a meal plan first.'));
    }
  }, [planId, userGoalId]);

  async function generateGrocery() {
    if (!planId) return setError('No meal plan found. Generate a meal plan first.');
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/grocery-lists/generate', { meal_plan_id: planId });
      const items = res.data.groceryList.items;
      setGrocery(typeof items === 'string' ? JSON.parse(items) : items);
      setTotalCost(res.data.totalCost);
      setOverBudget(res.data.overBudget);
      setBudget(res.data.budget);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate grocery list');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-10">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-stone-900 mb-6">Grocery List</h1>

        {!grocery && (
          <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center">
            <button
              onClick={generateGrocery}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Building your list...' : 'Generate grocery list'}
            </button>
            {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
          </div>
        )}

        {grocery && (
          <div>
            {overBudget && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-sm text-amber-800">
                This list is over your ${budget} budget. Consider swapping items to reduce cost — all goal-aligned alternatives are shown.
              </div>
            )}

            <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden mb-4">
              {grocery.map((item, i) => (
                <div key={i} className={`flex items-center justify-between px-5 py-3 text-sm ${i < grocery.length - 1 ? 'border-b border-stone-100' : ''}`}>
                  <div className="flex-1">
                    <span className="font-medium text-stone-800">{item.name}</span>
                    <span className="text-stone-400 ml-2">{item.quantity} {item.unit}</span>
                    {item.tags?.length > 0 && (
                      <div className="flex gap-1 mt-0.5">
                        {item.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="text-xs bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded">{tag.replace(/_/g, ' ')}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  {item.est_price_usd > 0 && (
                    <span className="text-stone-500 ml-4">${item.est_price_usd.toFixed(2)}</span>
                  )}
                </div>
              ))}
            </div>

            <div className={`rounded-xl p-4 text-sm font-medium flex items-center justify-between ${overBudget ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
              <span>Estimated total</span>
              <span>${totalCost?.toFixed(2)}{budget ? ` / $${budget} budget` : ''}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

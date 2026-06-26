import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import GoalPicker from './pages/GoalPicker';
import Intake from './pages/Intake';
import PlanView from './pages/PlanView';
import GroceryView from './pages/GroceryView';
import TrackView from './pages/TrackView';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-stone-50 flex items-center justify-center"><p className="text-stone-400">Loading...</p></div>;
  return user ? children : <Navigate to="/auth" replace />;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/goals" replace /> : <AuthPage />} />
      <Route path="/goals" element={<PrivateRoute><GoalPicker /></PrivateRoute>} />
      <Route path="/intake/:goalId" element={<PrivateRoute><Intake /></PrivateRoute>} />
      <Route path="/plan/:userGoalId" element={<PrivateRoute><PlanView /></PrivateRoute>} />
      <Route path="/grocery/:userGoalId" element={<PrivateRoute><GroceryView /></PrivateRoute>} />
      <Route path="/track/:userGoalId" element={<PrivateRoute><TrackView /></PrivateRoute>} />
      <Route path="*" element={<Navigate to={user ? '/goals' : '/auth'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

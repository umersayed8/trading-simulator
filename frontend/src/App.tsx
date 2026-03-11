import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Layout from './components/common/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Trade from './pages/Trade';
import Portfolio from './pages/Portfolio';
import Leaderboard from './pages/Leaderboard';
import AlgoTrading from './pages/AlgoTrading';
import Learn from './pages/Learn';
import LessonView from './pages/LessonView';
import Achievements from './pages/Achievements';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" /></div>;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (user && !user.onboardingCompleted) return <Navigate to="/onboarding" />;
  return <>{children}</>;
}

export default function App() {
  const { isAuthenticated, user } = useAuth();
  return (
    <Routes>
      <Route path="/login"    element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} />
      <Route path="/onboarding" element={<PrivateRoute>{user?.onboardingCompleted ? <Navigate to="/dashboard" /> : <Onboarding />}</PrivateRoute>} />
      <Route path="/" element={<OnboardingRoute><Layout /></OnboardingRoute>}>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard"    element={<Dashboard />} />
        <Route path="trade"        element={<Trade />} />
        <Route path="trade/:symbol" element={<Trade />} />
        <Route path="portfolio"    element={<Portfolio />} />
        <Route path="leaderboard"  element={<Leaderboard />} />
        <Route path="algo"         element={<AlgoTrading />} />
        <Route path="learn"        element={<Learn />} />
        <Route path="learn/:id"    element={<LessonView />} />
        <Route path="achievements" element={<Achievements />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { CoachProvider } from './contexts/CoachContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AthleteList from './pages/AthleteList'
import AthleteDetail from './pages/AthleteDetail'
import RoutineBuilder from './pages/RoutineBuilder'

export default function App() {
  const { session } = useAuth()

  return (
    <CoachProvider session={session}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/athletes" element={<AthleteList />} />
          <Route path="/athletes/:athleteId" element={<AthleteDetail />} />
          <Route path="/athletes/:athleteId/routines/new" element={<RoutineBuilder />} />
          <Route path="/athletes/:athleteId/routines/:routineId" element={<RoutineBuilder />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </CoachProvider>
  )
}

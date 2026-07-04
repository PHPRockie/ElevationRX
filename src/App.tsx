import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import RoutineBuilder from './pages/RoutineBuilder'
import AthleteList from './pages/AthleteList'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/routines" element={<RoutineBuilder />} />
      <Route path="/athletes" element={<AthleteList />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

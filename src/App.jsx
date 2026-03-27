import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Connections from './pages/Connections.jsx'
import ProfileSync from './pages/ProfileSync.jsx'
import Compose from './pages/Compose.jsx'
import Feed from './pages/Feed.jsx'
import Schedule from './pages/Schedule.jsx'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/connections" element={<Connections />} />
        <Route path="/profile" element={<ProfileSync />} />
        <Route path="/compose" element={<Compose />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App

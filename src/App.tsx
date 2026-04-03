import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Guild from './pages/Guild'
import Player from './pages/Player'
import Characters from './pages/Characters'
import CharacterDetail from './pages/CharacterDetail'
import Drops from './pages/Drops'
import Admin from './pages/Admin'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/not_boosted">
        <Toaster position="top-right" theme="dark" richColors />
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/guild" element={<Guild />} />
            <Route path="/player/:userId" element={<Player />} />
            <Route path="/characters" element={<Characters />} />
            <Route path="/characters/:id" element={<CharacterDetail />} />
            <Route path="/drops" element={<Drops />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly>
                  <Admin />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/guild" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

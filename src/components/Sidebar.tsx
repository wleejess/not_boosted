import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/guild', label: 'Dashboard' },
  { to: '/characters', label: 'Characters' },
  { to: '/drops', label: 'Drops' },
]

export default function Sidebar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <aside className="w-56 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col min-h-svh">
      <div className="px-5 py-5 border-b border-slate-800">
        <span className="text-white font-bold text-sm tracking-widest uppercase">Not Boosted</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center px-3 py-2 rounded-lg text-sm transition ${
                isActive
                  ? 'bg-slate-800 text-white font-medium'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}

        {user?.role === 'admin' && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center px-3 py-2 rounded-lg text-sm transition ${
                isActive
                  ? 'bg-slate-800 text-white font-medium'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            Admin
          </NavLink>
        )}
      </nav>

      <div className="px-3 py-4 border-t border-slate-800 space-y-1">
        {user && (
          <NavLink
            to={`/player/${user.id}`}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-lg text-xs transition truncate ${
                isActive ? 'text-white bg-slate-800' : 'text-slate-500 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            {user.ign}
          </NavLink>
        )}
        <button
          onClick={handleSignOut}
          className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition"
        >
          Sign Out
        </button>
      </div>
    </aside>
  )
}

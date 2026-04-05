import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function IconGrid() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function IconPerson() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

function IconGem() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12l4 6-10 13L2 9z" />
      <path d="M2 9h20" />
    </svg>
  )
}

function IconGear() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v3m0 16v3M4.22 4.22l2.12 2.12m11.32 11.32 2.12 2.12M1 12h3m16 0h3M4.22 19.78l2.12-2.12m11.32-11.32 2.12-2.12" />
    </svg>
  )
}

const navItems = [
  { to: '/guild',      label: 'Dashboard',  Icon: IconGrid   },
  { to: '/characters', label: 'Characters', Icon: IconPerson },
  { to: '/drops',      label: 'Drops',      Icon: IconGem    },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition ${
      isActive
        ? 'bg-teal-900/40 text-teal-300 font-medium'
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-30 w-56
        md:static md:inset-auto md:z-auto
        bg-slate-900 border-r border-slate-800 flex flex-col
        transition-transform duration-200 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}
    >
      <div className="px-5 py-4 border-b border-slate-800 flex items-start justify-between">
        <div>
          <span className="text-white font-bold text-sm tracking-widest uppercase block">Not Boosted</span>
          <span className="text-slate-500 text-[10px] tracking-widest uppercase">JJV Guild</span>
        </div>
        <button
          onClick={onClose}
          className="md:hidden text-slate-400 hover:text-white mt-0.5"
          aria-label="Close menu"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} className={linkClass} onClick={onClose}>
            <Icon />
            {label}
          </NavLink>
        ))}

        {user?.role === 'admin' && (
          <NavLink to="/admin" className={linkClass} onClick={onClose}>
            <IconGear />
            Admin
          </NavLink>
        )}
      </nav>

      <div className="px-3 py-4 border-t border-slate-800 space-y-0.5">
        {user && (
          <NavLink
            to={`/player/${user.id}`}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition truncate ${
                isActive ? 'text-white bg-slate-800' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
            onClick={onClose}
          >
            <span className="text-slate-500 text-xs">◈</span>
            <span className="truncate">{user.ign}</span>
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

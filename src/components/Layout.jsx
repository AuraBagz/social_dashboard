import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Link2, UserCircle, PenSquare, Rss, Calendar, Fish, Bell, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useSocial } from '../context/SocialContext.jsx'

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/connections', icon: Link2, label: 'Connections' },
  { to: '/profile', icon: UserCircle, label: 'Profile Sync' },
  { to: '/compose', icon: PenSquare, label: 'Compose' },
  { to: '/feed', icon: Rss, label: 'Feed' },
  { to: '/schedule', icon: Calendar, label: 'Schedule' },
]

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { connectedPlatforms, notifications } = useSocial()

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-dark-800 border-r border-dark-600
        flex flex-col
        transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-5 border-b border-dark-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center">
              <Fish size={22} className="text-dark-900" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">Stalefish</h1>
              <p className="text-xs text-gray-400 leading-tight">Social Command Center</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${isActive
                  ? 'bg-gold/15 text-gold border border-gold/20'
                  : 'text-gray-400 hover:text-white hover:bg-dark-700 border border-transparent'
                }
              `}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Connection status */}
        <div className="p-4 border-t border-dark-600">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{connectedPlatforms.length} platforms connected</span>
            <span className={`w-2 h-2 rounded-full ${connectedPlatforms.length > 0 ? 'bg-accent-green' : 'bg-gray-600'}`} />
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 bg-dark-800/80 backdrop-blur-sm border-b border-dark-600 flex items-center justify-between px-4 lg:px-6 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-gray-400 hover:text-white"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
              <Bell size={18} />
              {notifications.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent-red rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                  {notifications.length}
                </span>
              )}
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-dark-900 font-bold text-sm">
              SF
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

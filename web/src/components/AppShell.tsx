import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const navItems = [
  { to: '/products',   label: 'วัสดุ อุปกรณ์' },
  { to: '/categories', label: 'หมวดหมู่' },
  { to: '/brands',     label: 'แบรนด์' },
  { to: '/suppliers',  label: 'ซัพพลายเออร์' },
]

export default function AppShell() {
  const { user, logout } = useAuth()

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-blue-100 text-blue-700'
        : 'text-gray-600 hover:bg-gray-100'
    }`

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-56 bg-white border-r border-gray-200">
        <div className="p-5 border-b border-gray-200">
          <h1 className="font-bold text-gray-900">GMT Solar</h1>
          <p className="text-xs text-gray-500 mt-0.5">{user?.name}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-200">
          <button
            onClick={logout}
            className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="md:ml-56 pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 flex">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex-1 py-3 text-center text-xs font-medium transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-500'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

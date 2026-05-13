import { NavLink } from 'react-router-dom'
import logoIcon from '../assets/logo-icon.svg'
import { ROUTES, T } from '../constants'
import { useTheme } from '../providers/ThemeProvider'
import { useProfile } from '../providers/ProfileProvider'
import { LayoutDashboardIcon, UploadIcon, PackageIcon, ShoppingCartIcon, SettingsIcon, XIcon } from './Icons'

export default function Navbar({ isOpen, onClose }) {
  const { lang } = useTheme()
  const t = T[lang]
  const { profile } = useProfile()

  const links = [
    { to: ROUTES.DASHBOARD, label: t.dashboard, icon: <LayoutDashboardIcon size={18} /> },
    { to: ROUTES.UPLOAD, label: t.upload, icon: <UploadIcon size={18} /> },
    { to: ROUTES.INVENTORY, label: t.inventory, icon: <PackageIcon size={18} /> },
    { to: ROUTES.ORDERS, label: t.orders, icon: <ShoppingCartIcon size={18} /> },
    { to: ROUTES.SETTINGS, label: t.settings, icon: <SettingsIcon size={18} /> },
  ]

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 backdrop-blur-sm z-40 md:hidden"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={onClose} />
      )}
      <nav
        className={`fixed top-0 left-0 h-full w-56 flex flex-col z-50 transform transition-transform duration-200 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
        style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border-color)' }}
      >
        <div className="px-5 py-6 flex justify-between items-center"
          style={{ borderBottom: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--accent)' }}>
              <img src={logoIcon} alt="" width={20} height={20} />
            </div>
            <div>
              <div className="font-bold text-lg leading-tight" style={{ color: 'var(--accent)' }}>
                Esnaf Tezgahı
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {t.appSubtitle}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden" style={{ color: 'var(--text-secondary)' }}>
            <XIcon size={20} />
          </button>
        </div>

        <ul className="flex-1 px-3 py-4 space-y-1">
          {links.map(({ to, label, icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === ROUTES.DASHBOARD}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${isActive ? 'nav-active' : 'nav-inactive'}`
                }
                style={({ isActive }) => isActive
                  ? { background: 'color-mix(in srgb, var(--accent) 18%, transparent)', color: 'var(--accent)', border: '1px solid color-mix(in srgb, var(--accent) 35%, transparent)', boxShadow: 'inset 3px 0 0 var(--accent)', fontWeight: 600 }
                  : { color: 'var(--text-secondary)', border: '1px solid transparent' }
                }
              >
                <span className="opacity-80">{icon}</span>
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="px-5 py-4" style={{ borderTop: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '12px' }}>
          {profile.store_name || 'Esnaf Tezgahı'}
        </div>
      </nav>
    </>
  )
}

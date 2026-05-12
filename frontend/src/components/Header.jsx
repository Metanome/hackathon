import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { ROUTES, T } from '../constants'
import { useAlerts } from '../hooks/useAlerts'
import { useTheme } from '../providers/ThemeProvider'
import { BellIcon, MenuIcon, PlusIcon } from './Icons'
import UserMenu from './UserMenu'

export default function Header({ onMenuClick }) {
  const { alerts } = useAlerts()
  const { lang } = useTheme()
  const t = T[lang]
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')

  const now = new Date()
  const todayDay = now.toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', { weekday: 'long' })
  const todayDate = now.toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })

  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '')
  }, [searchParams])

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      if (searchQuery.trim()) {
        navigate(`${ROUTES.INVENTORY}?q=${encodeURIComponent(searchQuery.trim())}`)
      } else {
        navigate(ROUTES.INVENTORY)
      }
    }
  }

  return (
    <header style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)' }}
      className="h-16 backdrop-blur-sm sticky top-0 z-40 flex items-center justify-between px-4 sm:px-8">
      <div className="flex items-center flex-1 max-w-md">
        <button onClick={onMenuClick} className="md:hidden mr-3 shrink-0" style={{ color: 'var(--text-secondary)' }}>
          <MenuIcon size={24} />
        </button>
        <input
          type="text"
          placeholder={t.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearch}
          className="hidden sm:block w-full rounded-full px-4 py-1.5 text-sm focus:outline-none transition-colors"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-xs font-semibold capitalize" style={{ color: 'var(--accent)' }}>{todayDay}</span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{todayDate}</span>
        </div>

        <Link to={ROUTES.UPLOAD} className="btn-primary flex items-center gap-2 py-1.5 px-4 text-sm hidden sm:flex">
          <PlusIcon size={16} />
          {t.newOrder}
        </Link>

        <div className="relative" ref={dropdownRef}>
          <div className="cursor-pointer transition-colors" style={{ color: 'var(--text-secondary)' }}
            onClick={() => setShowDropdown(!showDropdown)}>
            <BellIcon size={20} />
            {alerts.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                {alerts.length}
              </span>
            )}
          </div>

          {showDropdown && (
            <div className="absolute right-0 mt-4 w-64 rounded-lg shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
              <div className="px-4 py-2 mb-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{t.notifications}</div>
              </div>
              {alerts.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>{t.noAlerts}</div>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  {alerts.slice(0, 5).map(alert => (
                    <div key={alert.id} className="px-4 py-3 transition-colors"
                      style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <p className="text-xs leading-snug" style={{ color: 'var(--text-secondary)' }}>{alert.message}</p>
                      <span className="text-[10px] mt-1 block" style={{ color: 'var(--text-muted)' }}>
                        {alert.type === 'setup_required' ? 'Kurulum Gerekli' : 'Düşük Stok'}
                      </span>
                    </div>
                  ))}
                  {alerts.length > 5 && (
                    <div className="px-4 py-2 text-center" style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>+{alerts.length - 5} daha</span>
                    </div>
                  )}
                  <div className="p-2">
                    <Link to={ROUTES.DASHBOARD}
                      className="block w-full text-center py-1.5 rounded text-sm transition-colors"
                      style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                      onClick={() => setShowDropdown(false)}>
                      {t.viewAll}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="pl-4" style={{ borderLeft: '1px solid var(--border-color)' }}>
          <UserMenu />
        </div>
      </div>
    </header>
  )
}

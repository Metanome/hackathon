import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { ROUTES } from '../constants'
import { useAlerts } from '../hooks/useAlerts'

export default function Header({ onMenuClick }) {
  const { alerts } = useAlerts()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)
  
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  // Sync search input if URL changes externally
  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '')
  }, [searchParams])

  // Close dropdown when clicking outside
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
    <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-40 flex items-center justify-between px-4 sm:px-8">
      <div className="flex items-center flex-1 max-w-md">
        <button onClick={onMenuClick} className="md:hidden mr-3 text-slate-400 hover:text-white shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
        <input 
          type="text" 
          placeholder="Search inventory (press Enter)..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearch}
          className="w-full bg-slate-800/50 border border-slate-700/50 rounded-full px-4 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500/50 transition-colors hidden sm:block"
        />
      </div>
      
      <div className="flex items-center gap-6">
        <div className="text-sm text-slate-400 hidden sm:block">
          {today}
        </div>
        
        <Link to={ROUTES.UPLOAD} className="btn-primary py-1.5 px-4 text-sm hidden sm:block">
          + New Order
        </Link>

        <div className="relative" ref={dropdownRef}>
          <div 
            className="cursor-pointer hover:text-teal-400 text-slate-400 transition-colors"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            {alerts.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-slate-900">
                {alerts.length}
              </span>
            )}
          </div>

          {showDropdown && (
            <div className="absolute right-0 mt-4 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-2 border-b border-slate-700/50 mb-2">
                <div className="text-sm font-semibold text-slate-200">Notifications</div>
              </div>
              {alerts.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-slate-500">
                  No active alerts. All clear!
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  {alerts.slice(0, 5).map(alert => (
                    <div key={alert.id} className="px-4 py-3 border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                      <p className="text-xs text-slate-300 leading-snug">{alert.message}</p>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        {alert.type === 'setup_required' ? 'Requires Setup' : 'Low Stock'}
                      </span>
                    </div>
                  ))}
                  {alerts.length > 5 && (
                    <div className="px-4 py-2 text-center border-b border-slate-700/50">
                      <span className="text-xs text-slate-500">+{alerts.length - 5} more alerts</span>
                    </div>
                  )}
                  <div className="p-2">
                    <Link 
                      to={ROUTES.DASHBOARD} 
                      className="block w-full text-center bg-slate-700 hover:bg-slate-600 text-slate-200 py-1.5 rounded text-sm transition-colors"
                      onClick={() => setShowDropdown(false)}
                    >
                      View All on Dashboard
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3 pl-6 border-l border-slate-800">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-medium text-slate-200">Admin User</div>
            <div className="text-xs text-slate-500">Manager</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-teal-600/20 border border-teal-500/30 flex items-center justify-center text-teal-400 font-semibold text-sm">
            A
          </div>
        </div>
      </div>
    </header>
  )
}

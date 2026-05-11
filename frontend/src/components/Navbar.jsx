import { NavLink } from 'react-router-dom'
import { ROUTES } from '../constants'

const links = [
  { to: ROUTES.DASHBOARD, label: 'Dashboard' },
  { to: ROUTES.UPLOAD, label: 'Upload' },
  { to: ROUTES.INVENTORY, label: 'Inventory' },
  { to: ROUTES.ORDERS, label: 'Orders' },
  { to: ROUTES.SETTINGS, label: 'Settings' },
]

export default function Navbar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden" 
          onClick={onClose} 
        />
      )}
      
      <nav className={`fixed top-0 left-0 h-full w-56 bg-slate-900 border-r border-slate-800 flex flex-col z-50 transform transition-transform duration-200 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="px-5 py-6 border-b border-slate-800 flex justify-between items-center">
          <div>
            <div className="text-teal-400 font-bold text-lg leading-tight">Esnaf Tezgahı</div>
            <div className="text-slate-500 text-xs mt-0.5">AI Operations Platform</div>
          </div>
          <button onClick={onClose} className="md:hidden text-slate-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      <ul className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, label }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === ROUTES.DASHBOARD}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-teal-600/20 text-teal-400 border border-teal-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`
              }
            >
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="px-5 py-4 border-t border-slate-800 text-xs text-slate-600">
        Anadolu Doğal Kooperatifi
      </div>
      </nav>
    </>
  )
}

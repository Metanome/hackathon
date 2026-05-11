import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import Navbar from './components/Navbar'
import Header from './components/Header'
import Footer from './components/Footer'
import Dashboard from './pages/Dashboard'
import Upload from './pages/Upload'
import Inventory from './pages/Inventory'
import Orders from './pages/Orders'
import Settings from './pages/Settings'
import { ROUTES } from './constants'
import { SSEProvider } from './providers/SSEProvider'
import { ToastProvider } from './providers/ToastProvider'

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <BrowserRouter>
      <SSEProvider>
        <ToastProvider>
          <div className="flex min-h-screen bg-[#0F172A]">
            <Navbar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="flex-1 md:ml-56 flex flex-col min-w-0">
              <Header onMenuClick={() => setSidebarOpen(true)} />
              <main className="flex-1 p-4 sm:p-8 max-w-5xl mx-auto w-full">
                <Routes>
                  <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
                  <Route path={ROUTES.UPLOAD} element={<Upload />} />
                  <Route path={ROUTES.INVENTORY} element={<Inventory />} />
                  <Route path={ROUTES.ORDERS} element={<Orders />} />
                  <Route path={ROUTES.SETTINGS} element={<Settings />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </div>
        </ToastProvider>
      </SSEProvider>
    </BrowserRouter>
  )
}

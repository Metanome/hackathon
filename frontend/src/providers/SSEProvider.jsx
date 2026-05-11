import { createContext, useContext, useEffect, useState } from 'react'

const SSEContext = createContext()

export function SSEProvider({ children }) {
  const [lastUpdate, setLastUpdate] = useState(Date.now())

  useEffect(() => {
    // Determine the API base URL for the SSE connection
    // Vite handles proxying /api to the backend in dev, so we can just use the relative path
    const url = import.meta.env.VITE_API_URL 
      ? `${import.meta.env.VITE_API_URL}/api/events/stream` 
      : '/api/events/stream'

    const eventSource = new EventSource(url)

    eventSource.onmessage = (event) => {
      if (event.data === 'update') {
        console.log('[SSE] Received invalidation event from backend')
        setLastUpdate(Date.now())
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error)
      // EventSource will automatically try to reconnect
    }

    return () => {
      eventSource.close()
    }
  }, [])

  return (
    <SSEContext.Provider value={{ lastUpdate }}>
      {children}
    </SSEContext.Provider>
  )
}

export function useSSE() {
  return useContext(SSEContext)
}

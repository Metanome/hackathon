import { createContext, useContext, useEffect, useState } from 'react'

const SSEContext = createContext()

export function SSEProvider({ children }) {
  const [lastUpdate, setLastUpdate] = useState(Date.now())
  const [uploadStep, setUploadStep] = useState(0)

  useEffect(() => {
    // Determine the API base URL for the SSE connection
    // Vite handles proxying /api to the backend in dev, so we can just use the relative path
    const url = import.meta.env.VITE_API_URL 
      ? `${import.meta.env.VITE_API_URL}/api/events/stream` 
      : '/api/events/stream'

    const eventSource = new EventSource(url)

    eventSource.onmessage = (event) => {
      if (event.data === 'update') {
        setLastUpdate(Date.now())
      } else if (event.data?.startsWith('progress:')) {
        const step = parseInt(event.data.split(':')[1], 10)
        if (!isNaN(step)) setUploadStep(step)
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
    <SSEContext.Provider value={{ lastUpdate, uploadStep }}>
      {children}
    </SSEContext.Provider>
  )
}

export function useSSE() {
  return useContext(SSEContext)
}

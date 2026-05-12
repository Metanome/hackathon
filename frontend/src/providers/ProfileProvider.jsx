import { createContext, useContext, useState, useEffect } from 'react'
import { getProfile, updateProfile } from '../api/profile'

const ProfileContext = createContext(null)

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState({ display_name: '', store_name: '' })
  const [loading, setLoading] = useState(true)
  const [needsSetup, setNeedsSetup] = useState(false)

  useEffect(() => {
    getProfile()
      .then(data => {
        setProfile(data)
        if (!data.display_name || !data.store_name) setNeedsSetup(true)
      })
      .catch(() => setNeedsSetup(true))
      .finally(() => setLoading(false))
  }, [])

  const saveProfile = async (data) => {
    const updated = await updateProfile(data)
    setProfile(updated)
    setNeedsSetup(false)
    return updated
  }

  return (
    <ProfileContext.Provider value={{ profile, loading, needsSetup, setNeedsSetup, saveProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider')
  return ctx
}

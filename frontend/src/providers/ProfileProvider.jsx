import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { getProfile, updateProfile } from '../api/profile'
import { useTheme } from './ThemeProvider'

const ProfileContext = createContext(null)

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState({ display_name: '', store_name: '' })
  const [loading, setLoading] = useState(true)
  const [needsSetup, setNeedsSetup] = useState(false)
  const { setLang } = useTheme()
  const initDone = useRef(false)

  useEffect(() => {
    let retryId = null
    const load = () => {
      getProfile()
        .then(data => {
          setProfile(data)
          if (!initDone.current && data.language_preference) {
            setLang(data.language_preference)
            initDone.current = true
          }
          if (!data.display_name || !data.store_name) setNeedsSetup(true)
          setLoading(false)
        })
        .catch((err) => {
          if (err.response) {
            setNeedsSetup(true)
            setLoading(false)
          } else {
            setLoading(false)
            retryId = setTimeout(load, 5000)
          }
        })
    }
    load()
    return () => clearTimeout(retryId)
  }, [setLang])

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

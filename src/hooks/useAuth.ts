import { useState, type FormEvent } from 'react'
import { AUTH_CODE, AUTH_STORAGE_KEY } from '../config'

/** Manages the simple auth-code gate backed by sessionStorage. */
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.sessionStorage.getItem(AUTH_STORAGE_KEY) === 'true'
  })
  const [authInput, setAuthInput] = useState('')
  const [authError, setAuthError] = useState('')

  function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (authInput.trim() !== AUTH_CODE) {
      setAuthError('Mã authen không đúng.')
      setAuthInput('')
      return
    }

    window.sessionStorage.setItem(AUTH_STORAGE_KEY, 'true')
    setAuthError('')
    setIsAuthenticated(true)
  }

  return { isAuthenticated, authInput, setAuthInput, authError, unlock }
}

'use client'

import React, { useState } from 'react'
import { LogOut, Loader2 } from 'lucide-react'

export default function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    if (isLoading) return
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
      })
      if (res.ok) {
        // Force complete page reload to login to reset all Client-side state
        window.location.href = '/login'
      } else {
        console.error('Logout failed')
        window.location.href = '/login' // Force redirect anyway as fallback
      }
    } catch (err) {
      console.error('Error during logout:', err)
      window.location.href = '/login'
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50"
      title="Cerrar sesión"
    >
      {isLoading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <LogOut className="h-3.5 w-3.5" />
      )}
      <span>Salir</span>
    </button>
  )
}
